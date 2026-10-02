import { useLoader, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

import { configureGltfLoader } from '../internal/loaders';
import { describeModel } from '../internal/model-info';
import type { DecoderPaths, ModelInfo } from '../types';

export interface ModelProps {
  url: string;
  decoders: DecoderPaths;
  onProgress: (event: ProgressEvent) => void;
  onLoaded: (info: ModelInfo) => void;
}

/** Loads a GLB/glTF (suspends while loading) and renders a private copy of its scene. */
export function Model({ url, decoders, onProgress, onLoaded }: ModelProps) {
  const renderer = useThree((state) => state.gl);
  const gltf = useLoader(
    GLTFLoader,
    url,
    (loader) => configureGltfLoader(loader, decoders, renderer),
    onProgress,
  );

  // useLoader caches by URL; clone so two viewers of the same model don't fight over one
  // Object3D (an object can only have one parent). SkeletonUtils keeps skinned meshes intact.
  const scene = useMemo(() => cloneSkinned(gltf.scene), [gltf.scene]);

  useEffect(() => {
    onLoaded(describeModel(scene, gltf.animations));
  }, [scene, gltf.animations, onLoaded]);

  return <primitive object={scene} />;
}
