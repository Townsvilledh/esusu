/* Esusu domain layer — pure functions, no I/O.
 *
 * Every rule from the requirements lives here so it can be unit-tested
 * without a browser: circle creation + validation, contribution marks,
 * round closing with shortfall recording, and payout-order derivation.
 */

export type Currency = string; // ISO 4217 code, e.g. "NGN", "XOF", "KES", "USD"
export type Schedule = "weekly" | "monthly";

export interface Member {
  id: string;
  name: string;
}

export interface ContributionMark {
  memberId: string;
  roundId: string;
  paidAt: string; // ISO timestamp
}

export interface Round {
  id: string;
  number: number; // 1-based
  recipientId: string;
  status: "open" | "closed";
  closedAt?: string;
  /** Member ids who had NOT paid when this round was closed (the shortfall). */
  shortfall?: string[];
  marks: ContributionMark[];
}

export interface Circle {
  id: string;
  version: 1;
  name: string;
  contribution: number;
  currency: Currency;
  schedule: Schedule;
  startDate: string; // ISO date
  members: Member[];
  payoutOrder: string[]; // member ids, in order
  rounds: Round[];
  createdAt: string;
}

export interface CreateCircleInput {
  name: string;
  contribution: number;
  currency: Currency;
  schedule: Schedule;
  startDate: string;
  memberNames: string[];
  /** Optional payout order as indices into memberNames. Defaults to the order members were entered. */
  payoutOrderIndices?: number[];
}

/** Plain-language validation problems; an empty list means the input is fine. */
export function validateCircleInput(input: CreateCircleInput): string[] {
  const problems: string[] = [];
  if (!input.name || input.name.trim() === "") {
    problems.push("Give the circle a name.");
  }
  if (!Number.isFinite(input.contribution) || input.contribution <= 0) {
    problems.push("The contribution must be more than zero.");
  }
  if (!input.currency || input.currency.trim() === "") {
    problems.push("Choose a currency.");
  }
  const names = (input.memberNames ?? []).map((n) => (n ?? "").trim()).filter((n) => n !== "");
  if (names.length < 2) {
    problems.push("A circle needs at least 2 members.");
  }
  if (input.payoutOrderIndices) {
    const idx = input.payoutOrderIndices;
    const isPermutation =
      idx.length === names.length &&
      new Set(idx).size === names.length &&
      idx.every((i) => Number.isInteger(i) && i >= 0 && i < names.length);
    if (!isPermutation) {
      problems.push("The payout order must list every member exactly once.");
    }
  }
  return problems;
}

/** Structural validation used by the store before any circle is written. */
export function validateCircle(circle: Circle): string[] {
  const problems: string[] = [];
  if (!circle || typeof circle !== "object") return ["Not a circle."];
  if (circle.version !== 1) problems.push("Unsupported circle version.");
  if (!circle.name || circle.name.trim() === "") problems.push("Give the circle a name.");
  if (!Number.isFinite(circle.contribution) || circle.contribution <= 0) {
    problems.push("The contribution must be more than zero.");
  }
  if (!Array.isArray(circle.members) || circle.members.length < 2) {
    problems.push("A circle needs at least 2 members.");
  } else {
    const ids = circle.members.map((m) => m.id);
    const order = circle.payoutOrder ?? [];
    const isPermutation =
      order.length === ids.length &&
      new Set(order).size === ids.length &&
      order.every((id) => ids.includes(id));
    if (!isPermutation) problems.push("The payout order must list every member exactly once.");
  }
  const open = (circle.rounds ?? []).filter((r) => r.status === "open");
  if (open.length !== 1) problems.push("A circle must have exactly one open round.");
  return problems;
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  // Fallback for older engines: timestamp + random suffix.
  return `id-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

function openRound(number: number, recipientId: string): Round {
  return { id: newId(), number, recipientId, status: "open", marks: [] };
}

/**
 * Create a circle. Throws an Error carrying the first plain-language problem
 * when the input is invalid — nothing is created in that case (Req 1.4).
 */
export function createCircle(input: CreateCircleInput, now: Date = new Date()): Circle {
  const problems = validateCircleInput(input);
  if (problems.length > 0) throw new Error(problems[0]);

  const members: Member[] = input.memberNames
    .map((n) => (n ?? "").trim())
    .filter((n) => n !== "")
    .map((name) => ({ id: newId(), name }));

  const payoutOrder = input.payoutOrderIndices
    ? input.payoutOrderIndices.map((i) => members[i].id)
    : members.map((m) => m.id);

  return {
    id: newId(),
    version: 1,
    name: input.name.trim(),
    contribution: input.contribution,
    currency: input.currency.trim().toUpperCase(),
    schedule: input.schedule,
    startDate: input.startDate,
    members,
    payoutOrder,
    rounds: [openRound(1, payoutOrder[0])],
    createdAt: now.toISOString(),
  };
}

/** The round currently accepting contributions, if any. */
export function currentRound(circle: Circle): Round | undefined {
  return circle.rounds.find((r) => r.status === "open");
}

/** Pot for a round: contribution × number of members (Req: glossary). */
export function potFor(circle: Circle): number {
  return circle.contribution * circle.members.length;
}

export function memberName(circle: Circle, memberId: string): string {
  return circle.members.find((m) => m.id === memberId)?.name ?? "Unknown member";
}

export interface RoundProgress {
  paidCount: number;
  memberCount: number;
  collected: number;
  pot: number;
  unpaidIds: string[];
}

export function roundProgress(circle: Circle, round: Round): RoundProgress {
  const paidIds = new Set(round.marks.map((m) => m.memberId));
  return {
    paidCount: round.marks.length,
    memberCount: circle.members.length,
    collected: round.marks.length * circle.contribution,
    pot: potFor(circle),
    unpaidIds: circle.members.filter((m) => !paidIds.has(m.id)).map((m) => m.id),
  };
}

function cloneCircle(circle: Circle): Circle {
  return {
    ...circle,
    members: circle.members.map((m) => ({ ...m })),
    payoutOrder: [...circle.payoutOrder],
    rounds: circle.rounds.map((r) => ({
      ...r,
      marks: r.marks.map((m) => ({ ...m })),
      shortfall: r.shortfall ? [...r.shortfall] : undefined,
    })),
  };
}

function findRound(circle: Circle, roundId: string): Round {
  const round = circle.rounds.find((r) => r.id === roundId);
  if (!round) throw new Error("That round does not exist.");
  return round;
}

/**
 * Record a member's contribution for a round (Req 2.1).
 * Refuses marks on a closed round (Req 2.4). Marking twice is a no-op.
 * Returns a NEW circle object; the input is never mutated.
 */
export function markPaid(
  circle: Circle,
  roundId: string,
  memberId: string,
  at: Date = new Date()
): Circle {
  const next = cloneCircle(circle);
  const round = findRound(next, roundId);
  if (round.status === "closed") throw new Error("That round is closed.");
  if (!next.members.some((m) => m.id === memberId)) throw new Error("That member is not in this circle.");
  if (round.marks.some((m) => m.memberId === memberId)) return next;
  round.marks.push({ memberId, roundId, paidAt: at.toISOString() });
  return next;
}

/** Undo a contribution mark — only while the round is still open (Req 2.3). */
export function unmarkPaid(circle: Circle, roundId: string, memberId: string): Circle {
  const next = cloneCircle(circle);
  const round = findRound(next, roundId);
  if (round.status === "closed") throw new Error("That round is closed.");
  round.marks = round.marks.filter((m) => m.memberId !== memberId);
  return next;
}

/**
 * Close the current round and open the next one (Req 3.2).
 * Members who had not paid are recorded on the closed round as its
 * shortfall (Req 3.4). The next recipient follows the payout order,
 * cycling back to the first member after the last (design invariant:
 * rounds[n].recipientId === payoutOrder[n % members.length]).
 */
export function closeRound(circle: Circle, at: Date = new Date()): Circle {
  const next = cloneCircle(circle);
  const round = currentRound(next);
  if (!round) throw new Error("There is no open round to close.");
  const progress = roundProgress(next, round);
  round.status = "closed";
  round.closedAt = at.toISOString();
  round.shortfall = progress.unpaidIds;
  const nextNumber = round.number + 1;
  const recipientId = next.payoutOrder[(nextNumber - 1) % next.payoutOrder.length];
  next.rounds.push(openRound(nextNumber, recipientId));
  return next;
}

/**
 * The next round in which each member receives the pot, at or after the
 * current round — used to show the full payout order with round numbers
 * (Req 3.3).
 */
export function payoutSchedule(circle: Circle): { memberId: string; roundNumber: number }[] {
  const current = currentRound(circle);
  const from = current ? current.number : circle.rounds.length + 1;
  const len = circle.payoutOrder.length;
  return circle.payoutOrder.map((memberId, i) => {
    // Recipient of round r is payoutOrder[(r - 1) % len]; find the first
    // r >= from whose recipient is this member.
    const offset = (((i - (from - 1)) % len) + len) % len;
    return { memberId, roundNumber: from + offset };
  });
}
