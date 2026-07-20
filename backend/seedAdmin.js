require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User.model");

const admins = [
  {
    name: "Garvit Kumar",
    email: "garvit@coursepilot.local",
    username: "garvit",
    password: "garvit123",
  },
  // Add more admins here if needed.
  // {
  //   name: "Admin Two",
  //   email: "admin2@coursepilot.local",
  //   username: "admin_two",
  //   password: "YourStrongPassword456",
  // },
];

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for seeding...");

    // ✅ Clean up any null email duplicates that block seeding
    try {
      await User.deleteMany({ email: null });
      console.log("Cleaned up orphaned users with null email.");
    } catch (err) {
      // Silently ignore if no null emails exist
    }

    for (const admin of admins) {
      const username = admin.username.toLowerCase().trim();
      const email = admin.email ? admin.email.toLowerCase().trim() : null;

      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        console.error(`Skipping invalid username: ${username}. Must be 3-20 chars alphanumeric/underscore.`);
        continue;
      }

      const existing = await User.findOne({ $or: [{ username }, { email }] });
      if (existing) {
        console.log(`Admin already exists: ${username}${email ? ` (${email})` : ""}`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(admin.password, 10);
      await User.create({
        name: admin.name,
        email,
        username,
        password: hashedPassword,
        role: "admin",
      });
      console.log(`Admin created successfully: ${username}${email ? ` (${email})` : ""}`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
}

createAdmin();
