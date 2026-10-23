import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  Box3,
  type Group,
  type Material,
  type Mesh,
  type MeshPhysicalMaterial,
  type MeshStandardMaterial,
  type Object3D,
  Raycaster,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { ensureBvh } from '../internal/bvh';
import { configureGltfLoader } from '../internal/loaders';
import {
  FRONT_ARC,
  findRoomShells,
  freeOrbitDistance,
  isBehindShell,
  kelvinToColor,
  readRoomAnchors,
  roomInterior,
} from '../internal/room';
import type { Stage } from '../internal/stage';
import type { DecoderPaths, RoomMood } from '../types';
import { RoomLighting } from './RoomLighting';
import { type OrbitLimits, VIEW_GLIDE_SECONDS } from '../internal/views';

export interface RoomProps {
  url: string;
  mood: RoomMood;
  /** Where the product stands: the room is moved so its product spot is right under it. */
  stage: Stage;
  decoders: DecoderPaths;
  shadowMapSize: number;
  onProgress: (event: ProgressEvent) => void;
  /** The product's zoom range: the room narrows the zoom-out to its free space. */
  minDistance: number;
  maxDistance: number;
  /** Where the camera may orbit in this room (its open side and free space). */
  onOrbitLimits: (limits: OrbitLimits) => void;
  /** The room has loaded; its lighting is being prepared (shaders compiled, first frames). */
  onLighting: () => void;
  /** The room is lit and rendering: safe to show. */
  onReady: () => void;
}

/** Lamp glass that glows when its lamp is on (by name, as exported from the room's scene). */
const GLOWING_GLASS = /wall_lamp_glass/i;

function setGlow(materials: MeshStandardMaterial[], intensity: number) {
  const warm = kelvinToColor(3800);
  for (const material of materials) {
    material.emissive.copy(warm);
    material.emissiveIntensity = intensity;
  }
}

function meshesOf(objects: Object3D[]) {
  const out: Mesh[] = [];
  for (const object of objects) {
    object.traverse((node) => {
      if ((node as Mesh).isMesh) out.push(node as Mesh);
    });
  }
  return out;
}

/** Gives shell meshes their own materials, so hiding one wall never hides another sharing paint. */
function ownMaterials(meshes: Mesh[]) {
  for (const mesh of meshes) {
    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map((m) => m.clone())
      : mesh.material.clone();
    for (const m of [mesh.material].flat()) {
      m.userData.depthWrite = m.depthWrite;
      m.userData.opacity = m.opacity;
      m.userData.transparent = m.transparent;
    }
  }
}

/**
 * Hides walls from the camera (dollhouse view) without letting light through them: they stop
 * drawing colour and depth, but the shadow pass uses its own depth material, so they still cast
 * the sun's shadow.
 */
function setHidden(meshes: Mesh[], hidden: boolean) {
  for (const mesh of meshes) {
    for (const material of [mesh.material].flat()) {
      if (material.colorWrite === !hidden) continue;
      material.colorWrite = !hidden;
      material.depthWrite = hidden ? false : Boolean(material.userData.depthWrite);
    }
  }
}

/** See-through materials (window glass, frame glass) let light through instead of shadowing. */
function isSeeThrough(material: Material) {
  const physical = material as MeshPhysicalMaterial;
  return material.transparent || (physical.transmission ?? 0) > 0 || /glass/i.test(material.name);
}

/** Things the camera may pass over without colliding: the floor and rug it looks down at. */
const NO_COLLISION = /Floor|Rug/i;
/** How far inside the walls the camera stays. */
const CAMERA_CLEARANCE_M = 0.2;
/** Padding around each piece of furniture, for working out how far the camera may zoom out. */
const CAMERA_RADIUS_M = 0.25;

/** Temporarily makes every collider's material transparent (to compile that variant too). */
function setTransparentForCompile(meshes: Mesh[], on: boolean) {
  for (const mesh of meshes) {
    for (const material of [mesh.material].flat()) {
      const transparent = on || Boolean(material.userData.transparent);
      if (material.transparent !== transparent) {
        material.transparent = transparent;
        material.needsUpdate = true;
      }
    }
  }
}

/** Resolves after `count` animation frames. */
function afterFrames(count: number) {
  return new Promise<void>((resolve) => {
    const step = (left: number) =>
      left <= 0 ? resolve() : requestAnimationFrame(() => step(left - 1));
    step(count);
  });
}

/** Opacity furniture fades to while it's between the camera and the product, or right by it. */
const FADED_OPACITY = 0.15;
/** Furniture this close to the camera fades too, so nothing crowds the foreground. */
const NEAR_CAMERA_M = 0.5;

/** Meshes on the line from the camera to the product (stopping `margin` short of its centre). */
function meshesBetween(
  raycaster: Raycaster,
  from: Vector3,
  to: Vector3,
  meshes: Mesh[],
  margin: number,
): Set<Object3D> {
  const direction = to.clone().sub(from);
  const distance = direction.length();
  raycaster.set(from, direction.divideScalar(distance || 1));
  raycaster.far = Math.max(0, distance - margin);
  return new Set(raycaster.intersectObjects(meshes, false).map((hit) => hit.object));
}

/** Fades a mesh's (own) materials toward `target` opacity; returns the new opacity. */
function fadeTo(mesh: Mesh, current: number, target: number, dt: number) {
  const next = current + (target - current) * (1 - Math.exp(-10 * dt));
  const value = Math.abs(next - target) < 0.01 ? target : next;
  for (const material of [mesh.material].flat()) {
    const original = material.userData.opacity as number;
    material.opacity = original * value;
    // Only blend while faded: transparent meshes sort and shade differently.
    const transparent = value < 1 || Boolean(material.userData.transparent);
    if (material.transparent !== transparent) {
      material.transparent = transparent;
      material.needsUpdate = true; // picks the precompiled variant (see setTransparentForCompile)
    }
    material.depthWrite = value >= 1 && Boolean(material.userData.depthWrite);
  }
  return value;
}

export function Room({
  url,
  mood,
  stage,
  decoders,
  shadowMapSize,
  onProgress,
  onLighting,
  onReady,
  minDistance,
  maxDistance,
  onOrbitLimits,
}: RoomProps) {
  const renderer = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);
  const gltf = useLoader(
    GLTFLoader,
    url,
    (loader) => configureGltfLoader(loader, decoders, renderer),
    onProgress,
  );

  const room = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const glass: MeshStandardMaterial[] = [];
    const meshes: Mesh[] = [];
    scene.traverse((node) => {
      const mesh = node as Mesh;
      if (!mesh.isMesh) return;
      meshes.push(mesh);
      const materials = [mesh.material].flat() as Material[];
      mesh.castShadow = !materials.some(isSeeThrough);
      mesh.receiveShadow = true;
    });
    const shells = findRoomShells(scene).map((shell) => ({
      ...shell,
      meshes: meshesOf(shell.objects),
    }));
    for (const shell of shells) ownMaterials(shell.meshes);
    const onShells = new Set(shells.flatMap((shell) => shell.meshes));
    // Furniture that may come between the camera and the product (and fade when it does).
    const colliders = meshes.filter((mesh) => !onShells.has(mesh) && !NO_COLLISION.test(mesh.name));
    ownMaterials(colliders);
    // Built now, not in idle time: the room renders every frame, so idle time rarely comes.
    for (const mesh of colliders) ensureBvh(mesh);
    // Collected after materials were made per-mesh, so the glow reaches what's drawn.
    for (const mesh of meshes) {
      for (const material of [mesh.material].flat()) {
        if (GLOWING_GLASS.test(material.name)) glass.push(material as MeshStandardMaterial);
      }
    }
    const anchors = readRoomAnchors(scene);
    // Padded boxes the camera stays out of (room space); never one around the product spot.
    scene.updateWorldMatrix(true, true);
    const toRoom = scene.matrixWorld.clone().invert();
    const spot = new Vector3(...anchors.product).setY(anchors.product[1] + 0.3);
    const keepOut = colliders
      .map((mesh) =>
        new Box3().setFromObject(mesh).applyMatrix4(toRoom).expandByScalar(CAMERA_RADIUS_M),
      )
      .filter((box) => !box.containsPoint(spot));
    // Each collider's box grown by the near-camera distance (room space), for fading.
    const nearBoxes = colliders.map((mesh) =>
      new Box3().setFromObject(mesh).applyMatrix4(toRoom).expandByScalar(NEAR_CAMERA_M),
    );
    return {
      scene,
      glass,
      nearBoxes,
      anchors,
      shells,
      colliders,
      keepOut,
      interior: roomInterior(shells, CAMERA_CLEARANCE_M),
    };
  }, [gltf.scene]);

  // The product's floor point, minus the room's product spot.
  const offset = useMemo<[number, number, number]>(() => {
    const [ax, ay, az] = room.anchors.product;
    return [stage.center[0] - ax, stage.floorY - ay, stage.center[2] - az];
  }, [room.anchors.product, stage.center, stage.floorY]);

  useEffect(() => setGlow(room.glass, mood === 'night' ? 2.5 : 0.4), [room.glass, mood]);
  // New lights mean new shaders for every material, and a first shadow map: prepare them in the
  // background (and let a couple of frames render) before the room is revealed, instead of
  // showing black frames meanwhile. Again when the mood changes, since the lights do.
  const getState = useThree((state) => state.get);
  // Before paint: the viewer veils the view and drops the studio light.
  useLayoutEffect(() => onLighting(), [room, mood, onLighting]);
  useEffect(() => {
    let cancelled = false;
    // Compile once the studio light is gone, so programs match the room's lights only.
    afterFrames(2)
      .then(async () => {
        const { gl, scene, camera: cam } = getState();
        await gl.compileAsync(scene, cam).catch(() => undefined);
        // And the faded (transparent) versions of the furniture, so the first fade while
        // orbiting never has to compile a shader on the spot (a frozen or blank frame).
        setTransparentForCompile(room.colliders, true);
        await gl.compileAsync(scene, cam).catch(() => undefined);
        setTransparentForCompile(room.colliders, false);
      })
      // Programs finish swapping in a little after the compile reports done: hold the veil for
      // a few more rendered frames and at least half a second.
      .then(() =>
        Promise.all([afterFrames(10), new Promise((resolve) => setTimeout(resolve, 500))]),
      )
      // Let the camera finish gliding into the room's free space before the reveal.
      .then(() => new Promise((resolve) => setTimeout(resolve, VIEW_GLIDE_SECONDS * 1000 + 100)))
      .then(() => {
        if (!cancelled) onReady();
      });
    return () => {
      cancelled = true;
    };
  }, [room, mood, getState, onLighting, onReady]);

  // The camera's free space: its open side (the room's front, +z) and how far it may zoom out.
  const limits = useMemo<OrbitLimits>(() => {
    const target: [number, number, number] = [
      room.anchors.product[0],
      room.anchors.product[1] + (stage.center[1] - stage.floorY),
      room.anchors.product[2],
    ];
    return {
      maxDistance: freeOrbitDistance({
        target,
        keepOut: room.keepOut,
        interior: room.interior,
        minDistance,
        maxDistance,
      }),
      minAzimuth: -FRONT_ARC,
      maxAzimuth: FRONT_ARC,
    };
  }, [room, stage.center, stage.floorY, minDistance, maxDistance]);
  useEffect(() => onOrbitLimits(limits), [onOrbitLimits, limits]);

  const group = useRef<Group>(null);
  const local = useMemo(() => new Vector3(), []);
  const raycaster = useMemo(() => new Raycaster(), []);
  const opacity = useRef(new Map<Mesh, number>());
  const controls = useThree((state) => state.controls) as { target?: Vector3 } | null;
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const target =
      controls?.target ?? new Vector3(stage.center[0], stage.center[1], stage.center[2]);
    // Fade whatever stands between the camera and the product.
    const blocking = meshesBetween(
      raycaster,
      camera.position,
      target,
      room.colliders,
      stage.radius * 0.5,
    );
    g.worldToLocal(local.copy(camera.position));
    room.colliders.forEach((mesh, i) => {
      const current = opacity.current.get(mesh) ?? 1;
      const near = room.nearBoxes[i]?.containsPoint(local) ?? false;
      const wanted = blocking.has(mesh) || near ? FADED_OPACITY : 1;
      if (current !== wanted) opacity.current.set(mesh, fadeTo(mesh, current, wanted, delta));
    });
    g.worldToLocal(local.copy(camera.position));
    const point = local.toArray();
    for (const shell of room.shells) setHidden(shell.meshes, isBehindShell(shell, point));
  });

  return (
    <>
      <group ref={group} position={offset}>
        <primitive object={room.scene} />
      </group>
      <RoomLighting
        anchors={room.anchors}
        offset={offset}
        mood={mood}
        shadowMapSize={shadowMapSize}
      />
    </>
  );
}
