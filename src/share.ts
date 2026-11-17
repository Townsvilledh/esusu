/* Esusu share codec — a circle's public state inside a URL.
 *
 * encode: canonical JSON → UTF-8 bytes → base64url → `#c=<payload>`.
 * decode: validates the payload's shape and version before returning a
 * circle; anything damaged, truncated, or from another version comes back
 * as a plain-language error, never a half-decoded circle (Requirement 5.4).
 */

import { validateCircle, type Circle } from "./domain";

export type DecodeResult = { circle: Circle } | { error: string };

const DAMAGED = "This link is damaged or incomplete.";

export function encodeCircle(circle: Circle): string {
  const json = JSON.stringify(circle);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeCircle(payload: string): DecodeResult {
  let parsed: unknown;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return { error: DAMAGED };
  }
  if (!parsed || typeof parsed !== "object") return { error: DAMAGED };
  const version = (parsed as { version?: unknown }).version;
  if (version !== 1) {
    return { error: "This link was made by a different version of Esusu and can't be opened here." };
  }
  const problems = validateCircle(parsed as Circle);
  if (problems.length > 0) return { error: DAMAGED };
  return { circle: parsed as Circle };
}

/** Build the full share link for a circle from the app's current base URL. */
export function shareUrlFor(circle: Circle, baseUrl: string): string {
  const url = new URL(baseUrl);
  url.hash = `c=${encodeCircle(circle)}`;
  return url.toString();
}

/** Decode a full URL (or bare hash) carrying a `#c=` payload. */
export function decodeShareLink(url: string): DecodeResult {
  const hashIndex = url.indexOf("#");
  const hash = hashIndex >= 0 ? url.slice(hashIndex + 1) : url;
  const payload = new URLSearchParams(hash).get("c");
  if (!payload) return { error: DAMAGED };
  return decodeCircle(payload);
}
