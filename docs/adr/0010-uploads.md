# 0010. Model uploads

- **Status:** Accepted
- **Date:** 2026-10-03

## Context

Merchants upload GLB/glTF models up to 15 MB. Vercel functions accept at most 4.5 MB request
bodies, and model bytes shouldn't flow through our servers anyway.

## Decision

1. **Presigned PUT straight to R2.** `POST /api/assets` creates a `PENDING` asset and returns a
   10-minute presigned URL. The browser PUTs the file, then calls
   `POST /api/assets/:id/complete`.
2. **Content type and exact byte size are part of the signature.** R2 rejects an upload that
   doesn't match the declaration (verified: a mismatched size returns 403). R2 doesn't support
   presigned POST policies, so this replaces `content-length-range`. The completion step `HEAD`s
   the object and re-checks size and type. A mismatch marks the asset `INVALID` and deletes the
   object.
3. **Keys:** `workspaces/{workspaceId}/assets/{assetId}/{safe-filename}`. Asset ids are random
   UUIDs, so keys can't be guessed.
4. **Models are public by URL** (`R2_PUBLIC_URL` + key). Published configurators serve them to
   anyone anyway. Signed GET URLs would break CDN caching and embeds, so private drafts are not
   worth it in v1.
5. **API routes check the session, workspace scope and same origin.** Every query filters by the
   caller's workspace, and mutating routes reject cross-site `Origin`s.
6. **Deleting a model is refused (409) while a product version uses it.**
7. **The bucket CORS policy needs two rules:**
   - `GET` from any origin, for embeds and HDRIs.
   - `PUT` with the `Content-Type` header, from the app's own origins only.

   ```json
   [
     { "AllowedOrigins": ["*"], "AllowedMethods": ["GET", "HEAD"], "AllowedHeaders": ["*"] },
     {
       "AllowedOrigins": ["http://localhost:3000", "https://<your-domain>"],
       "AllowedMethods": ["PUT"],
       "AllowedHeaders": ["Content-Type"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

## Consequences

- Abandoned uploads leave `PENDING` rows, and possibly orphaned objects. The dashboard hides
  ones older than an hour. A scheduled clean-up can come later.
- Model contents (parsing, mesh count, triangle and texture report) are validated in the next
  step (`feature/model-validation`). Until then, "Ready" only means the bytes arrived as
  declared.
- Preview deployments use their own URLs. Add those origins to the PUT rule, or test uploads on
  production and localhost only.
