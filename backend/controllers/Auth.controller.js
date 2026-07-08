const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../models/User.model");

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({
    email: String(email || "").toLowerCase().trim(),
    role: "admin",
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  const passwordMatches = await bcrypt.compare(password || "", user.password);

  if (!passwordMatches) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

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