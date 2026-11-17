# Requirements Document — Esusu

## Introduction

Esusu is a phone-first, offline-first rotating-savings circle tracker for ajo / esusu / tontine / stokvel / arisan circles. A circle is a group of N members who each contribute a fixed amount on a fixed schedule; each round, one member receives the whole pot. The app records who paid, whose turn it is, and when the next round lands — entirely on the user's own phone, with no account, no KYC, and no server.

The app is a static web app (installable PWA) that stores all data locally in the browser. A circle can be shared as a link that carries its public state, so members can view the same circle without any backend.

## Glossary

- **Circle**: one savings group with a fixed contribution amount, currency, schedule, member list, and payout order.
- **Round**: one payout cycle of a circle; each round has exactly one recipient.
- **Pot**: the total collected in a round (contribution × number of members).
- **Coordinator**: the member who creates and administers a circle (local role only — no server authority).
- **Share link**: a URL that encodes a circle's public state so another phone can open and view it.

## Requirements

### Requirement 1 — Create a circle

**User Story:** As a circle coordinator, I want to create a savings circle with a name, contribution amount, currency, schedule, and members, so that the group has one shared record to follow.

#### Acceptance Criteria

1. WHEN the coordinator creates a circle THEN the system SHALL record a name, contribution amount, currency, schedule (weekly or monthly), start date, member list, and payout order.
2. WHEN a circle is created THEN the system SHALL require at least 2 members and a contribution amount greater than zero.
3. WHEN a circle is created THEN the system SHALL persist it locally before confirming success to the user.
4. IF the coordinator enters an invalid value (empty name, zero contribution, fewer than 2 members) THEN the system SHALL show a plain-language error and SHALL NOT create the circle.

### Requirement 2 — Record contributions

**User Story:** As a member, I want to mark a contribution as paid for a round, so the circle always knows who has paid and who has not.

#### Acceptance Criteria

1. WHEN a member marks a contribution paid for the current round THEN the system SHALL record the payer, the round, and the time it was marked.
2. WHEN a contribution is marked paid THEN the system SHALL update the round's collected total immediately and visibly.
3. WHEN a contribution is marked by mistake THEN the system SHALL allow the mark to be undone before the round is closed.
4. IF the round is already closed THEN the system SHALL NOT accept new contribution marks for that round.

### Requirement 3 — Payout order and rounds

**User Story:** As a member, I want to see whose turn it is to receive the pot and when the next round starts, so I always know where I stand in the circle.

#### Acceptance Criteria

1. WHEN a circle is viewed THEN the system SHALL show the current round, its recipient, and the pot amount.
2. WHEN a round is closed THEN the system SHALL advance to the next recipient in the payout order and start the next round.
3. WHEN a circle's payout order is viewed THEN the system SHALL show every member and the round in which each receives the pot.
4. IF a round is closed before every member has contributed THEN the system SHALL still record the unpaid members and show the shortfall on that round.

### Requirement 4 — Offline-first local storage

**User Story:** As a member with unreliable connectivity, I want the app to work fully offline, so I can use it wherever I am.

#### Acceptance Criteria

1. WHEN the app is opened with no network connection THEN the system SHALL load and operate normally using only locally stored data.
2. WHEN data is changed offline THEN the system SHALL persist the change locally immediately, with no network call attempted.
3. WHEN the app is opened for the first time THEN the system SHALL work without any sign-up, sign-in, or identity check.
4. IF local storage is unavailable (e.g. private browsing restrictions) THEN the system SHALL tell the user plainly that data cannot be saved on this device.

### Requirement 5 — Share a circle by link

**User Story:** As a coordinator, I want to share a circle as a link, so other members can open the same circle on their own phones without any server.

#### Acceptance Criteria

1. WHEN the coordinator shares a circle THEN the system SHALL produce a link that encodes the circle's public state (name, contribution, currency, schedule, members, payout order, rounds, contribution marks).
2. WHEN a member opens a share link THEN the system SHALL display the circle and offer to save a local copy.
3. WHEN a member saves a shared circle THEN the system SHALL store it locally as their own copy, independent of the sender's copy afterwards.
4. IF a share link is damaged or truncated THEN the system SHALL say so plainly instead of showing a wrong circle.

### Requirement 6 — Phone-first interface

**User Story:** As a member using a small phone, I want the app to be usable with one hand and readable in daylight, so I can check my circle quickly.

#### Acceptance Criteria

1. WHEN the app is opened on a phone THEN the system SHALL present a single-column layout with tap targets at least 44px tall.
2. WHEN the app is opened THEN the system SHALL show the circle's current state (current round, recipient, paid/unpaid) without scrolling past a summary.
3. WHEN the app is installed to the home screen THEN the system SHALL launch full-screen as an installed app.
4. IF the user opens the app on a desktop browser THEN the system SHALL still render correctly in a centred narrow column.

### Requirement 7 — Multiple circles and currencies

**User Story:** As a member of more than one circle, I want to keep several circles in the app, each in its own currency, so I can track them all in one place.

#### Acceptance Criteria

1. WHEN the user opens the app THEN the system SHALL list every circle stored locally.
2. WHEN a circle uses a currency THEN the system SHALL display amounts in that currency's symbol/code and SHALL NOT convert between currencies.
3. WHEN the user creates a second circle THEN the system SHALL keep the first circle's data untouched.
4. IF a circle is deleted THEN the system SHALL ask for confirmation first and SHALL remove only that circle.
