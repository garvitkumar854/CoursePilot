require("dotenv").config();
const mongoose = require("mongoose");

// ✅ Track connection state to prevent duplicate connections
let isConnected = false;

const connectDB = async () => {
  // ✅ Already connected — skip
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }

  // ✅ Fail immediately if no URI provided
  if (!process.env.MONGODB_URI) {
    console.error("[DB] ❌ MONGODB_URI environment variable is not set!");
    return;
  }

  try {
    // ✅ Disable buffering — fail fast in serverless
    mongoose.set("bufferCommands", false);

    // ✅ Strict query mode — catch typos in query fields
    mongoose.set("strictQuery", true);

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // ✅ Serverless optimized timeouts
      serverSelectionTimeoutMS: 5000,  // Give up finding server after 5s
      socketTimeoutMS: 10000,          // Close socket after 10s of inactivity
      connectTimeoutMS: 8000,          // Give up initial connection after 8s

      // ✅ Connection pool — keep small for serverless
      maxPoolSize: 5,                  // Max 5 connections in pool
      minPoolSize: 1,                  // Keep at least 1 connection alive
    });

    isConnected = true;
    console.log(`[DB] ✅ Connected: ${conn.connection.host}`);

  } catch (error) {
    isConnected = false;

    // ✅ Proper error logging — no more silent failures
    console.error("[DB] ❌ Connection failed:", error.message);

    // ✅ Don't crash in serverless — just warn
    // The DB error middleware in server.js will handle failed requests
  }
};

// ✅ Handle connection events for better observability
mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.warn("[DB] ⚠️ MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  isConnected = true;
  console.log("[DB] ✅ MongoDB reconnected");
});

mongoose.connection.on("error", (error) => {
  isConnected = false;
  console.error("[DB] ❌ MongoDB error:", error.message);
});

module.exports = connectDB;