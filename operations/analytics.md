# Measurement and account verification

GA4 property tag: G-Z5NXD2D67Y. eBay campaign preserved: 5339214841.

## Website events
| Goal | Event | Limitation |
|---|---|---|
| Planning begins | planner_started | Once per loaded page; not a unique person |
| Plan generated | build_plan_generated | Existing planner event |
| Project saved/updated | garage_build_added / garage_build_updated | Browser-local projects |
| Returning garage | garage_return_visit | Same browser/device only |
| Compare plans | garage_builds_compared | Selection event |
| Parts interest | ebay_outbound_click | A click, not a purchase |
| Signup attempt | newsletter_signup_attempt | Confirmation must be checked in Kit |
| Community contribution | gallery_build_submitted | Submitted, not approved |
| Workbook use | workbook_open / workbook_downloaded | Downloads are not purchases |
| Partner interest | partner_page_open / partner_inquiry_click | Mail link click is not a delivered inquiry |
| AI usage | visualizer_requested / visualizer_completed / visualizer_failed | Website events do not replace server usage/billing records |

## Owner's account checks
1. GA4 Realtime: visit the site in a normal browser and perform a planner action. Verify the property/stream matches the tag.
2. DebugView if needed; extensions, blockers, and consent settings can affect collection.
3. Search Console: verify https://buildmybeast.com/, inspect new pages, submit https://buildmybeast.com/sitemap.xml.
4. Kit: count confirmed subscribers, not all form submissions.
5. EPN: verify the campaign, then compare click reports, qualifying transactions, commissions, and reversals.
6. Cloudflare / AI provider / Cloudinary: inspect usage, errors, and bills.

Do not put email addresses, phone numbers, workbook text, or uploaded images into analytics event metadata.

## Monthly report
Visits; traffic source; planner starts; save rate; returning garage visits; parts clicks; confirmed subscriptions; approved builds; shop inquiries received; affiliate revenue actually reported; operating costs.
