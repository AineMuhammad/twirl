// Downloads the source models, pinned so builds are reproducible (output is git-ignored):
// - Khronos glTF Sample Assets at one commit → raw/<Name>.glb
// - Poly Haven furniture (CC0) at 2k → raw/polyhaven/<id>/, each .gltf pinned by MD5 and every
//   texture and buffer checked against the MD5 Poly Haven publishes.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const COMMIT = 'edc7c9e67c639d230715049ee31f9a96a6babbbe';
const SOURCES = [
  'GlamVelvetSofa',
  'ChairDamaskPurplegold',
  'SheenWoodLeatherSofa',
  'SpecularSilkPouf',
  'AnisotropyBarnLamp',
  'IridescenceLamp',
  'LightsPunctualLamp',
  'MaterialsVariantsShoe',
  'Corset',
  'SunglassesKhronos',
  'DiffuseTransmissionTeacup',
  'WaterBottle',
  'BoomBox',
  'CommercialRefrigerator',
  'ToyCar',
];

fs.mkdirSync('raw', { recursive: true });
for (const name of SOURCES) {
  const target = `raw/${name}.glb`;
  if (fs.existsSync(target)) continue;
  const url = `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/${COMMIT}/Models/${name}/glTF-Binary/${name}.glb`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  fs.writeFileSync(target, Buffer.from(await res.arrayBuffer()));
  console.log(`fetched ${name}`);
}

/** Poly Haven model id → MD5 of its 2k .gltf (a changed source fails the fetch). */
const POLYHAVEN = {
  dining_chair_02: 'a8f25a5452e75fe1246624bb80f2d7f0',
  industrial_coffee_table: '8bb4ef2106a47c8783180208bed56509',
  mid_century_lounge_chair: '0c51ce1efaf9d2a6b96076fa291990a9',
  modern_arm_chair_01: '1fec9694d156cbed5dc8757576cd16a5',
  Ottoman_01: '58d48c6863957282c8136a761bf2b087',
  Sofa_01: '6cdc36ddebe16bba081dc183a02da586',
};

const md5 = (buf) => createHash('md5').update(buf).digest('hex');

async function download(url, target, expectedMd5) {
  if (fs.existsSync(target) && md5(fs.readFileSync(target)) === expectedMd5) return;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (md5(buf) !== expectedMd5) throw new Error(`${url}: checksum mismatch`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, buf);
}

for (const [id, pinned] of Object.entries(POLYHAVEN)) {
  const res = await fetch(`https://api.polyhaven.com/files/${id}`);
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`);
  const gltf = (await res.json()).gltf['2k'].gltf;
  if (gltf.md5 !== pinned) throw new Error(`${id}: the source changed on Poly Haven (new MD5)`);
  const dir = `raw/polyhaven/${id}`;
  await download(gltf.url, `${dir}/${id}_2k.gltf`, gltf.md5);
  for (const [file, entry] of Object.entries(gltf.include)) {
    await download(entry.url, `${dir}/${file}`, entry.md5);
  }
  console.log(`fetched ${id} (2k)`);
}
