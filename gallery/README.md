# BuildMyBeast gallery operation

The live site works without an image service. Sample ideas remain visible, and the submission form stays hidden until the configuration in `config.js` is populated. No credential or API secret belongs in the public repository.

## Activation gate

1. Create an image-host account on the free plan without adding a payment method. Check the current plan limits and account usage before enabling public uploads.
2. Create an **unsigned image upload preset** that restricts formats to JPG, PNG, and WebP, assigns incoming uploads to a dedicated pending folder, disables caller-chosen public IDs, and applies **manual moderation**. Verify the preset's behavior with a test upload and confirm the image cannot be served before approval.
3. Anonymous upload presets are visible to visitors and do not have a server-enforced per-preset file-size limit. The page checks 3 MB in the browser, but a direct API caller can bypass it. Add an independently enforced request/rate limit or keep public uploads disabled if abuse and free-credit exhaustion are unacceptable. Do not activate solely on the strength of the browser check.
4. After the protections are working, enter the public cloud name and unsigned preset name in `config.js`. Test a submission from an unsigned-out browser, review it in the image host's moderation queue, and confirm rejection does not reach the gallery.

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

Categories: `offroad`, `street`, `audio`, `custom`. The gallery accepts HTTPS Cloudinary image URLs and same-origin `/gallery/` images. Publication happens with the next GitHub Pages deployment. Keep the list small and prune old entries as needed; it displays up to 100 approved records. Never commit pending or rejected uploads.
