const express = require("express");
const cors = require("cors");
const connectDB = require("../backend/config/db");

const subjectRoutes = require("../backend/routes/subject.routes");
const assignmentRoutes = require("../backend/routes/assignment.routes");
const authRoutes = require("../backend/routes/auth.routes");

const app = express();

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

// Health Route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "CoursePilot API Running on Vercel 🚀",
  });
});

// Export a serverless function that connects to DB first
module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
