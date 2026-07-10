require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./backend/config/db");

const subjectRoutes = require("./backend/routes/subject.routes");
const assignmentRoutes = require("./backend/routes/assignment.routes");
const authRoutes = require("./backend/routes/auth.routes");

async function startServer() {
  const app = express();

  // Connect Database
  await connectDB();

  // Middlewares
  app.use(
    cors({
      origin: process.env.CLIENT_URL || true,
      credentials: true,
    })
  );
  app.use(express.json());

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/subjects", subjectRoutes);
  app.use("/api/assignments", assignmentRoutes);

  // Test Route
  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      message: "CoursePilot API Running 🚀",
    });
  });

  // Database offline error fallback middleware
  app.use((err, req, res, next) => {
    if (
      err.name === 'MongooseError' || 
      err.name === 'MongoNetworkError' || 
      err.message.includes('buffering timed out') || 
      err.message.includes('not connected')
    ) {
      console.warn('[AI Studio] Database offline — returning mock empty response');
      if (req.method === 'GET') {
        return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
      }
      return res.status(503).json({ error: 'Service temporarily unavailable (database offline)' });
    }
    next(err);
  });

  // Vite or Static Assets serving
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in development mode with Vite middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.join(__dirname, "frontend"),
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in production mode...");
    const distPath = path.join(__dirname, "frontend", "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
