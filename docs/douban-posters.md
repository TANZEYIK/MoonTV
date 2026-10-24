# Douban posters on Cloudflare Pages

Explore and the home page's trending lists use Douban's image CDN. Search
results and continue-watching records usually use images from video providers.

On 2026-10-24, the poster for 希望 (`p2933326871.jpg`) returned HTTP 418
without a Referer, and HTTP 200 with a valid JPEG when requested with
`Referer: https://movie.douban.com/`. The cards use `no-referrer`, so a change
in Douban's hotlink restrictions can break posters without a site deployment.
This test confirms the current failure; it does not establish when Douban
changed its behavior.

The deployed site's existing proxy was also checked in an authenticated
browser session: it returned HTTP 200, `image/jpeg`, and a decodable 270 × 385
poster for the same URL.

The fix preserves the selected image source, then retries failed Douban
posters once through the existing same-origin `/api/image-proxy?url=` endpoint.
That edge endpoint supplies the required Referer and caches successful
responses. It replaces the previous retry of the same blocked URL. A failed
server-proxied image is not retried, and provider images retain their existing
retry behavior.

## Existing deployment workaround

In the user settings, enable **启用图片代理**, enter
`/api/image-proxy?url=` in **图片代理地址**, and reload. This uses the endpoint
already present in the deployed release. The setting applies to that browser
and sends all its poster requests through the proxy. The code fix limits the
automatic fallback to Douban hosts. On newer versions, select **服务器代理**
under **豆瓣图片代理** instead.

## Deployment compatibility

The live site's displayed version is `20250801133915`, matching the version
in commit `774f047`. Its runtime configuration uses Cloudflare D1. This
version match does not verify
the deployment's exact Git SHA; confirm it in Cloudflare before publishing.

Current `main` has removed D1 support. The poster fallback preserves its image
proxy settings and does not change its storage implementation or build
settings. This fix does not restore D1 support.

For the existing D1 deployment, use the settings workaround or backport the
poster fallback to its deployed release. Publishing current `main` requires
separate Cloudflare/D1 compatibility work. After deployment, verify that movie, TV and variety Explore pages
and home-page trending posters load through `/api/image-proxy?url=...` with
HTTP 200 and an image content type. Check search and continue watching too.
Preparing this fix did not modify the live site's settings or deployment.

## Local validation

- 21 Jest regression cases passed, covering Douban hosts, URL encoding,
  unrelated images, existing proxy preferences, one-time recovery, and changed
  posters.
- TypeScript, targeted ESLint, formatting, and `git diff --check` passed.
- In a real browser, the first three posters decoded successfully on the home
  page and each of the movie, TV, and variety Explore pages with the fix
  applied to current `main`.
- A screenshot of the corrected movie page is saved locally at
  `output/playwright/douban-movies-fixed.png` (excluded from Git).
