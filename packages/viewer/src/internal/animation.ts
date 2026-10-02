import { type AnimationClip, AnimationMixer, Box3, LoopOnce, type Object3D } from 'three';

export function longestClipDuration(clips: readonly AnimationClip[]) {
  return clips.reduce((max, clip) => Math.max(max, clip.duration), 0);
}

/** Configures every clip to play once and hold its last frame, then starts them together. */
export function playAllOnce(mixer: AnimationMixer, clips: readonly AnimationClip[]) {
  mixer.stopAllAction();
  for (const clip of clips) {
    const action = mixer.clipAction(clip);
    action.reset();
    action.setLoop(LoopOnce, 1);
    action.clampWhenFinished = true;
    action.play();
  }
}

/**
 * Bounds of `root` once every clip has finished. Some models (e.g. an "assembly" animation)
 * start in an exploded pose, so framing the rest pose would be wrong.
 *
 * Uses a throwaway mixer and restores the original transforms before returning.
 */
export function settledBounds(root: Object3D, clips: readonly AnimationClip[]): Box3 {
  if (clips.length === 0) {
    root.updateMatrixWorld(true);
    return new Box3().setFromObject(root);
  }
  const mixer = new AnimationMixer(root);
  try {
    playAllOnce(mixer, clips);
    mixer.setTime(longestClipDuration(clips));
    root.updateMatrixWorld(true);
    return new Box3().setFromObject(root);
  } finally {
    // Stopping releases the bindings, which restores the animated properties' original values.
    mixer.stopAllAction();
    mixer.uncacheRoot(root);
    root.updateMatrixWorld(true);
  }
}
