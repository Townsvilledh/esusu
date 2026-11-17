import "./style.css";
import { initStore, persistent } from "./store";
import { renderCircleDetail } from "./views/detail";
import { renderCircleForm } from "./views/form";
import { renderCircleList } from "./views/list";
import { renderShareView, renderSharedCircle } from "./views/shareView";

// App entry point: shell, storage banner, offline worker, hash router.
const app = document.getElementById("app");

if (app) {
  app.innerHTML = `
    <header class="app-header">
      <a class="brand" href="#/">Esusu</a>
      <span class="tagline">circle savings, on your phone</span>
    </header>
    <div id="storage-banner"></div>
    <main id="view">
      <div class="empty">
        <p>Loading your circles…</p>
      </div>
    </main>
  `;
}

// Probe storage once at startup. If this device cannot save (Requirement
// 4.4), say so plainly and keep the session running in memory.
initStore().then(() => {
  const banner = document.getElementById("storage-banner");
  if (banner && !persistent) {
    banner.innerHTML = `
      <div class="banner warn" role="alert">
        This device can't save circles — anything you enter now will be gone
        when you close the app. Try a regular (non-private) browser window.
      </div>
    `;
  }
});

// Hash-based routing (task 4.5), so the app works from any static host:
//   #/              circle list
//   #/new           create form
//   #/circle/:id    circle detail
//   #/share/:id     share one of your circles
//   #c=<payload>    a shared circle arriving by link
async function route(): Promise<void> {
  const view = document.getElementById("view");
  if (!view) return;
  const hash = window.location.hash;

  if (hash.startsWith("#c=")) {
    await renderSharedCircle(view, window.location.href);
    return;
  }

  const path = hash.replace(/^#/, "") || "/";
  if (path === "/") {
    await renderCircleList(view);
    return;
  }
  if (path === "/new") {
    renderCircleForm(view);
    return;
  }
  const circleMatch = path.match(/^\/circle\/(.+)$/);
  if (circleMatch) {
    await renderCircleDetail(view, decodeURIComponent(circleMatch[1]));
    return;
  }
  const shareMatch = path.match(/^\/share\/(.+)$/);
  if (shareMatch) {
    await renderShareView(view, decodeURIComponent(shareMatch[1]));
    return;
  }

  view.innerHTML = `
    <h1>Page not found</h1>
    <p><a class="btn block" href="#/">Go to your circles</a></p>
  `;
}

window.addEventListener("hashchange", () => {
  void route();
});
void route();

// Cache-first service worker: after the first visit the whole app loads
// with no network at all (Requirement 4.1).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Offline support is best-effort; the app itself still runs.
    });
  });
}
