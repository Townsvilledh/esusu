import { describe, expect, it } from "vitest";
import {
  closeRound,
  createCircle,
  currentRound,
  markPaid,
  payoutSchedule,
  potFor,
  roundProgress,
  unmarkPaid,
  validateCircleInput,
  type CreateCircleInput,
} from "./domain";

const base: CreateCircleInput = {
  name: "Market Women Circle",
  contribution: 5000,
  currency: "NGN",
  schedule: "weekly",
  startDate: "2026-11-18",
  memberNames: ["Ada", "Bola", "Chidi"],
};

describe("createCircle + validation", () => {
  it("creates a circle with round 1 open and the first member as recipient", () => {
    const c = createCircle(base);
    expect(c.members).toHaveLength(3);
    expect(c.payoutOrder).toEqual(c.members.map((m) => m.id));
    const round = currentRound(c);
    expect(round?.number).toBe(1);
    expect(round?.recipientId).toBe(c.members[0].id);
    expect(round?.status).toBe("open");
  });

  it("honours an explicit payout order", () => {
    const c = createCircle({ ...base, payoutOrderIndices: [2, 0, 1] });
    expect(currentRound(c)?.recipientId).toBe(c.members[2].id);
    expect(c.payoutOrder).toEqual([c.members[2].id, c.members[0].id, c.members[1].id]);
  });

  it("rejects an empty name, zero contribution, and fewer than 2 members", () => {
    expect(validateCircleInput({ ...base, name: "  " })).toContain("Give the circle a name.");
    expect(validateCircleInput({ ...base, contribution: 0 })).toContain(
      "The contribution must be more than zero."
    );
    expect(validateCircleInput({ ...base, memberNames: ["Ada"] })).toContain(
      "A circle needs at least 2 members."
    );
    expect(() => createCircle({ ...base, contribution: -5 })).toThrow(
      "The contribution must be more than zero."
    );
    expect(() => createCircle({ ...base, memberNames: ["Ada", " "] })).toThrow(
      "A circle needs at least 2 members."
    );
  });

  it("rejects a payout order that is not a permutation of the members", () => {
    expect(validateCircleInput({ ...base, payoutOrderIndices: [0, 0, 1] })).toContain(
      "The payout order must list every member exactly once."
    );
  });

  it("pot is contribution × members", () => {
    const c = createCircle(base);
    expect(potFor(c)).toBe(15000);
  });
});

describe("markPaid / unmarkPaid", () => {
  it("records the payer and updates the collected total immediately", () => {
    const c = createCircle(base);
    const round = currentRound(c)!;
    const next = markPaid(c, round.id, c.members[1].id, new Date("2026-11-18T10:00:00Z"));
    const progress = roundProgress(next, currentRound(next)!);
    expect(progress.paidCount).toBe(1);
    expect(progress.collected).toBe(5000);
    expect(progress.unpaidIds).toEqual([c.members[0].id, c.members[2].id]);
    // purity: the original circle is untouched
    expect(currentRound(c)!.marks).toHaveLength(0);
  });

  it("marking the same member twice does not double-count", () => {
    const c = createCircle(base);
    const round = currentRound(c)!;
    const once = markPaid(c, round.id, c.members[0].id);
    const twice = markPaid(once, round.id, c.members[0].id);
    expect(currentRound(twice)!.marks).toHaveLength(1);
  });

  it("undo removes the mark while the round is open", () => {
    const c = createCircle(base);
    const round = currentRound(c)!;
    const marked = markPaid(c, round.id, c.members[0].id);
    const undone = unmarkPaid(marked, round.id, c.members[0].id);
    expect(currentRound(undone)!.marks).toHaveLength(0);
  });

  it("refuses marks and undos on a closed round", () => {
    const c = createCircle(base);
    const round = currentRound(c)!;
    const closed = closeRound(c);
    expect(() => markPaid(closed, round.id, c.members[0].id)).toThrow("That round is closed.");
    expect(() => unmarkPaid(closed, round.id, c.members[0].id)).toThrow("That round is closed.");
  });
});

describe("closeRound + payout order", () => {
  it("advances to the next recipient and opens the next round", () => {
    const c = createCircle(base);
    const next = closeRound(c);
    const round = currentRound(next)!;
    expect(round.number).toBe(2);
    expect(round.recipientId).toBe(c.members[1].id);
    expect(next.rounds[0].status).toBe("closed");
    expect(next.rounds.filter((r) => r.status === "open")).toHaveLength(1);
  });

  it("cycles back to the first member after the last", () => {
    let c = createCircle(base);
    c = closeRound(c);
    c = closeRound(c);
    c = closeRound(c);
    const round = currentRound(c)!;
    expect(round.number).toBe(4);
    expect(round.recipientId).toBe(c.members[0].id);
  });

  it("records the shortfall: unpaid members stay on the closed round", () => {
    const c = createCircle(base);
    const round = currentRound(c)!;
    const partial = markPaid(c, round.id, c.members[0].id);
    const closed = closeRound(partial);
    expect(closed.rounds[0].shortfall).toEqual([c.members[1].id, c.members[2].id]);
    expect(closed.rounds[0].marks).toHaveLength(1);
  });

  it("payout schedule shows the round each member next receives", () => {
    const c = createCircle(base);
    const schedule = payoutSchedule(c);
    expect(schedule).toEqual([
      { memberId: c.members[0].id, roundNumber: 1 },
      { memberId: c.members[1].id, roundNumber: 2 },
      { memberId: c.members[2].id, roundNumber: 3 },
    ]);
    const afterOne = closeRound(c);
    expect(payoutSchedule(afterOne)).toEqual([
      { memberId: c.members[0].id, roundNumber: 4 },
      { memberId: c.members[1].id, roundNumber: 2 },
      { memberId: c.members[2].id, roundNumber: 3 },
    ]);
  });
});
