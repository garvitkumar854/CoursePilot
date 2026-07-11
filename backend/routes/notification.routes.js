const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification.model");

// GET /api/notifications - Get latest 20 notifications
router.get("/", async (req, res, next) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(20);
    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
