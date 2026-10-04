'use client';

import { ContactShadows, Environment, Html, Lightformer, useGLTF } from '@react-three/drei';
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber';
import { Fragment, memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { hostedSampleUrl } from '@/lib/sample-urls';

import { FABRICS, fabricIndex, PARTS, type StoryProgress } from './chapters';

const MODEL_URL = hostedSampleUrl('sofa.glb');
const DRACO_PATH = '/decoders/draco/';
/** The model is scaled so its largest side is this many units. */
const MODEL_SIZE = 1.6;
const HIGHLIGHT = new THREE.Color('#3a6198');

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** 0 before `a`, 1 after `b`, eased in between. */
const smooth = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const damp = (current: number, target: number, rate: number, dt: number) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-rate * dt));

/** Where the camera sits through the story, keyed by story position (see chapters.ts). */
interface Shot {
  at: number;
  azimuth: number;
  elevation: number;
  distance: number;
  /** Height the camera looks at, in model heights. */
  lookY: number;
  /** Sideways shift of the frame, so the chair can sit left of the embed panel. */
  shift: number;
}
const TURN = Math.PI * 2;
const SHOTS: Shot[] = [
  { at: 0, azimuth: 0.7, elevation: 0.16, distance: 5, lookY: 0.5, shift: 0 },
  { at: 1.15, azimuth: 0.45, elevation: 0.22, distance: 3.7, lookY: 0.45, shift: 0 },
  { at: 1.5, azimuth: 0.45, elevation: 0.3, distance: 3.6, lookY: 0.45, shift: 0 },
  { at: 2.5, azimuth: 0.45 + TURN, elevation: 0.3, distance: 3.6, lookY: 0.45, shift: 0 },
  { at: 3.2, azimuth: 0.3 + TURN, elevation: 0.12, distance: 3.1, lookY: 0.42, shift: 0 },
  { at: 3.55, azimuth: 0.3 + TURN, elevation: 0.12, distance: 3.1, lookY: 0.42, shift: 0 },
  { at: 4.25, azimuth: 0.75 + TURN, elevation: 0.14, distance: 4.4, lookY: 0.5, shift: 0.55 },
];

function shotAt(t: number): Omit<Shot, 'at'> {
  const i = SHOTS.findIndex((s) => s.at > t);
  const a = SHOTS[Math.max(0, i - 1)];
  const b = SHOTS[i];
  if (!a) throw new Error('No camera shots');
  if (!b || i === 0) return i === 0 ? a : (SHOTS[SHOTS.length - 1] ?? a);
  const k = smooth(a.at, b.at, t);
  const mix = (x: number, y: number) => x + (y - x) * k;
  return {
    azimuth: mix(a.azimuth, b.azimuth),
    elevation: mix(a.elevation, b.elevation),
    distance: mix(a.distance, b.distance),
    lookY: mix(a.lookY, b.lookY),
    shift: mix(a.shift, b.shift),
  };
}

/** Parts the story works with (names in the sample model). */
const PART_NODES = ['iron', 'Chair', 'Pillow_01', 'Pillow_02'];
/** Pause before the chair starts assembling, so the headline lands first. */
const ASSEMBLY_DELAY = 0.4;

interface Part {
  name: string;
  node: THREE.Object3D;
  /** Where the part sits once the chair is assembled. */
  assembled: THREE.Vector3;
  /** Whether the model's own animation moves this part. */
  animated: boolean;
  materials: THREE.MeshStandardMaterial[];
  /** Top centre of the part, in its own space: where its label sits. */
  labelAt: THREE.Vector3;
}

/**
 * The sample chair rests "exploded"; its own animation brings the parts together. We measure and
 * frame the assembled chair (the animation's last frame), then play the animation from the start.
 */
function useChair() {
  const gltf = useGLTF(MODEL_URL, DRACO_PATH);
  return useMemo(() => {
    const scene = gltf.scene.clone(true);
    const mixer = new THREE.AnimationMixer(scene);
    const actions = gltf.animations.map((clip) => {
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      return action;
    });
    const duration = Math.max(0, ...gltf.animations.map((clip) => clip.duration));
    const animatedNodes = new Set(
      gltf.animations.flatMap((clip) => clip.tracks.map((track) => track.name.split('.')[0])),
    );

    // Jump to the assembled pose to measure it.
    actions.forEach((action) => action.play());
    mixer.setTime(duration);
    scene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = MODEL_SIZE / Math.max(size.x, size.y, size.z);

    const parts: Part[] = [];
    for (const name of PART_NODES) {
      const node = scene.getObjectByName(name);
      if (!node) continue;
      const materials: THREE.MeshStandardMaterial[] = [];
      node.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        // Own copies, so tinting one part never touches another.
        const material = (mesh.material as THREE.MeshStandardMaterial).clone();
        mesh.material = material;
        materials.push(material);
      });
      const nodeBox = new THREE.Box3().setFromObject(node);
      const labelAt = node.worldToLocal(
        new THREE.Vector3(
          (nodeBox.min.x + nodeBox.max.x) / 2,
          nodeBox.max.y,
          (nodeBox.min.z + nodeBox.max.z) / 2,
        ),
      );
      parts.push({
        name,
        node,
        assembled: node.position.clone(),
        animated: animatedNodes.has(node.name),
        materials,
        labelAt,
      });
    }

    // Back to the start, ready to play.
    actions.forEach((action) => action.reset());
    mixer.setTime(0);

    return {
      scene,
      parts,
      mixer,
      actions,
      duration,
      size,
      scale,
      offset: new THREE.Vector3(-center.x * scale, -box.min.y * scale, -center.z * scale),
      height: size.y * scale,
    };
  }, [gltf]);
}

/** Rests a part assembled (unless the animation is moving it), lifted and glowing as asked. */
function placePart(
  part: Part,
  playing: boolean,
  { lift, glow }: { lift: number; glow: number },
  height: number,
) {
  if (!(playing && part.animated)) part.node.position.copy(part.assembled);
  part.node.position.y += lift * height;
  for (const material of part.materials) {
    material.emissive.copy(HIGHLIGHT);
    material.emissiveIntensity = glow;
  }
}

interface SceneProps {
  /** Called once the chair has finished assembling. */
  onAssembled: () => void;
  progress: StoryProgress;
  activePart: number;
  showLabels: boolean;
  reducedMotion: boolean;
}

function ChairStory({ progress, activePart, showLabels, reducedMotion, onAssembled }: SceneProps) {
  const { scene, parts, mixer, actions, duration, size, scale, offset, height } = useChair();
  // Seconds into the assembly; reduced motion starts with the chair already built.
  const assembly = useRef(reducedMotion ? Infinity : -ASSEMBLY_DELAY);
  // Each part's current lift and glow, eased toward the highlight.
  useEffect(() => {
    if (reducedMotion) onAssembled();
  }, [reducedMotion, onAssembled]);
  const emphasis = useRef(new Map<string, { lift: number; glow: number }>());
  const camera = useThree((s) => s.camera);
  const seat = parts.find((p) => p.name === 'Chair');
  const seatBase = useMemo(() => seat?.materials.map((m) => m.color.clone()) ?? [], [seat]);
  const look = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Color(), []);
  const viewRef = useRef(shotAt(0));

  // Start where the story starts, without easing in from the origin.
  useLayoutEffect(() => {
    viewRef.current = shotAt(progress.current);
  }, [progress]);

  useFrame((state, delta) => {
    const t = progress.current;
    const dt = Math.min(delta, 0.1);
    const time = reducedMotion ? 0 : state.clock.elapsedTime;

    // The chair assembles once, on its own; after that, scrolling drives everything.
    const playing = assembly.current < duration;
    if (playing) {
      const before = assembly.current;
      assembly.current += dt;
      if (assembly.current >= duration) onAssembled();
      if (before < 0 && assembly.current >= 0) actions.forEach((action) => action.play());
      if (assembly.current >= 0) mixer.update(before < 0 ? assembly.current : dt);
    }
    const highlighted = PARTS[activePart]?.node;
    for (const part of parts) {
      const prev = emphasis.current.get(part.name) ?? { lift: 0, glow: 0 };
      const on = part.name === highlighted;
      const next = {
        lift: damp(prev.lift, on ? 0.06 : 0, 8, dt),
        glow: damp(prev.glow, on ? 0.22 : 0, 8, dt),
      };
      emphasis.current.set(part.name, next);
      placePart(part, playing, next, size.y);
    }

    // The seat fabric follows the colour chapter.
    const fabric = FABRICS[fabricIndex(t)];
    seat?.materials.forEach((material, i) => {
      if (fabric?.hex) target.set(fabric.hex);
      else target.copy(seatBase[i] ?? material.color);
      material.color.lerp(target, 1 - Math.exp(-6 * dt));
    });

    // Camera: follow the shot list, eased so a flick of the wheel still feels smooth.
    const shot = shotAt(t);
    const view = viewRef.current;
    const rate = 5;
    view.azimuth = damp(view.azimuth, shot.azimuth, rate, dt);
    view.elevation = damp(view.elevation, shot.elevation, rate, dt);
    view.distance = damp(view.distance, shot.distance, rate, dt);
    view.lookY = damp(view.lookY, shot.lookY, rate, dt);
    view.shift = damp(view.shift, shot.shift, rate, dt);
    const sway = reducedMotion ? 0 : Math.sin(time * 0.25) * 0.08 * (1 - smooth(0, 0.8, t));
    const az = view.azimuth + sway;
    look.set(0, view.lookY * height, 0);
    right.set(Math.cos(az), 0, -Math.sin(az)).multiplyScalar(view.shift);
    look.add(right);
    camera.position.set(
      look.x + view.distance * Math.cos(view.elevation) * Math.sin(az),
      look.y + view.distance * Math.sin(view.elevation),
      look.z + view.distance * Math.cos(view.elevation) * Math.cos(az),
    );
    camera.lookAt(look);
  });

  return (
    <>
      <group position={offset} scale={scale}>
        <primitive object={scene} />
      </group>
      {parts.map((part) => {
        const index = PARTS.findIndex((p) => p.node === part.name);
        const info = PARTS[index];
        if (!info) return null;
        return (
          <Fragment key={part.name}>
            {createPortal(
              <Html
                position={part.labelAt}
                center
                zIndexRange={[20, 0]}
                style={{ pointerEvents: 'none' }}
              >
                <span
                  aria-hidden
                  className={`-mt-8 block rounded-full px-3 py-1 text-[13px] font-medium whitespace-nowrap shadow-sm ring-1 transition-all duration-500 ${showLabels ? 'visible opacity-100' : 'invisible translate-y-1 opacity-0'} ${index === activePart ? 'bg-brand-600 text-white ring-brand-700' : 'bg-surface text-ink ring-line'}`}
                >
                  {info.label}
                </span>
              </Html>,
              part.node,
            )}
          </Fragment>
        );
      })}
      <ContactShadows
        position={[0, 0.001, 0]}
        scale={5}
        blur={2.6}
        far={2.2}
        opacity={0.38}
        color="#4a2f1f"
        resolution={512}
      />
    </>
  );
}

/** Warm studio light built from soft panels: no files to download. */
function Studio() {
  return (
    <Environment resolution={256} environmentIntensity={0.9}>
      <color attach="background" args={['#3a2d24']} />
      <Lightformer
        form="rect"
        intensity={3}
        color="#ffe6c8"
        position={[-3, 3, 3]}
        scale={[5, 4, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1.4}
        color="#fff3e2"
        position={[4, 2, 2]}
        scale={[4, 3, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1.2}
        color="#d8e4ff"
        position={[0, 3, -4]}
        scale={[6, 2, 1]}
      />
      <Lightformer form="circle" intensity={2} color="#fff8ee" position={[0, 6, 0]} scale={4} />
    </Environment>
  );
}

/**
 * The landing page's 3D story: the sample chair, driven by how far the visitor has scrolled.
 * Renders only while `active` (the story is on screen).
 */
export const StoryCanvas = memo(function StoryCanvas({
  active,
  ...props
}: SceneProps & { active: boolean }) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.75]}
      camera={{ fov: 32, near: 0.05, far: 50, position: [3, 1.2, 3] }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      <Studio />
      <directionalLight position={[-2, 4, 3]} intensity={0.8} color="#fff1df" />
      <ChairStory {...props} />
    </Canvas>
  );
});

useGLTF.preload(MODEL_URL, DRACO_PATH);
