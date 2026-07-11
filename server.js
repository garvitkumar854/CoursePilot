require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./backend/config/db");

const subjectRoutes = require("./backend/routes/subject.routes");
const assignmentRoutes = require("./backend/routes/assignment.routes");
const authRoutes = require("./backend/routes/auth.routes");
const notificationRoutes = require("./backend/routes/notification.routes");

async function startServer() {
  const app = express();

  // ✅ Connect Database first
  await connectDB();

  // ✅ CORS — specific origin
  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // ✅ Body parser with size limit
  app.use(express.json({ limit: "1mb" }));

  // ✅ API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/subjects", subjectRoutes);
  app.use("/api/assignments", assignmentRoutes);
  app.use("/api/notifications", notificationRoutes);

  // ✅ Health check — shows DB state
  app.get("/api/health", (req, res) => {
    const mongoose = require("mongoose");
    const dbStates = ["disconnected", "connected", "connecting", "disconnecting"];

    res.json({
      success: true,
      message: "CoursePilot API Running 🚀",
      env: process.env.NODE_ENV || "development",
      db: dbStates[mongoose.connection.readyState] || "unknown",
      timestamp: new Date().toISOString(),
    });
  });

  // ✅ DB offline fallback — improved path detection
  app.use((err, req, res, next) => {
    const isDBError =
      err.name === "MongooseError" ||
      err.name === "MongoNotConnectedError" ||
      err.name === "MongoNetworkError" ||
      (err.message && (
        err.message.includes("buffering timed out") ||
        err.message.includes("not connected") ||
        err.message.includes("Client must be connected")
      ));

    if (isDBError) {
      console.warn("[SERVER] Database offline — returning fallback response");

      if (req.method === "GET") {
        const isArrayEndpoint =
          req.path.endsWith("/subjects") ||
          req.path.endsWith("/assignments") ||
          req.path.endsWith("/notifications");

        return res.json(isArrayEndpoint ? [] : {});
      }

      return res.status(503).json({
        success: false,
        error: "Service temporarily unavailable. Please try again shortly.",
      });
    }

    next(err);
  });

  // ✅ Global error handler
  app.use((err, req, res, next) => {
    console.error("[SERVER] Unhandled error:", err.message || err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  });

  // ✅ Vite or Static Assets serving
  if (process.env.NODE_ENV !== "production") {
    // Dev mode — Vite middleware
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.join(__dirname, "frontend"),
    });
    app.use(vite.middlewares);

  } else {
    // Production — serve built frontend
    const distPath = path.join(__dirname, "frontend", "dist");

    app.use(express.static(distPath, {
      // ✅ Cache static assets for 1 year
      maxAge: "1y",
      // ✅ But don't cache index.html
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        }
      },
    }));

    // ✅ SPA fallback — only for non-API routes
    app.get(/^(?!\/api).*$/, (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // ✅ PORT from environment variable
  const PORT = process.env.PORT || 3000;

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] 🚀 Running on port ${PORT}`);
    console.log(`[SERVER] 🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  });

  // ✅ Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n[SERVER] ${signal} received — shutting down gracefully...`);
    server.close(async () => {
      const mongoose = require("mongoose");
      await mongoose.connection.close();
      console.log("[SERVER] ✅ Server and DB closed cleanly");
      process.exit(0);
    });

    // Force exit after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      console.error("[SERVER] ❌ Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch((err) => {
  console.error("[SERVER] ❌ Failed to start:", err.message || err);
  process.exit(1);
});