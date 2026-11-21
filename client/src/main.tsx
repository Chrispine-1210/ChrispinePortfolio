import { createRoot } from "react-dom/client";
import { inject } from "@vercel/analytics";
import { filterPublicPageview } from "./lib/web-analytics";
import App from "./App";
import "./index.css";
import "./styles/universe.css";

if (import.meta.env.PROD) {
  inject({
    mode: "production",
    beforeSend: (event) => filterPublicPageview(event, window.location.origin),
  });
}

createRoot(document.getElementById("root")!).render(<App />);
