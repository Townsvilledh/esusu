import { createCircle } from "../domain";
import { CURRENCIES } from "../format";
import { saveCircle } from "../store";
import { esc } from "../util";

/** Create-circle form — plain-language errors next to each field (Req 1.4). */
export function renderCircleForm(view: HTMLElement): void {
  const today = new Date().toISOString().slice(0, 10);
  const currencyOptions = CURRENCIES.map(
    (c) => `<option value="${c.code}"${c.code === "NGN" ? " selected" : ""}>${esc(c.label)}</option>`
  ).join("");

  view.innerHTML = `
    <p><a href="#/">&larr; Your circles</a></p>
    <h1>Create a circle</h1>
    <form id="circle-form" novalidate>
      <label for="f-name">Circle name</label>
      <input id="f-name" type="text" autocomplete="off" placeholder="e.g. Market Women Circle" />
      <p class="field-error" id="e-name"></p>

      <label for="f-contribution">Contribution per member</label>
      <input id="f-contribution" type="number" inputmode="decimal" min="0" step="any" placeholder="e.g. 5000" />
      <p class="field-error" id="e-contribution"></p>

      <label for="f-currency">Currency</label>
      <select id="f-currency">${currencyOptions}</select>

      <label for="f-schedule">Schedule</label>
      <select id="f-schedule">
        <option value="weekly" selected>Weekly</option>
        <option value="monthly">Monthly</option>
      </select>

      <label for="f-start">Start date</label>
      <input id="f-start" type="date" value="${today}" />

      <label>Members (at least 2)</label>
      <p class="small muted">Members receive the pot in the order you list them.</p>
      <div id="member-rows"></div>
      <p class="field-error" id="e-members"></p>
      <button type="button" class="ghost" id="add-member">+ Add a member</button>

      <div class="actions">
        <button type="submit" class="primary block">Create circle</button>
      </div>
    </form>
  `;

  const rows = view.querySelector<HTMLDivElement>("#member-rows")!;

  function addMemberRow(value = ""): void {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <input type="text" class="member-name" autocomplete="off"
             placeholder="Member name" value="${esc(value)}" style="flex:1" />
      <button type="button" class="ghost remove-member" aria-label="Remove member">&times;</button>
    `;
    row.querySelector(".remove-member")?.addEventListener("click", () => row.remove());
    rows.appendChild(row);
  }

  addMemberRow();
  addMemberRow();
  addMemberRow();

  view.querySelector("#add-member")?.addEventListener("click", () => addMemberRow());

  const setError = (id: string, message: string) => {
    const el = view.querySelector(`#${id}`);
    if (el) el.textContent = message;
  };

  view.querySelector<HTMLFormElement>("#circle-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = view.querySelector<HTMLInputElement>("#f-name")!.value;
    const contributionRaw = view.querySelector<HTMLInputElement>("#f-contribution")!.value;
    const contribution = Number(contributionRaw);
    const currency = view.querySelector<HTMLSelectElement>("#f-currency")!.value;
    const schedule = view.querySelector<HTMLSelectElement>("#f-schedule")!.value as
      | "weekly"
      | "monthly";
    const startDate = view.querySelector<HTMLInputElement>("#f-start")!.value || today;
    const memberNames = [...view.querySelectorAll<HTMLInputElement>(".member-name")]
      .map((input) => input.value.trim())
      .filter((n) => n !== "");

    // Field-level checks with the same plain language as the domain rules.
    let valid = true;
    setError("e-name", "");
    setError("e-contribution", "");
    setError("e-members", "");
    if (name.trim() === "") {
      setError("e-name", "Give the circle a name.");
      valid = false;
    }
    if (contributionRaw.trim() === "" || !Number.isFinite(contribution) || contribution <= 0) {
      setError("e-contribution", "The contribution must be more than zero.");
      valid = false;
    }
    if (memberNames.length < 2) {
      setError("e-members", "A circle needs at least 2 members.");
      valid = false;
    }
    if (!valid) return; // nothing is created (Req 1.4)

    try {
      const circle = createCircle({
        name,
        contribution,
        currency,
        schedule,
        startDate,
        memberNames,
      });
      await saveCircle(circle); // persisted before success is shown (Req 1.3)
      window.location.hash = `#/circle/${encodeURIComponent(circle.id)}`;
    } catch (err) {
      setError("e-members", err instanceof Error ? err.message : "Something went wrong.");
    }
  });
}
