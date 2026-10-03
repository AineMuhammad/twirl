# Deploying Twirl to production

Twirl runs on **Vercel** (the Next.js app in `apps/web`), with:

- **Neon** for Postgres;
- **Cloudflare R2** for model files and HDRIs;
- **Resend** for email;
- **Upstash Redis** for rate limiting;
- **Google** and email magic links for sign-in.

Follow the steps in order. Never put real keys in the repository or in chat; set them in Vercel,
and in `apps/web/.env.local` for local development.

## 1. Vercel project

1. **Vercel → Add New → Project →** import the GitHub repository.
2. **Root Directory:** `apps/web`. Vercel detects pnpm and Turborepo; keep the default install and
   build commands. The build applies database migrations, copies decoders, then runs
   `next build`.
3. **Settings → General → Node.js Version:** 24.x.
4. **Production Branch:** `main` (Settings → Git). Every pull request gets a preview deployment.
5. Add this environment variable for all environments:

   | Name                           | Value |
   | ------------------------------ | ----- |
   | `ENABLE_EXPERIMENTAL_COREPACK` | `1`   |

   It lets Vercel use the pnpm version pinned in `package.json`.

## 2. Database (Neon)

1. **Project → Storage → Create Database → Neon** (or connect an existing Neon project). Connect
   it to **all environments**.
2. Vercel adds `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct). These are the names
   Twirl uses; nothing to rename.
3. Recommended: in Neon, enable **preview branches**, so preview deployments run migrations
   against a copy instead of production.

Migrations run automatically during each Vercel build (`scripts/migrate-on-deploy.mjs`).

## 3. Sign-in

1. **`AUTH_SECRET`:** run `openssl rand -base64 32` and add the output. Use a different value
   from local development.
2. **Google:** Google Cloud Console → APIs & Services.
   1. Configure the **OAuth consent screen** (External, app name, support email).
   2. **Credentials → Create credentials → OAuth client ID → Web application.**
   3. **Authorized redirect URIs:** `https://YOUR-DOMAIN/api/auth/callback/google`. Add
      `http://localhost:3000/api/auth/callback/google` for local development.
   4. Add the results as `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.
   5. Publish the consent screen (or add test users) so people outside your account can sign
      in.
3. **`ADMIN_EMAILS`:** your email address(es), comma-separated. These accounts see the admin
   panel and receive upgrade and model-request emails.

## 4. Email (Resend)

1. **resend.com → Domains → Add domain** and add the DNS records it shows (SPF, DKIM). Until the
   domain is verified, Resend only delivers to your own account's address.
2. **API Keys → Create** a key with sending access, and add it as `RESEND_API_KEY`.
3. **`EMAIL_FROM`:** a sender on the verified domain, for example `Twirl <hello@yourdomain.com>`.

Resend sends the sign-in links, quote notifications, upgrade requests and model requests.

## 5. Storage (Cloudflare R2)

1. **Cloudflare → R2 → Create bucket** (for example `twirl`).
2. **Settings → Public access:** enable the r2.dev URL, or better, connect a **custom domain**
   such as `assets.yourdomain.com`.
3. **Settings → CORS policy:**

   ```json
   [
     { "AllowedOrigins": ["*"], "AllowedMethods": ["GET", "HEAD"], "AllowedHeaders": ["*"] },
     {
       "AllowedOrigins": ["https://YOUR-DOMAIN", "http://localhost:3000"],
       "AllowedMethods": ["PUT"],
       "AllowedHeaders": ["Content-Type"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

   The first rule lets embeds anywhere load models and HDRIs. The second lets your app upload.
   Add preview-deployment domains to the second rule if you want to test uploads on previews.

4. **R2 → Manage API tokens → Create token** with **Object Read & Write** on the bucket.
5. Add these variables:

   | Name                   | Value                                                   |
   | ---------------------- | ------------------------------------------------------- |
   | `R2_ACCOUNT_ID`        | Your Cloudflare account id                              |
   | `R2_ACCESS_KEY_ID`     | From the token                                          |
   | `R2_SECRET_ACCESS_KEY` | From the token                                          |
   | `R2_BUCKET`            | The bucket name                                         |
   | `R2_PUBLIC_URL`        | The public URL (r2.dev or your custom domain), no slash |

   `R2_PUBLIC_URL` must be the public URL, not the `…r2.cloudflarestorage.com` API endpoint.

6. **Optional, sharper HDRIs on large screens:** upload the 2k HDRIs to `hdri/2k/` in the bucket
   and set `NEXT_PUBLIC_ASSETS_BASE_URL` to the same public URL.

## 6. Rate limiting (Upstash Redis)

1. **Project → Storage → Create Database → Upstash → Redis**, Free plan, in a region near your
   Neon database. Connect it to all environments.
2. Vercel adds several variables. Twirl uses `KV_REST_API_URL` and `KV_REST_API_TOKEN`; ignore
   the rest.

## 7. Domain and app URL

1. **Settings → Domains:** add your domain and follow the DNS instructions. Vercel issues the
   certificate and enables HTTPS (with HSTS) automatically.
2. Set `NEXT_PUBLIC_APP_URL` to `https://YOUR-DOMAIN` (no trailing slash). It's used for search
   metadata and the sitemap.
3. Update the Google redirect URI and the R2 CORS rule if the domain changed.

## 8. Deploy and check

1. Merge into `main` (or **Redeploy** in Vercel). The build fails with a clear list if any
   required variable is missing. On Vercel, sign-in, email, R2 and Upstash variables are all
   required.
2. Open `https://YOUR-DOMAIN/api/health`. It should return `{"ok":true,"database":"ok"}`.
3. Smoke test:
   1. Sign in with Google and with an email link.
   2. Upload `sofa.glb` (from `apps/web/public/samples/`), create a product and publish it.
   3. Open **Embed → Open**, change options, then **Share**, **Download image** and
      **Get a quote**.
   4. Check the quote email arrives and the quote appears in **Quotes**.
   5. Check `/admin` opens for your admin email.
4. Point an uptime monitor (for example Vercel's, Better Stack or UptimeRobot) at
   `/api/health`.

## Environment variable checklist

| Variable                                                                                  | Required on Vercel | Where it comes from       |
| ----------------------------------------------------------------------------------------- | ------------------ | ------------------------- |
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED`                                                   | Yes                | Neon integration          |
| `AUTH_SECRET`                                                                             | Yes                | `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`                                                    | Yes                | Google Cloud Console      |
| `ADMIN_EMAILS`                                                                            | Recommended        | You                       |
| `RESEND_API_KEY`, `EMAIL_FROM`                                                            | Yes                | Resend                    |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` | Yes                | Cloudflare R2             |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN`                                                    | Yes                | Upstash integration       |
| `NEXT_PUBLIC_APP_URL`                                                                     | Recommended        | Your domain               |
| `NEXT_PUBLIC_ASSETS_BASE_URL`                                                             | Optional           | R2 public URL (2k HDRIs)  |
| `ENABLE_EXPERIMENTAL_COREPACK`                                                            | Yes (`1`)          | Vercel setting            |

## Operating notes

- **Plans:** change limits and prices in `apps/web/src/config/plans.ts`. Set a workspace's plan
  in **Admin → Workspaces**.
- **Backups:** Neon keeps point-in-time history. Check your plan's retention.
- **Logs:** Vercel → Logs. Server errors are logged with a `[area]` prefix (for example
  `[assets]` or `[email]`) and never include secrets.
- **Rollbacks:** Vercel can promote an earlier deployment instantly. Migrations are additive, so
  older deployments keep working.
