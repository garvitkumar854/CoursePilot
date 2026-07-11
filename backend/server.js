require("dotenv").config();

const express = require("express");
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");

const connectDB = require("./config/db");

const app = express();

const subjectRoutes = require("./routes/subject.routes");
const assignmentRoutes = require("./routes/assignment.routes");
const authRoutes = require("./routes/auth.routes");
const notificationRoutes = require("./routes/notification.routes");

// Connect Database
connectDB();

// Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
);
app.use(helmet());
app.use(compression());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/notifications", notificationRoutes);

// Test Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CoursePilot API Running 🚀",
  });
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});