import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { type RefObject, useEffect, useImperativeHandle, useLayoutEffect, useMemo } from 'react';
import { AnimationMixer, type Box3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

import { longestClipDuration, playAllOnce, settledBounds } from '../internal/animation';
import { createDeferredDisposer, disposeObject3D } from '../internal/dispose';
import { configureGltfLoader } from '../internal/loaders';
import { indexNodes } from '../internal/mesh-tree';
import { describeModel } from '../internal/model-info';
import { prefersReducedMotion } from '../internal/motion';
import { MeshOverrideApplier } from '../internal/overrides';
import type { DecoderPaths, MeshOverrides, ModelInfo } from '../types';

export interface ModelController {
  replayAnimations: () => void;
}

export interface ModelProps {
  url: string;
  decoders: DecoderPaths;
  playAnimationsOnLoad: boolean;
  meshOverrides: MeshOverrides;
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
  const overrides = useMemo(() => new MeshOverrideApplier(indexNodes(scene)), [scene]);

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

  // Free GPU memory, decoded textures and the loader cache entry when the model goes away.
  // Deferred so StrictMode's dev-only unmount/remount doesn't destroy resources still in use.
  const disposer = useMemo(
    () =>
      createDeferredDisposer(() => {
        mixer.uncacheRoot(scene);
        overrides.dispose(); // frees per-mesh material clones

        disposeObject3D(gltf.scene, { closeImageBitmaps: true });
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

  return <primitive object={scene} />;
}
