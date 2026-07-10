require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User.model");

const admins = [
  {
    name: "Garvit Kumar",
    username: "garvit854",
    password: "garvit123",
  },
  // Add more admins here if needed.
  // {
  //   name: "Admin Two",
  //   username: "admin_two",
  //   password: "YourStrongPassword456",
  // },
];

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for seeding...");

    for (const admin of admins) {
      const username = admin.username.toLowerCase().trim();
      
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        console.error(`Skipping invalid username: ${username}. Must be 3-20 chars alphanumeric/underscore.`);
        continue;
      }

      const existing = await User.findOne({ username });
      if (existing) {
        console.log(`Admin already exists: ${username}`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(admin.password, 10);
      await User.create({
        name: admin.name,
        username,
        password: hashedPassword,
        role: "admin",
      });
      console.log(`Admin created successfully: ${username}`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
}

createAdmin();
