# Frontend validation — 25 September 2026

The complete final run passed: **13 unit/rendering checks and 22 Chrome browser tests**. The production build, strict unused-code TypeScript check, and Prettier check also passed.

## Coverage

| Area | Verified |
| --- | --- |
| Services | All six guides, required documents, source notes, renewal conditions |
| Personalization | Adult/minor passport conditions, exceptional replacement guidance, conditional checklist answers, prepared documents retained when creating a case |
| Tracking | Document readiness, processing stage, expiration dates, reminders, reload persistence, storage failure fallback |
| Appointments | Preferred dates, invalid/past dates, demo branch/slot validation, review, confirmation, reload, rescheduling, keeping/cancelling a booking |
| Account | Required fields/uploads, file signatures, editing validation, sign-out cleanup, no identity data in browser storage |
| Preferences | Saved services, notification toggles, read/unread state across reloads |
| Navigation | Direct service links, page routes, missing pages, browser history, modal Escape/focus handling |
| Languages/layout | English, Arabic RTL, French; all workspace pages and six service dialogs at 375, 768 and 1440 pixels; no horizontal overflow or runtime errors in these checks |

The Arabic mobile account screenshot was also inspected visually. Generated screenshots are under `artifacts/screenshots/` and are ignored by Git.

## Regressions fixed during this retest

- Controlled document checkboxes reverted briefly while an asynchronous save was pending. Changes now appear immediately, while queued saves avoid older responses replacing newer edits.
- Language changes could unmount the service form and reset an unfinished wizard. Existing service content stays mounted while its translation loads.
- A service could mount before saved cases finished loading, leaving its appointment date blank. Case hydration now completes before rendering details, and appointment fields synchronize with saved values.
- Profile-edit drafts now clear on sign-out. Modal keyboard navigation skips disabled or hidden controls.
- Browser tests now respect persistent service URLs and wait for pending writes before testing reload persistence.

## Reproduce

```sh
npm test
npm run test:browser
npm run build
npm run format:check
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
```

The browser suite uses installed Google Chrome and a local Vite server on port 5175. External requests are blocked during browser testing.

## Scope and limits

This validates the implemented frontend demo flows; it is not a guarantee of zero defects. Firefox, Safari, physical devices, assistive-technology certification, and a real backend were not tested. Native date-input formatting depends on the browser. Authentication, government appointments, uploads, and notification delivery remain simulated or unavailable as labeled. Administrative requirements were not re-researched during this software retest; source review dates remain unchanged.
