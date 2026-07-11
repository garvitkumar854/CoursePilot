const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    subjectSlug: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["create_subject", "update_subject", "delete_subject", "create_assignment", "update_assignment", "delete_assignment"],
      default: "create_assignment",
    }
  },
  {
    timestamps: true,
  }
);

// High performance index to fetch latest notifications quickly
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
