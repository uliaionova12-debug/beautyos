# Regression Checklist — After Every Deploy

Run through this checklist after every production deployment. If any item fails, the deploy is considered broken.

---

## Devices

| Device | Browser | Status |
|--------|---------|--------|
| Desktop | Chrome | ☐ |
| Desktop | Safari (macOS) | ☐ |
| iPhone | Safari | ☐ |
| iPhone | Chrome (via WebKit) | ☐ |
| Android | Chrome | ☐ |

---

## Routes

| Route | What to check |
|-------|--------------|
| `/` Landing | Loads, hero image visible, CTA buttons work |
| `/explain` | Login flow accessible |
| `/join` | Salon join flow opens |
| `/for-business` | Page loads, no blank screen |
| `/pricing` | Pricing cards visible |
| `/dashboard` | Loads after auth |
| `/actions` | Action list renders |
| `/marketing` | Marketing Director step 1 shows |
| `/beauty-companion` | AI Companion loads |
| `/book/[masterId]` | Public booking page opens |
| `/booking` | Master booking management loads |

---

## Critical Mobile Check (run after every deploy)

```bash
curl -si https://beautyos-bice.vercel.app/ | grep x-nextjs-prerender
```

**Expected result:** empty output (no `x-nextjs-prerender` header).

If `x-nextjs-prerender: 1` appears — mobile is at risk. See [mobile-stability.md](architecture/mobile-stability.md).

---

## PWA

- [ ] App opens from iPhone home screen (if installed)
- [ ] Manifest loads: `curl https://beautyos-bice.vercel.app/manifest.webmanifest`
- [ ] Apple touch icon loads: `curl -I https://beautyos-bice.vercel.app/apple-touch-icon-v2.png`

---

## New Feature Smoke Test

After deploying a new feature:

- [ ] The new feature works on desktop Chrome
- [ ] The new feature works on iPhone Safari
- [ ] Existing features listed above still work (no regressions)
