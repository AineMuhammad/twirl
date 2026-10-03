import 'server-only';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { serverEnv } from '@/env/server';

const {
  R2_ACCOUNT_ID: accountId,
  R2_ACCESS_KEY_ID: accessKeyId,
  R2_SECRET_ACCESS_KEY: secretAccessKey,
  R2_BUCKET: bucket,
  R2_PUBLIC_URL: publicBase,
} = serverEnv;

/** Uploads need all R2 settings; without them the upload UI explains it's unavailable. */
export const storageEnabled = Boolean(
  accountId && accessKeyId && secretAccessKey && bucket && publicBase,
);

/** How long a presigned upload URL stays valid. */
export const UPLOAD_URL_TTL_SECONDS = 10 * 60;

let client: S3Client | undefined;

function r2() {
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('R2 storage is not configured. See .env.example.');
  }
  client ??= new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return { client, bucket };
}

/**
 * A URL the browser can PUT one file to, directly (the file never passes through our servers).
 * Content type and exact size are part of the signature, so the upload must match what was
 * declared.
 */
export async function presignUpload(key: string, contentType: string, size: number) {
  const { client, bucket } = r2();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
  });
  const url = await getSignedUrl(client, command, {
    expiresIn: UPLOAD_URL_TTL_SECONDS,
    signableHeaders: new Set(['content-type', 'content-length']),
  });
  return { url, headers: { 'Content-Type': contentType } };
}

/** The stored object's size and type, or null if nothing was uploaded. */
export async function headObject(key: string) {
  const { client, bucket } = r2();
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return { size: head.ContentLength ?? 0, contentType: head.ContentType ?? '' };
  } catch (error) {
    if (error instanceof NotFound || (error as { name?: string }).name === 'NotFound') return null;
    throw error;
  }
}

/** The whole object's bytes (models are at most 15 MB). */
export async function getObjectBytes(key: string): Promise<Uint8Array> {
  const { client, bucket } = r2();
  const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!object.Body) throw new Error(`Empty object body for ${key}`);
  return object.Body.transformToByteArray();
}

export async function deleteObject(key: string) {
  const { client, bucket } = r2();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/** Public URL of a stored object (keys are unguessable; see ADR 0010). */
export function publicUrl(key: string) {
  if (!publicBase) throw new Error('R2_PUBLIC_URL is not configured.');
  return `${publicBase}/${key.split('/').map(encodeURIComponent).join('/')}`;
}
