// Uploads the built demo models to the R2 asset bucket at samples/<version>/<file>.
// Reads R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET (the app's own R2
// settings; `npm run upload` loads apps/web/.env.local when it exists).
// Usage: npm run upload [-- --dry-run]
import { createHash } from 'node:crypto';
import fs from 'node:fs';

import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const SAMPLES = '../../apps/web/public/samples';
const MANIFEST = '../../apps/web/src/lib/sample-manifest.json';
const dryRun = process.argv.includes('--dry-run');

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
if (!dryRun && !(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET)) {
  console.error('Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET.');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const client = dryRun
  ? null
  : new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
    });

for (const [file, entry] of Object.entries(manifest.files)) {
  const body = fs.readFileSync(`${SAMPLES}/${file}`);
  const sha256 = createHash('sha256').update(body).digest('hex');
  if (sha256 !== entry.sha256) {
    throw new Error(`${file} doesn't match the manifest. Rebuild with \`npm run build\` first.`);
  }
  const key = `samples/${manifest.version}/${file}`;
  if (dryRun) {
    console.log(`would upload ${key} (${Math.round(body.length / 1024)} KB)`);
    continue;
  }
  const existing = await client
    .send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }))
    .catch((error) => (error?.$metadata?.httpStatusCode === 404 ? null : Promise.reject(error)));
  if (existing?.Metadata?.sha256 === sha256) {
    console.log(`unchanged ${key}`);
    continue;
  }
  if (existing) {
    // Hosted files are immutable (cached for a year); a changed file needs a new version folder.
    throw new Error(
      `${key} already exists with different content. Bump "version" in the manifest.`,
    );
  }
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: 'model/gltf-binary',
      CacheControl: 'public, max-age=31536000, immutable',
      Metadata: { sha256 },
    }),
  );
  console.log(`uploaded ${key} (${Math.round(body.length / 1024)} KB)`);
}
