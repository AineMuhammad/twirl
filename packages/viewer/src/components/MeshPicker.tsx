import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { type Object3D, Raycaster, Vector2 } from 'three';

import { scheduleBvhBuild } from '../internal/bvh';
import type { NodeId } from '../internal/mesh-tree';
import { isClick, pickMeshId, type PointerSample } from '../internal/picking';

export interface MeshPickerProps {
  root: Object3D;
  idOf: ReadonlyMap<Object3D, NodeId>;
  onSelect: (id: NodeId | null) => void;
}

/**
 * Raycasts once per click (not on every pointer move) so dense models stay smooth while
 * orbiting, against per-mesh BVHs built in idle time after load. Drags beyond a few pixels are
 * treated as orbiting, not selection.
 */
export function MeshPicker({ root, idOf, onSelect }: MeshPickerProps) {
  const element = useThree((state) => state.gl.domElement);
  const getState = useThree((state) => state.get);
  const latest = useRef(onSelect);
  useEffect(() => {
    latest.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const raycaster = new Raycaster();
    raycaster.firstHitOnly = true; // nearest hit per mesh is all we need
    const ndc = new Vector2();
    const bvh = scheduleBvhBuild(root);
    let down: PointerSample | null = null;

    const onDown = (e: PointerEvent) => {
      down = e.isPrimary ? { x: e.clientX, y: e.clientY, time: e.timeStamp } : null;
    };
    const onUp = (e: PointerEvent) => {
      const start = down;
      down = null;
      if (!start || !e.isPrimary || e.button > 0) return;
      if (!isClick(start, { x: e.clientX, y: e.clientY, time: e.timeStamp })) return;
      const rect = element.getBoundingClientRect();
      ndc.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      bvh.flush();
      raycaster.setFromCamera(ndc, getState().camera);
      latest.current(pickMeshId(raycaster.intersectObject(root, true), idOf));
    };

    element.addEventListener('pointerdown', onDown);
    element.addEventListener('pointerup', onUp);
    return () => {
      bvh.cancel();
      element.removeEventListener('pointerdown', onDown);
      element.removeEventListener('pointerup', onUp);
    };
  }, [element, getState, root, idOf]);

  return null;
}
