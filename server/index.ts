import { createServer } from "http";
import { app } from "./app.js";
import { serveStatic } from "./static.js";
import { log } from "./logger.js";

async function startServer() {
  const server = createServer(app);

  if (app.get("env") === "development") {
    // Keep development tooling outside the production server import graph.
    const developmentModule = "./vite.js";
    const { setupVite } = (await import(
      developmentModule
    )) as typeof import("./vite.js");
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({ port, host: "0.0.0.0" }, () => {
    log(`Server is listening on port ${port}...`);
  });

  process.on("SIGTERM", () => {
    log("SIGTERM signal received: closing HTTP server");
    server.close(() => log("HTTP server closed"));
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
