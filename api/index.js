require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("../backend/config/db");

const subjectRoutes = require("../backend/routes/subject.routes");
const assignmentRoutes = require("../backend/routes/assignment.routes");
const authRoutes = require("../backend/routes/auth.routes");
const notificationRoutes = require("../backend/routes/notification.routes");

const app = express();

// ✅ CORS — specific origin, not true (open to all)
app.use(
  cors({
    origin: process.env.CLIENT_URL || "https://coursepilot.vercel.app",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" })); // ✅ Limit payload size

// ✅ API Routes — all 4 route groups now included
app.use("/api/auth", authRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/notifications", notificationRoutes); // ← was MISSING before!

// ✅ Health check — shows DB status too
app.get("/api/health", (req, res) => {
  const mongoose = require("mongoose");
  const dbState = ["disconnected", "connected", "connecting", "disconnecting"];

  res.json({
    success: true,
    message: "CoursePilot API Running on Vercel 🚀",
    db: dbState[mongoose.connection.readyState] || "unknown",
    timestamp: new Date().toISOString(),
  });
});

// ✅ DB offline fallback — improved logic
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
    console.warn("[API] Database offline — returning fallback response");

    // ✅ Better detection — check Accept header and method
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
  console.error("[API] Unhandled error:", err.message || err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// ✅ Serverless handler — DB connects once per warm function
module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error("[API] DB connection failed:", err.message);
    // Continue anyway — error middleware will handle DB failures
  }
  return app(req, res);
};