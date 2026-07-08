import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for offline IDE shell — production only, and never
// inside Lovable preview/iframe (would serve stale HTML). Also unregister in
// preview to clean up any prior registration.
if ("serviceWorker" in navigator) {
  const host = window.location.hostname;
  const inPreview =
    window.self !== window.top ||
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host.endsWith(".lovableproject.com") ||
    host.endsWith(".lovableproject-dev.com") ||
    host.endsWith(".beta.lovable.dev") ||
    new URL(window.location.href).searchParams.get("sw") === "off";

  if (inPreview || !import.meta.env.PROD) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => {
        if (r.active?.scriptURL.endsWith("/sw.js")) r.unregister();
      });
    }).catch(() => {});
  } else {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }
}
