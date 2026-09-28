# BuildMyBeast gallery operation

Visitor uploads are live at [buildmybeast.com/#gallery](https://buildmybeast.com/#gallery). The public page uses the site key in `config.js`, Cloudflare Turnstile, and the separate `buildmybeast-gallery-upload` Worker. The Worker verifies the human check and file, rate limits requests, signs the Cloudinary upload, and stores submissions under the signed `buildmybeast_pending` preset. Cloudinary manual moderation and this repository's curated `approved.json` are two separate gates.

## Review and publish a build

1. In Cloudinary, open **Assets → Media Library → Moderation → Manual → Pending**. Review the photo, title, vehicle, category, and modifications. Check that the photo has no private information and that the submission has permission for public display.
2. Approve or reject it in Cloudinary. Rejected or pending assets must never be added to the site. Approval makes the asset deliverable, but does **not** place a card in the gallery.
3. For an approved asset, open its details. Copy its **Public ID** and contextual metadata. Check the delivered image URL before publishing. Add a curated record to `approved.json`:
   
   ```json
   {
     "slug": "trail-ready-tahoe",
     "title": "Trail-ready Tahoe",
     "vehicle": "2005 Chevrolet Tahoe",
     "category": "offroad",
     "mods": "Lift, tires, lighting",
     "description": "A short, factual build description.",
     "imageUrl": "https://res.cloudinary.com/yfpthneq/image/upload/PUBLIC_ID.jpg"
   }
   ```
   
   Use the asset's actual image extension and Public ID. Give each approved build a unique lowercase slug with letters, numbers, and hyphens (up to 60 characters). Its direct link is `https://buildmybeast.com/?build=SLUG#gallery`; the card offers a Copy Build Link button. Categories are `offroad`, `street`, `audio`, and `custom`. The gallery accepts HTTPS Cloudinary image URLs and same-origin `/gallery/` images, and displays up to 100 approved records.
4. After GitHub Pages publishes the change, verify the card and photo at `https://buildmybeast.com/#gallery` in a private browser window. The other cards are sample concepts, labeled separately from member photos.

The first published member build is **Shade**, a 2014 Nissan Altima. Do not put pending, rejected, or unreviewed records in `approved.json`.

## Worker configuration and upkeep

The Worker source and rate-limit bindings are in `gallery-worker/`. Run **Actions → Deploy gallery upload gate → Run workflow** to redeploy it; the workflow runs its upload-gate tests first. The GitHub Actions secret `CLOUDFLARE_API_TOKEN` authorizes that deployment. The Worker is separate from GitHub Pages.

Cloudflare Worker **Variables and Secrets** contains `CLOUD_NAME`, `CLOUD_SIGNED_PRESET`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`, and `TURNSTILE_SECRET`. `ALLOWED_ORIGIN` and the rate-limit bindings are in `wrangler.jsonc`. `keep_vars: true` preserves dashboard variables on deploy, and Wrangler preserves secrets. Never put secret values in this repository or screenshots. The public Turnstile site key and Worker endpoint in `config.js` are safe to expose.

Keep the accounts on their free plans without adding a payment method. Check Cloudinary usage periodically; the Worker rate limit mitigates abuse but is not an exact global usage cap. If uploads must be paused, clear `uploadEndpoint` in `config.js`; the public form will hide while existing approved cards remain available.
