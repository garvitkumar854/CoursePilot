const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User.model");

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const normalizedUsername = String(username || "").toLowerCase().trim();
    console.log(`[AUTH] Admin login attempt for username: "${normalizedUsername}"`);

    const user = await User.findOne({
      username: normalizedUsername,
      role: "admin",
    });

    if (!user) {
      console.warn(`[AUTH] Login failed: No admin user found for username: "${normalizedUsername}"`);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const passwordMatches = await bcrypt.compare(password || "", user.password);

    if (!passwordMatches) {
      console.warn(`[AUTH] Login failed: Incorrect password for admin: "${normalizedUsername}"`);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    console.log(`[AUTH] Login successful: Signing JWT token for "${normalizedUsername}"`);

    const token = jwt.sign(
      {
        role: "admin",
        username: user.username,
        name: user.name,
      },
      process.env.JWT_SECRET || "default_secret",
      {
        expiresIn: "7d",
      }
    );

    res.json({
      success: true,
      token,
      user: {
        username: user.username,
        name: user.name,
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
};
