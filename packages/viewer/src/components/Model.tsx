import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { type RefObject, useEffect, useImperativeHandle, useLayoutEffect, useMemo } from 'react';
import { AnimationMixer, type Box3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

import { longestClipDuration, playAllOnce, settledBounds } from '../internal/animation';
import { createDeferredDisposer, disposeObject3D } from '../internal/dispose';
import { configureGltfLoader } from '../internal/loaders';
import { indexNodes, type NodeId } from '../internal/mesh-tree';
import { describeModel } from '../internal/model-info';
import { prefersReducedMotion } from '../internal/motion';
import { MeshOverrideApplier } from '../internal/overrides';
import type { DecoderPaths, MeshOverrides, ModelInfo } from '../types';
import { MeshHighlight } from './MeshHighlight';
import { MeshPicker } from './MeshPicker';

export interface ModelController {
  replayAnimations: () => void;
}

export interface ModelProps {
  url: string;
  decoders: DecoderPaths;
  playAnimationsOnLoad: boolean;
  meshOverrides: MeshOverrides;
  highlightedMeshId: NodeId | null;
  onMeshSelect: ((id: NodeId | null) => void) | undefined;
  controllerRef: RefObject<ModelController | null>;
  onProgress: (event: ProgressEvent) => void;
  /** `bounds` is the model's world-space box once its animations have finished. */
  onLoaded: (info: ModelInfo, bounds: Box3) => void;
}

/** Loads a GLB/glTF (suspends while loading) and renders a private copy of its scene. */
export function Model({
  url,
  decoders,
  playAnimationsOnLoad,
  meshOverrides,
  highlightedMeshId,
  onMeshSelect,
  controllerRef,
  onProgress,
  onLoaded,
}: ModelProps) {
  const renderer = useThree((state) => state.gl);
  const gltf = useLoader(
    GLTFLoader,
    url,
    (loader) => configureGltfLoader(loader, decoders, renderer),
    onProgress,
  );
  const clips = gltf.animations;

  // useLoader caches by URL; clone so two viewers of the same model don't fight over one
  // Object3D (an object can only have one parent). SkeletonUtils keeps skinned meshes intact.
  const scene = useMemo(() => {
    const copy = cloneSkinned(gltf.scene);
    copy.traverse((object) => {
      // Whether shadows actually render is decided by the key light (castShadow), not here.
      object.castShadow = true;
      object.receiveShadow = true;
    });
    return copy;
  }, [gltf.scene]);
  const mixer = useMemo(() => new AnimationMixer(scene), [scene]);
  const index = useMemo(() => indexNodes(scene), [scene]);
  const idOf = useMemo(() => new Map([...index].map(([id, object]) => [object, id])), [index]);
  const overrides = useMemo(() => new MeshOverrideApplier(index), [index]);
  const highlighted = highlightedMeshId ? index.get(highlightedMeshId) : undefined;

  // Layout effect so the first frame already shows the overrides.
  useLayoutEffect(() => {
    overrides.apply(meshOverrides);
  }, [overrides, meshOverrides]);

  useEffect(() => {
    onLoaded(describeModel(scene, clips), settledBounds(scene, clips));
  }, [scene, clips, onLoaded]);

  useEffect(() => {
    if (!playAnimationsOnLoad || clips.length === 0) return;
    playAllOnce(mixer, clips);
    // Respect reduced motion: show the finished pose without animating.
    if (prefersReducedMotion()) mixer.setTime(longestClipDuration(clips));
    return () => {
      mixer.stopAllAction();
    };
  }, [mixer, clips, playAnimationsOnLoad]);

  // Free GPU memory and the loader cache entry when the model goes away; decoded images are then
  // garbage-collected. They're deliberately not closed: a texture still referenced after
  // unmount would be re-uploaded as 0x0, raising WebGL errors that can stall rendering on real
  // GPUs (switching chair → jeep did). Deferred so StrictMode's dev-only remount keeps them.
  const disposer = useMemo(
    () =>
      createDeferredDisposer(() => {
        mixer.uncacheRoot(scene);
        overrides.dispose(); // frees per-mesh material clones
        disposeObject3D(gltf.scene);
        useLoader.clear(GLTFLoader, url);
      }),
    [mixer, overrides, scene, gltf.scene, url],
  );
  useEffect(() => {
    disposer.cancel();
    return () => disposer.schedule();
  }, [disposer]);

  useImperativeHandle(
    controllerRef,
    () => ({
      replayAnimations: () => {
        if (clips.length === 0) return;
        playAllOnce(mixer, clips);
        if (prefersReducedMotion()) mixer.setTime(longestClipDuration(clips));
      },
    }),
    [mixer, clips],
  );

  useFrame((_, delta) => {
    mixer.update(delta);
  });

  return (
    <>
      <primitive object={scene} />
      {highlighted && <MeshHighlight target={highlighted} />}
      {onMeshSelect && <MeshPicker root={scene} idOf={idOf} onSelect={onMeshSelect} />}
    </>
  );
}
