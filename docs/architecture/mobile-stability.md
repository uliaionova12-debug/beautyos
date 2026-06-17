# Mobile Safari Stability — Critical Architecture Rule

## The Problem

On iPhone (both Safari and Chrome for iOS), the app periodically showed a blank screen followed by:

> "Safari не удалось открыть страницу, так как сервер перестал отвечать."
> ("Safari could not open the page because the server stopped responding.")

The error appeared intermittently — sometimes the app would load fine, other times it would hang entirely. Incognito mode did not help, ruling out browser cache or cookies.

The issue affected **all iPhone users**, not just specific devices or networks.

---

## Root Cause

### Next.js 16 Partial Pre-Rendering (PPR) and the two-phase response

Next.js 16 uses **Partial Pre-Rendering (PPR)** even without explicit opt-in. When a page includes dynamic components (like `useSearchParams()` or `Suspense` with client components), Next.js splits the HTTP response into two phases:

1. **Static shell** — the pre-rendered layout HTML (`<html>`, `<head>`, body wrapper) cached at the Vercel edge CDN
2. **Dynamic stream** — the actual page content, streamed after the shell

This is indicated by the `x-nextjs-prerender: 1` and `x-vercel-cache: HIT` headers in the response.

### Why iOS Safari broke but desktop Chrome didn't

Desktop Chrome is lenient with streaming HTTP/2 responses and tolerates edge cases in two-phase rendering. **iOS Safari (WebKit) is strict**: if the connection stays open but data stops flowing — even momentarily — WebKit terminates it and shows "server stopped responding."

This happened specifically when:
- A **Vercel edge node** (typically the one closest to the user) had an **expired or missing PPR cache**
- The edge fetched a **fresh shell** from the origin, but the dynamic stream was delayed
- The connection appeared "open but silent" to iOS WebKit, which killed it after its timeout

Russian users were disproportionately affected because Vercel's Russian/Eastern European edge nodes have higher latency to the US/EU origin servers, making cache misses more likely to timeout.

### Why the error appeared after deployments

Every new Vercel deployment **invalidates the PPR cache** across all edge nodes. This means the very first request to any route after a deployment fetches a fresh shell from origin — exactly the condition that triggers the WebKit timeout. Users who happened to request the page right after a deployment saw the error.

---

## The Fix

### `export const dynamic = 'force-dynamic'` in `src/app/layout.tsx`

Adding this to the **root layout** (not just to individual pages) prevents Next.js from pre-rendering and caching the layout shell entirely.

```typescript
// src/app/layout.tsx
export const dynamic = 'force-dynamic'
```

**Effect:** Instead of a two-phase response (cached shell → streamed content), the server generates a single complete HTML response for every request. `x-nextjs-prerender: 1` disappears from the response headers. `x-vercel-cache` changes from `HIT` to `MISS`.

**Why this is safe:** BeautyOS is a fully dynamic SaaS app. No page benefits from edge caching — all content is user-specific, salon-specific, or frequently updated. The performance cost of disabling the layout cache is negligible compared to the API calls each page already makes.

---

## What "force-dynamic" on Individual Pages Was Not Enough

Before this fix, all 26 pages already had `export const dynamic = 'force-dynamic'`. This prevented the **page content** from being cached. But it did **not** prevent the **root layout shell** from being cached at the edge.

The layout's shell — just the HTML structure, head tags, font preloads — was still cached separately. This cached shell was the first part of the two-phase response. Removing `force-dynamic` from the layout meant this shell could cause WebKit timeouts on cache misses.

---

## When the Error Can Return

The error will return if any of the following happens:

| Condition | Risk |
|-----------|------|
| `export const dynamic = 'force-dynamic'` is removed from `layout.tsx` | **High** — immediate regression |
| A new **nested layout** is added without `force-dynamic` | **Medium** — affects routes under that layout |
| Next.js is upgraded to a version with different PPR behavior | **Medium** — retest after major upgrades |
| A route group `(group)/layout.tsx` is added without `force-dynamic` | **Medium** — affects routes in that group |
| `export const revalidate = N` is added to layout or any page | **Medium** — re-enables caching |
| `experimental: { ppr: true }` is added to `next.config.ts` | **Low** — PPR was already happening implicitly, but explicit PPR may behave differently |

---

## Invariants to Maintain

1. **`src/app/layout.tsx` must always have `export const dynamic = 'force-dynamic'`**
2. **Any new layout file (`*/layout.tsx`) must also have `export const dynamic = 'force-dynamic'`**
3. **Never add `export const revalidate` to layout files**
4. **Never remove the `force-dynamic` comment** — it exists to prevent well-meaning "optimization" by future developers

---

## Diagnosis Commands

To verify the fix is in effect:

```bash
curl -si https://beautyos-bice.vercel.app/ | grep x-nextjs-prerender
# Should return nothing (empty) — no prerender header means no PPR
```

```bash
curl -si https://beautyos-bice.vercel.app/ | grep x-vercel-cache
# Should return: x-vercel-cache: MISS
```

If `x-nextjs-prerender: 1` reappears after a change, the PPR caching is active again and mobile stability is at risk.
