require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    mongoose.set('bufferCommands', false); // CRITICAL: fail fast, don't hang
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/mock");

    console.log("MongoDB Connected ✅");
  } catch (error) {
    console.warn("MongoDB Connection Failed ❌");
    console.warn("Continuing in offline/mock mode.");
  }
};

module.exports = connectDB;