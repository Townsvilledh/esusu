import "./style.css";
import { initStore, persistent } from "./store";

// App entry point. The router and views are wired in task group 4; this
// bootstrap owns the shell, the storage banner, and the offline worker.
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

// Cache-first service worker: after the first visit the whole app loads
// with no network at all (Requirement 4.1).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Offline support is best-effort; the app itself still runs.
    });
  });
}
