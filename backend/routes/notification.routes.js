const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification.model");

// GET /api/notifications - Get recent notifications (limit 30)
router.get("/", async (req, res, next) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(30);
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/mark-all-read - Mark all notifications as read
router.put("/mark-all-read", async (req, res, next) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ success: true, message: "All notifications marked as read." });
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/:id/read - Mark a single notification as read
router.put("/:id/read", async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notifications/clear-all - Delete all notifications
router.delete("/clear-all", async (req, res, next) => {
  try {
    await Notification.deleteMany({});
    res.json({ success: true, message: "All notifications cleared." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
