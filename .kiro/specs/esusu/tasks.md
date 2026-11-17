# Implementation Plan — Esusu

Build window: 18–28 Nov 2026. Polish + demo video: 29 Nov–3 Dec. Submission: 3 Dec 2026, ahead of the 4 Dec 23:00 WAT deadline. Free tier only (Kiro free, 50 credits/month).

## Tasks

- [ ] 1. Scaffold the project
  - [ ] 1.1 Initialise Vite + TypeScript static app with a PWA manifest and a hand-written cache-first service worker
  - [ ] 1.2 Set up Vitest and the test script (`npm test`)
  - [ ] 1.3 Add the app shell: single-column layout, 44px tap targets, black + warm accent theme
  - _Requirements: 4.1, 6.1, 6.3_

- [ ] 2. Build the domain layer
  - [ ] 2.1 Implement the data model and `createCircle` with validation (≥2 members, amount > 0, non-empty name)
  - [ ] 2.2 Implement `markPaid` / undo and `closeRound` with round advancement and shortfall recording
  - [ ] 2.3 Implement `potFor` and payout-order derivation
  - [ ] 2.4 Write unit tests for the domain: create/validate, mark-paid, close-round, payout order, shortfall
  - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

- [ ] 3. Build local storage
  - [ ] 3.1 Implement the IndexedDB store (`listCircles`, `getCircle`, `saveCircle`, `deleteCircle`)
  - [ ] 3.2 Show a plain-language banner when IndexedDB is unavailable; run the session read-only in memory
  - [ ] 3.3 Persist every mutation locally before confirming success to the user
  - _Requirements: 1.3, 4.1, 4.2, 4.3, 4.4_

- [ ] 4. Build the views
  - [ ] 4.1 Circle list view with current round + recipient summary per circle
  - [ ] 4.2 Circle detail view: payout order, round status, paid/unpaid per member, mark-paid and close-round controls
  - [ ] 4.3 Circle create/edit form with plain-language validation errors
  - [ ] 4.4 Confirm-before-delete for circles; deleting removes only that circle
  - [ ] 4.5 Hash-based routing (`#/`, `#/circle/:id`, `#/new`) so the app works from any static host
  - _Requirements: 3.1, 3.3, 6.2, 6.4, 7.1, 7.3, 7.4_

- [ ] 5. Build share-by-link
  - [ ] 5.1 Implement the share codec: versioned JSON → base64url → `#c=` URL hash, with decode validation
  - [ ] 5.2 Share view: copy link button, Web Share API with clipboard fallback
  - [ ] 5.3 Opening a share link shows the circle and offers "save a local copy"; a saved copy is independent afterwards
  - [ ] 5.4 Damaged or truncated links show a plain-language error, never a wrong circle
  - [ ] 5.5 Write unit tests for the codec: round-trip, damaged payload, version mismatch
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 6. Currencies and multi-circle handling
  - [ ] 6.1 Currency picker with common West/East African codes (NGN, XOF, GHS, KES, ZAR) plus USD/EUR/GBP; amounts shown in the circle's own currency, never converted
  - [ ] 6.2 Verify multiple circles coexist untouched and the list stays correct
  - _Requirements: 7.2, 7.3_

- [ ] 7. Offline and first-user verification
  - [ ] 7.1 Load once online, disable network, reload: app opens and operates fully offline
  - [ ] 7.2 First-user walk on a real phone: create a circle, mark payments, close a round, share the link to a second device, open it offline — every control visibly responds
  - [ ] 7.3 Deploy the static build to GitHub Pages and verify the live URL
  - _Requirements: 4.1, 4.2, 5.2, 6.1_

- [ ] 8. Demo video and submission
  - [ ] 8.1 Record a <3 minute demo video (phone-first flow: create circle → mark paid → close round → share link → open offline)
  - [ ] 8.2 Upload the video to YouTube (public) — the one step that may need Ethuram's account
  - [ ] 8.3 Submit the Kiroween entry on Devpost with the public repo, live demo link, and video
  - _Requirements: (submission — no app requirement)_
