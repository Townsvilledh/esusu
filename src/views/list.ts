import { currentRound, memberName, potFor, roundProgress } from "../domain";
import { formatMoney } from "../format";
import { listCircles } from "../store";
import { esc } from "../util";

/** Circle list — every circle on this phone, newest first (Req 7.1). */
export async function renderCircleList(view: HTMLElement): Promise<void> {
  const circles = await listCircles();

  if (circles.length === 0) {
    view.innerHTML = `
      <div class="empty">
        <h1>Your savings circles</h1>
        <p>No circles yet. Create one for your ajo, esusu, tontine,
           stokvel or arisan group — it lives only on this phone.</p>
        <p><a class="btn primary block" href="#/new">Create a circle</a></p>
      </div>
    `;
    return;
  }

  const cards = circles
    .map((circle) => {
      const round = currentRound(circle);
      const progress = round ? roundProgress(circle, round) : undefined;
      const summary = round
        ? `Round ${round.number} · ${esc(memberName(circle, round.recipientId))} receives ${formatMoney(potFor(circle), circle.currency)}`
        : "No open round";
      const paid = progress
        ? `<span class="badge ${progress.paidCount === progress.memberCount ? "paid" : "unpaid"}">${progress.paidCount} of ${progress.memberCount} paid</span>`
        : "";
      return `
        <a class="card" href="#/circle/${encodeURIComponent(circle.id)}">
          <p class="card-title">${esc(circle.name)}</p>
          <p class="muted">${formatMoney(circle.contribution, circle.currency)} per member · ${circle.schedule}</p>
          <div class="row"><span>${summary}</span>${paid}</div>
        </a>
      `;
    })
    .join("");

  view.innerHTML = `
    <h1>Your savings circles</h1>
    ${cards}
    <div class="actions">
      <a class="btn primary block" href="#/new">Create a circle</a>
    </div>
  `;
}
