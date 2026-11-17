import "./style.css";

// App entry point. The router and views live in main's later task groups;
// this shell proves the scaffold: layout, theme, and the offline worker.
const app = document.getElementById("app");

if (app) {
  app.innerHTML = `
    <header class="app-header">
      <a class="brand" href="#/">Esusu</a>
      <span class="tagline">circle savings, on your phone</span>
    </header>
    <main id="view">
      <div class="empty">
        <p>Loading your circles…</p>
      </div>
    </main>
  `;
}

// Cache-first service worker: after the first visit the whole app loads
// with no network at all (Requirement 4.1).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Offline support is best-effort; the app itself still runs.
    });
  });
}
