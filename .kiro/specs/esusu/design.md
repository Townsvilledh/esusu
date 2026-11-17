# Design Document — Esusu

## Overview

Esusu is a static, installable PWA with zero backend. All state lives in the browser (IndexedDB); sharing is done by encoding a circle's public state into a URL. The build is a single-page app with no framework dependency beyond what keeps the bundle small and fast on a low-end phone: plain HTML/CSS/vanilla JavaScript, built with Vite, deployed as static files (GitHub Pages).

## Architecture

```
┌─────────────────────────────────────────────┐
│  Browser (phone)                            │
│                                             │
│  ┌──────────────┐   ┌──────────────────┐    │
│  │  UI (SPA)    │──▶│  Store (IndexedDB│    │
│  │  views: list │   │  via idb wrapper)│    │
│  │  circle,     │   └──────────────────┘    │
│  │  round,      │   ┌──────────────────┐    │
│  │  share       │──▶│  Share codec     │    │
│  └──────────────┘   │  (JSON → base64  │    │
│                     │   → URL hash)    │    │
│                     └──────────────────┘    │
│  Service worker: cache-first app shell,     │
│  so the app loads fully offline.            │
└─────────────────────────────────────────────┘
No network calls for data. No accounts. No analytics.
```

### Technology choices

- **Vite + vanilla TypeScript** for the build: small bundle, no framework runtime to download on a slow connection. TypeScript for the data model and share codec, where a mistake silently corrupts a circle.
- **IndexedDB** (via a thin promise wrapper) for storage: survives app restarts, holds many circles, no size pressure at this scale.
- **Service worker** (Workbox-free, hand-written, cache-first): the app shell and assets are cached on first visit; afterwards the app loads with no network at all.
- **Web Share API with clipboard fallback** for sharing links; the link itself carries the state, so no server is ever involved.

## Components and Interfaces

### Store (`src/store.ts`)

- `listCircles(): Promise<Circle[]>` — all locally stored circles, newest first.
- `getCircle(id): Promise<Circle | undefined>`
- `saveCircle(circle): Promise<void>` — upsert; validates before writing.
- `deleteCircle(id): Promise<void>`
- Storage key: one IndexedDB object store `circles`, keyed by `id` (UUID v4).

### Circle domain (`src/domain.ts`)

- `createCircle(input): Circle` — validates (≥2 members, amount > 0, non-empty name) and derives the first round.
- `markPaid(circle, roundId, memberId, at): Circle` — returns a new circle object; refuses marks on closed rounds.
- `closeRound(circle): Circle` — advances the recipient pointer, opens the next round, records the shortfall if any.
- `potFor(circle): number` — contribution × member count.
- All domain functions are pure (no I/O), so they are unit-tested without a browser.

### Share codec (`src/share.ts`)

- `encodeCircle(circle): string` — canonical JSON of the circle's public state → UTF-8 → base64url → appended as `#c=<payload>`.
- `decodeShareLink(url): Circle | { error: string }` — validates shape and version; returns a plain error on damaged/truncated links.
- Payload is versioned (`v: 1`) so future formats can be detected and rejected honestly.

### Views (`src/views/`)

- `CircleList` — list of circles with current round + recipient summary.
- `CircleDetail` — payout order, round status, paid/unpaid per member, mark-paid / close-round controls.
- `CircleForm` — create/edit circle; plain-language validation errors.
- `ShareView` — shows the share link, copy button, and the "save a local copy" prompt when opened from a link.
- Routing: hash-based (`#/`, `#/circle/:id`, `#/new`), so the app works from any static host.

## Data Models

```ts
type Currency = string; // ISO 4217 code, e.g. "NGN", "XOF", "KES", "USD"

interface Member {
  id: string;        // uuid
  name: string;      // display name, as typed by the coordinator
}

interface ContributionMark {
  memberId: string;
  roundId: string;
  paidAt: string;    // ISO timestamp
}

interface Round {
  id: string;
  number: number;        // 1-based
  recipientId: string;
  status: "open" | "closed";
  closedAt?: string;
  marks: ContributionMark[];
}

interface Circle {
  id: string;
  version: 1;
  name: string;
  contribution: number;  // in the circle's currency, minor units avoided
  currency: Currency;
  schedule: "weekly" | "monthly";
  startDate: string;     // ISO date
  members: Member[];
  payoutOrder: string[]; // member ids, in order
  rounds: Round[];
  createdAt: string;
}
```

### Invariants

- `payoutOrder` is a permutation of `members` ids.
- Exactly one round has `status: "open"` at any time; all earlier rounds are `"closed"`.
- `rounds[n].recipientId === payoutOrder[n % members.length]`.

## Error Handling

- Validation failures in the form show a plain-language message next to the field; nothing is saved.
- IndexedDB unavailable: the app shows a persistent banner — "This device can't save circles" — and runs read-only on in-memory state for the session.
- Damaged share link: `ShareView` shows "This link is damaged or incomplete" and offers to return to the circle list. Never render a partially decoded circle.
- All user-facing errors are plain language; no error codes, no stack traces.

## Testing Strategy

- **Unit tests** (Vitest) for `domain.ts` (create/validate, mark-paid, close-round, payout order, shortfall) and `share.ts` (round-trip encode/decode, damaged payload rejection, version mismatch).
- **Manual first-user pass** on a real phone: create a circle, mark payments, close a round, share the link to a second device, open it offline. Every control must visibly respond.
- **Offline check**: load once online, then disable network and reload — the app must open and operate with no network.
