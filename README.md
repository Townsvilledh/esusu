# Esusu

Phone-first, offline-first rotating-savings circle tracker — ajo, esusu, tontine, stokvel, arisan. No accounts. No KYC. No server.

A savings circle is simple: a group of people agree a fixed contribution and a fixed schedule; each round, one member takes the whole pot. Esusu keeps the record straight — who paid, whose turn it is, when the next round lands — entirely on the member's own phone.

## Principles

- **Local-first.** All circle data lives in the browser (IndexedDB). Nothing leaves the device unless the user chooses to share it.
- **Offline-first.** Create circles, record contributions, and check the payout order with no connection at all.
- **No accounts, no KYC, no server.** There is nothing to sign up for and no one to hand identity documents to.
- **Shareable by link.** A circle can be shared as a link that carries its (public) state — members open it and see the same circle, no backend involved.

## Status

Built with [Kiro](https://kiro.dev) for **Kiroween 2026** (Costume Contest category). Specs live in [`.kiro/specs/esusu`](.kiro/specs/esusu) — requirements, design, and tasks. Build window: 18–28 Nov 2026.

## Licence

MIT — see [LICENSE](LICENSE).
