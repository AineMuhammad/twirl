import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { type RefObject, useEffect, useImperativeHandle, useMemo } from 'react';
import { AnimationMixer, type Box3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

import { longestClipDuration, playAllOnce, settledBounds } from '../internal/animation';
import { configureGltfLoader } from '../internal/loaders';
import { describeModel } from '../internal/model-info';
import { prefersReducedMotion } from '../internal/motion';
import type { DecoderPaths, ModelInfo } from '../types';

export interface ModelController {
  replayAnimations: () => void;
}

export interface ModelProps {
  url: string;
  decoders: DecoderPaths;
  playAnimationsOnLoad: boolean;
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
  const scene = useMemo(() => cloneSkinned(gltf.scene), [gltf.scene]);
  const mixer = useMemo(() => new AnimationMixer(scene), [scene]);

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

  useEffect(() => () => mixer.uncacheRoot(scene), [mixer, scene]);

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
