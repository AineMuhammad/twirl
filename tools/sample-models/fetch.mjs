// Downloads the source models from the Khronos glTF Sample Assets repository, pinned to one
// commit so builds are reproducible. Output: raw/<Name>.glb (git-ignored).
import fs from 'node:fs';

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
