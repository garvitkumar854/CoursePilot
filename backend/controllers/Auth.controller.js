const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../models/User.model");

const login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || "").toLowerCase().trim();
  console.log(`[AUTH] Admin login attempt for email: "${normalizedEmail}"`);

  const user = await User.findOne({
    email: normalizedEmail,
    role: "admin",
  });

  if (!user) {
    console.warn(`[AUTH] Login failed: No admin user found for email: "${normalizedEmail}"`);
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  const passwordMatches = await bcrypt.compare(password || "", user.password);

  if (!passwordMatches) {
    console.warn(`[AUTH] Login failed: Incorrect password for admin: "${normalizedEmail}"`);
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  console.log(`[AUTH] Login successful: Signing JWT token for "${normalizedEmail}"`);
  const token = jwt.sign(
    {
      role: "admin",
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  res.json({
    success: true,
    token,
  });
};

module.exports = {
  login,
};