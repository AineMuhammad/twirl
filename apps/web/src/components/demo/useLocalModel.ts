'use client';

import { type DragEvent, useCallback, useEffect, useRef, useState } from 'react';

import { checkLocalModel } from '@/lib/local-model';

export interface LocalModel {
  name: string;
  url: string;
}

/**
 * Loads a model from the user's device (file picker or drag-and-drop) after validating it.
 * The file stays in the browser as a blob: URL, released when replaced or on unmount.
 */
export function useLocalModel(onLoad: (url: string) => void) {
  const [model, setModel] = useState<LocalModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0); // dragenter/leave fire for every child element
  const current = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (current.current) URL.revokeObjectURL(current.current);
    },
    [],
  );

  const open = useCallback(
    async (file: File) => {
      const check = await checkLocalModel(file);
      if (!check.ok) {
        setError(check.message);
        return;
      }
      if (current.current) URL.revokeObjectURL(current.current);
      const url = URL.createObjectURL(file);
      current.current = url;
      setError(null);
      setModel({ name: file.name, url });
      onLoad(url);
    },
    [onLoad],
  );

  const hasFiles = (e: DragEvent) => e.dataTransfer.types.includes('Files');
  const dropHandlers = {
    onDragEnter: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current += 1;
      setDragging(true);
    },
    onDragOver: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    },
    onDragLeave: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDragging(false);
    },
    onDrop: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current = 0;
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) void open(file);
    },
  };

  return { model, error, dismissError: () => setError(null), dragging, open, dropHandlers };
}
