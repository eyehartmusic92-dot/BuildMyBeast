# Gallery photo albums

Visitors can submit up to three photos, each under 3 MB, using one Turnstile verification. The first photo is the cover. Every image is signed server-side for manual moderation.

Approve each image you want displayed. Approved extra images are grouped with their approved cover by server-generated album metadata. Pending/rejected images and detail images without an approved cover are omitted from the public feed. An approved cover can appear before its additional views are approved. Changes may take up to 15 minutes to reach the cached feed.

Do not change the signed album metadata to attach unrelated submissions. The public gallery feed is limited to the latest 100 approved image assets; curated static entries remain available.

The cover uploads last. A failed partial submission can leave detail assets in Cloudinary for review, but they do not produce public build cards. Review these orphan assets in Cloudinary; the website does not delete them automatically.

Deployment runs when gallery-worker files change. Frontend multiple-photo selection is enabled only when the backend capability endpoint reports support. Existing single-photo submissions remain supported.
