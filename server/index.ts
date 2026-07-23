import { createServer } from "http";
import { app } from "./app.js";
import { setupVite, serveStatic, log } from "./vite.js";

async function startServer() {
  const server = createServer(app);

  if (app.get("env") === "development") {
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
