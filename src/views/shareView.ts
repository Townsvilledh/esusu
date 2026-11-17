import { currentRound, memberName, newId, potFor, roundProgress, type Circle } from "../domain";
import { formatMoney } from "../format";
import { decodeShareLink, shareUrlFor } from "../share";
import { getCircle, saveCircle } from "../store";
import { esc } from "../util";

function circleSummaryHtml(circle: Circle): string {
  const round = currentRound(circle);
  const progress = round ? roundProgress(circle, round) : undefined;
  const memberRows = circle.members
    .map((m) => {
      const paid = round?.marks.some((mark) => mark.memberId === m.id);
      return `<div class="row"><span>${esc(m.name)}</span>${
        round ? `<span class="badge ${paid ? "paid" : "unpaid"}">${paid ? "Paid" : "Not paid"}</span>` : ""
      }</div>`;
    })
    .join("");
  return `
    <div class="summary">
      <p class="big">${esc(circle.name)}</p>
      <p class="muted">${formatMoney(circle.contribution, circle.currency)} per member · ${circle.schedule} · ${circle.members.length} members</p>
      ${
        round
          ? `<p>Round ${round.number}: ${esc(memberName(circle, round.recipientId))} receives ${formatMoney(potFor(circle), circle.currency)} · ${progress?.paidCount ?? 0} of ${progress?.memberCount ?? 0} paid</p>`
          : ""
      }
    </div>
    <div class="card">${memberRows}</div>
  `;
}

/** Share one of your own circles: link, copy button, system share sheet. */
export async function renderShareView(view: HTMLElement, id: string): Promise<void> {
  const circle = await getCircle(id);
  if (!circle) {
    view.innerHTML = `
      <h1>Circle not found</h1>
      <p class="muted">That circle isn't on this phone.</p>
      <p><a class="btn block" href="#/">Back to your circles</a></p>
    `;
    return;
  }

  const base = window.location.href.split("#")[0];
  const link = shareUrlFor(circle, base);

  view.innerHTML = `
    <p><a href="#/circle/${encodeURIComponent(circle.id)}">&larr; Back to the circle</a></p>
    <h1>Share "${esc(circle.name)}"</h1>
    <p class="muted">Anyone who opens this link sees the circle exactly as it is now
       and can save their own copy. The link carries the circle itself — there is
       no server and nothing to sign up for. Send a fresh link whenever the
       circle changes.</p>
    <label for="share-link">Share link</label>
    <input id="share-link" type="text" readonly value="${esc(link)}" />
    <div class="actions">
      <button class="primary block" id="copy-link">Copy link</button>
      ${"share" in navigator ? `<button class="block" id="system-share">Share…</button>` : ""}
    </div>
    <p class="small muted" id="share-status"></p>
  `;

  const status = view.querySelector("#share-status");
  const input = view.querySelector<HTMLInputElement>("#share-link")!;

  view.querySelector("#copy-link")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(link);
      if (status) status.textContent = "Link copied.";
    } catch {
      input.select();
      document.execCommand?.("copy");
      if (status) status.textContent = "Link selected — copy it now.";
    }
  });

  view.querySelector("#system-share")?.addEventListener("click", async () => {
    try {
      await navigator.share({ title: `Esusu: ${circle.name}`, url: link });
    } catch {
      // User dismissed the share sheet; nothing to do.
    }
  });
}

/** Opened from a `#c=` share link: show the circle, offer a local copy. */
export async function renderSharedCircle(view: HTMLElement, url: string): Promise<void> {
  const result = decodeShareLink(url);
  if ("error" in result) {
    view.innerHTML = `
      <h1>That link won't open</h1>
      <div class="banner error" role="alert">${esc(result.error)}</div>
      <p><a class="btn block" href="#/">Go to your circles</a></p>
    `;
    return;
  }

  const shared = result.circle;
  view.innerHTML = `
    <h1>Shared circle</h1>
    ${circleSummaryHtml(shared)}
    <div class="actions">
      <button class="primary block" id="save-copy">Save a copy on this phone</button>
      <a class="btn block" href="#/">Not now — go to your circles</a>
    </div>
    <p class="small muted">Saving makes this your own copy on this phone. It will not
       change the sender's copy, and their later changes won't change yours.</p>
  `;

  view.querySelector("#save-copy")?.addEventListener("click", async () => {
    // If this exact circle is already saved here, keep the new copy
    // independent by giving it a fresh id (Req 5.3).
    const existing = await getCircle(shared.id);
    const copy: Circle = existing ? { ...shared, id: newId() } : shared;
    await saveCircle(copy);
    window.location.hash = `#/circle/${encodeURIComponent(copy.id)}`;
  });
}
