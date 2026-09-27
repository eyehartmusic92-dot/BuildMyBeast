# BuildMyBeast gallery operation

The live site works without external image storage. Sample ideas remain visible, and submissions stay hidden until the protected upload Worker, human check, and moderation are connected. No API secret belongs in this public repository or `config.js`.

## Activation gate

1. Use free plans without adding a payment method. Check the current allowances and service policies before enabling public uploads. Cloudinary provides image storage; Cloudflare Workers and Turnstile protect the intake.
2. In Cloudinary, create a **signed image upload preset** with JPG/PNG/WebP only, a dedicated pending folder, random public IDs, and **manual moderation**. Test that pending images cannot be delivered publicly, and that rejected images stay out of the gallery.
3. Create a Cloudflare Turnstile widget restricted to `buildmybeast.com` (and `www.buildmybeast.com` if used). The Worker validates its token on the server. Deploy the Worker in `gallery-worker/` on the Workers Free plan with its rate-limit bindings. Set `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`, `CLOUD_SIGNED_PRESET`, and `TURNSTILE_SECRET` as Worker secrets; `ALLOWED_ORIGIN` is already in `wrangler.jsonc`. Never put these secrets in site code or version control.
4. Test a valid photo, an oversized file, an invalid image, an invalid or missing Turnstile token, an unapproved origin, and repeated requests. Verify the moderation queue before public activation. The rate-limit binding is per Cloudflare location and eventually consistent, so it is abuse mitigation rather than an exact global usage cap. Monitor image-host usage and keep the free account without a payment method.
5. Only then set the public `cloudName`, Worker `uploadEndpoint` (ending in `/upload`), and Turnstile `turnstileSiteKey` in `config.js`. Test from a signed-out browser. The form appears only when all three values are present and Turnstile loads.

Run the upload gate smoke test with `node gallery-worker/worker.test.mjs`. The Worker is a separate deployment; the GitHub Pages workflow does not deploy it.

## Publishing an approved build

Approval alone does not publish a build. Review the photo and its contextual title, vehicle, category, and modifications. Remove sensitive data and confirm permission, then add a curated entry to `approved.json`:

```json
{
  "title": "Trail-ready Tahoe",
  "vehicle": "2005 Chevrolet Tahoe",
  "category": "offroad",
  "mods": "Lift, tires, lighting",
  "description": "A short, factual build description.",
  "imageUrl": "https://res.cloudinary.com/YOUR_CLOUD/image/upload/YOUR_PUBLIC_ID.jpg"
}
```

Categories: `offroad`, `street`, `audio`, `custom`. The gallery accepts HTTPS Cloudinary image URLs and same-origin `/gallery/` images. Publication happens with the next GitHub Pages deployment. It displays up to 100 approved records. Never commit pending or rejected uploads.
