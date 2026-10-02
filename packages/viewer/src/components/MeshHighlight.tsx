import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { BoxHelper, type LineBasicMaterial, type Object3D } from 'three';

export interface MeshHighlightProps {
  target: Object3D;
  color?: string;
}

/** Outlines a node's bounding box, drawn on top of the model; follows it while it animates. */
export function MeshHighlight({ target, color = '#2563eb' }: MeshHighlightProps) {
  const helper = useMemo(() => {
    const box = new BoxHelper(target, color);
    const material = box.material as LineBasicMaterial;
    material.depthTest = false;
    material.transparent = true;
    box.renderOrder = 999;
    return box;
  }, [target, color]);

  useEffect(
    () => () => {
      helper.geometry.dispose();
      (helper.material as LineBasicMaterial).dispose();
    },
    [helper],
  );

  useFrame(() => helper.update());

  return <primitive object={helper} />;
}
