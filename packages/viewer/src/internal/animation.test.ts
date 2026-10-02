import {
  AnimationClip,
  AnimationMixer,
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  VectorKeyframeTrack,
} from 'three';
import { describe, expect, it } from 'vitest';

import { longestClipDuration, playAllOnce, settledBounds } from './animation';

function scene() {
  const root = new Group();
  const part = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
  part.name = 'Part';
  part.position.set(0, 3, 0); // starts "exploded", 3 units up
  root.add(part);
  // Drops the part to the floor over 2 seconds.
  const clip = new AnimationClip('Assemble', 2, [
    new VectorKeyframeTrack('Part.position', [0, 2], [0, 3, 0, 0, 0, 0]),
  ]);
  return { root, part, clip };
}

describe('settledBounds', () => {
  it('measures the pose after all clips finish', () => {
    const { root, clip } = scene();
    const box = settledBounds(root, [clip]);
    expect(box.min.y).toBeCloseTo(-0.5);
    expect(box.max.y).toBeCloseTo(0.5);
  });

  it('restores the original transforms afterwards', () => {
    const { root, part, clip } = scene();
    settledBounds(root, [clip]);
    expect(part.position.y).toBeCloseTo(3);
  });

  it('uses the current pose when there are no clips', () => {
    const { root } = scene();
    expect(settledBounds(root, []).min.y).toBeCloseTo(2.5);
  });
});

describe('longestClipDuration', () => {
  it('returns the longest duration, or 0', () => {
    expect(longestClipDuration([])).toBe(0);
    expect(
      longestClipDuration([new AnimationClip('a', 3, []), new AnimationClip('b', 5, [])]),
    ).toBe(5);
  });
});

describe('playAllOnce', () => {
  it('holds the last frame instead of looping', () => {
    const { root, part, clip } = scene();
    const mixer = new AnimationMixer(root);
    playAllOnce(mixer, [clip]);
    mixer.update(1);
    expect(part.position.y).toBeCloseTo(1.5);
    mixer.update(10);
    expect(part.position.y).toBeCloseTo(0);
  });

  it('restarts from the beginning when called again (replay)', () => {
    const { root, part, clip } = scene();
    const mixer = new AnimationMixer(root);
    playAllOnce(mixer, [clip]);
    mixer.update(10);
    playAllOnce(mixer, [clip]);
    mixer.update(0);
    expect(part.position.y).toBeCloseTo(3);
  });
});
