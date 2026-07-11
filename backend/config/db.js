require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    mongoose.set('bufferCommands', false); // CRITICAL: fail fast, don't hang
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/mock");

    console.log("Database connected successfully ✅");
  } catch (error) {
    // Keep failure warning silent to prevent clutter, as requested to show only two main logs
  }
};

module.exports = connectDB;