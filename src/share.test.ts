import { describe, expect, it } from "vitest";
import { closeRound, createCircle, markPaid, currentRound } from "./domain";
import { decodeCircle, decodeShareLink, encodeCircle, shareUrlFor } from "./share";

function sampleCircle() {
  let c = createCircle({
    name: "Adéwálé's Circle", // non-ASCII on purpose: the codec must be UTF-8 safe
    contribution: 2500,
    currency: "XOF",
    schedule: "monthly",
    startDate: "2026-11-20",
    memberNames: ["Adéwálé", "Fatou", "Kwame", "Zainab"],
  });
  const round = currentRound(c)!;
  c = markPaid(c, round.id, c.members[0].id);
  c = markPaid(c, round.id, c.members[2].id);
  return c;
}

describe("share codec", () => {
  it("round-trips a circle exactly, including marks and unicode names", () => {
    const c = sampleCircle();
    const result = decodeCircle(encodeCircle(c));
    expect("circle" in result).toBe(true);
    if ("circle" in result) expect(result.circle).toEqual(c);
  });

  it("round-trips through a full share URL", () => {
    const c = sampleCircle();
    const url = shareUrlFor(c, "https://townsvilledh.github.io/esusu/");
    expect(url).toContain("#c=");
    const result = decodeShareLink(url);
    expect("circle" in result).toBe(true);
    if ("circle" in result) expect(result.circle).toEqual(c);
  });

  it("rejects garbage and truncated payloads with a plain error", () => {
    expect(decodeCircle("not-a-real-payload!!!")).toEqual({
      error: "This link is damaged or incomplete.",
    });
    const good = encodeCircle(sampleCircle());
    const truncated = good.slice(0, Math.floor(good.length / 2));
    const result = decodeCircle(truncated);
    expect("error" in result).toBe(true);
  });

  it("rejects a payload whose shape is not a valid circle", () => {
    const bogus = { version: 1, name: "Fake", members: [] };
    const payload = btoa(JSON.stringify(bogus))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const result = decodeCircle(payload);
    expect("error" in result).toBe(true);
  });

  it("rejects a version mismatch honestly", () => {
    const c = { ...sampleCircle(), version: 2 };
    const result = decodeCircle(encodeCircle(c as never));
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error).toContain("different version");
  });

  it("a closed-round circle still round-trips (exactly one open round)", () => {
    const c = closeRound(sampleCircle());
    const result = decodeCircle(encodeCircle(c));
    expect("circle" in result).toBe(true);
    if ("circle" in result) expect(result.circle.rounds).toHaveLength(2);
  });
});
