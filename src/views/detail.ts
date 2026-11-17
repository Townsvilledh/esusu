import {
  closeRound,
  currentRound,
  markPaid,
  memberName,
  payoutSchedule,
  potFor,
  roundProgress,
  unmarkPaid,
  type Circle,
} from "../domain";
import { formatMoney } from "../format";
import { deleteCircle, getCircle, saveCircle } from "../store";
import { esc } from "../util";

/** Circle detail — summary first (Req 6.2), then this round's marks,
 *  the payout order, and past rounds. */
export async function renderCircleDetail(view: HTMLElement, id: string): Promise<void> {
  const circle = await getCircle(id);
  if (!circle) {
    view.innerHTML = `
      <h1>Circle not found</h1>
      <p class="muted">That circle isn't on this phone.</p>
      <p><a class="btn block" href="#/">Back to your circles</a></p>
    `;
    return;
  }

  const round = currentRound(circle);
  const pot = potFor(circle);
  const progress = round ? roundProgress(circle, round) : undefined;
  const paidIds = new Set(round?.marks.map((m) => m.memberId) ?? []);

  const memberRows = circle.members
    .map((member) => {
      const paid = paidIds.has(member.id);
      const isRecipient = round?.recipientId === member.id;
      return `
        <div class="row">
          <span>${esc(member.name)}${isRecipient ? ' <span class="badge paid">receives this round</span>' : ""}</span>
          ${
            paid
              ? `<span><span class="badge paid">Paid</span>
                 <button class="ghost" data-unmark="${esc(member.id)}">Undo</button></span>`
              : `<button data-mark="${esc(member.id)}">Mark paid</button>`
          }
        </div>
      `;
    })
    .join("");

  const scheduleRows = payoutSchedule(circle)
    .map(
      ({ memberId, roundNumber }) => `
        <div class="row">
          <span>Round ${roundNumber}</span>
          <span>${esc(memberName(circle, memberId))}${round && roundNumber === round.number ? ' <span class="badge paid">this round</span>' : ""}</span>
        </div>
      `
    )
    .join("");

  const pastRounds = circle.rounds
    .filter((r) => r.status === "closed")
    .slice()
    .reverse()
    .map((r) => {
      const shortfall =
        r.shortfall && r.shortfall.length > 0
          ? `<p class="small muted">Shortfall: ${r.shortfall.map((mid) => esc(memberName(circle, mid))).join(", ")} did not pay (${formatMoney(r.shortfall.length * circle.contribution, circle.currency)} short).</p>`
          : `<p class="small muted">Everyone paid in full.</p>`;
      return `
        <div class="card">
          <p class="card-title">Round ${r.number} — ${esc(memberName(circle, r.recipientId))}</p>
          ${shortfall}
        </div>
      `;
    })
    .join("");

  view.innerHTML = `
    <p><a href="#/">&larr; Your circles</a></p>
    <h1>${esc(circle.name)}</h1>

    <div class="summary">
      <p class="big">Round ${round?.number ?? "—"}: ${round ? esc(memberName(circle, round.recipientId)) : "—"} receives ${formatMoney(pot, circle.currency)}</p>
      <p class="muted">${formatMoney(circle.contribution, circle.currency)} per member · ${circle.schedule} · started ${esc(circle.startDate)}</p>
      <p>${progress ? `${progress.paidCount} of ${progress.memberCount} paid · ${formatMoney(progress.collected, circle.currency)} of ${formatMoney(pot, circle.currency)} collected` : ""}</p>
    </div>

    <h2>This round — who has paid</h2>
    <div class="card">${memberRows}</div>

    <div class="actions">
      <button class="primary block" id="close-round">Close round ${round?.number ?? ""} and start the next</button>
      <a class="btn block" href="#/share/${encodeURIComponent(circle.id)}">Share this circle</a>
      <button class="danger block" id="delete-circle">Delete this circle</button>
    </div>

    <h2>Payout order</h2>
    <div class="card">${scheduleRows}</div>

    ${pastRounds ? `<h2>Past rounds</h2>${pastRounds}` : ""}
  `;

  const rerender = () => renderCircleDetail(view, id);

  view.querySelectorAll<HTMLButtonElement>("[data-mark]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!round) return;
      const updated = markPaid(circle, round.id, btn.dataset.mark!);
      await saveCircle(updated); // persisted before the UI confirms (Req 1.3)
      await rerender();
    });
  });

  view.querySelectorAll<HTMLButtonElement>("[data-unmark]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!round) return;
      const updated = unmarkPaid(circle, round.id, btn.dataset.unmark!);
      await saveCircle(updated);
      await rerender();
    });
  });

  view.querySelector<HTMLButtonElement>("#close-round")?.addEventListener("click", async () => {
    if (!round || !progress) return;
    if (progress.unpaidIds.length > 0) {
      const names = progress.unpaidIds.map((mid) => memberName(circle, mid)).join(", ");
      const ok = window.confirm(
        `${names} ${progress.unpaidIds.length === 1 ? "has" : "have"} not paid yet. ` +
          `Close round ${round.number} anyway? The shortfall will be recorded on the round.`
      );
      if (!ok) return;
    }
    const updated: Circle = closeRound(circle);
    await saveCircle(updated);
    await rerender();
  });

  view.querySelector<HTMLButtonElement>("#delete-circle")?.addEventListener("click", async () => {
    const ok = window.confirm(
      `Delete "${circle.name}"? This removes it from this phone only. Other members keep their own copies.`
    );
    if (!ok) return;
    await deleteCircle(circle.id); // removes only this circle (Req 7.4)
    window.location.hash = "#/";
  });
}
