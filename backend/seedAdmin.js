require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User.model");

const admins = [
    {
        name: "Garvit Kumar",
        email: "garvitkajot854@gmail.com",
        password: "garvit123",
    },
    // Add more admins here if needed.
    // {
    //   name: "Admin Two",
    //   email: "admin2@coursepilot.com",
    //   password: "YourStrongPassword456",
    // },
];

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        for (const admin of admins) {
            const email = admin.email.toLowerCase().trim();

            const existing = await User.findOne({ email });

            if (existing) {
                console.log(`Admin already exists: ${email}`);
                continue;
            }

            const hashedPassword = await bcrypt.hash(admin.password, 10);

            await User.create({
                name: admin.name,
                email,
                password: hashedPassword,
                role: "admin",
            });

            console.log(`Admin created successfully: ${email}`);
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

createAdmin();