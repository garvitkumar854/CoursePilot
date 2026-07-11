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
    type: {
      type: String,
      enum: [
        "subject_created",
        "subject_updated",
        "subject_deleted",
        "assignment_created",
        "assignment_updated",
        "assignment_deleted",
      ],
      required: true,
    },
    subjectSlug: {
      type: String,
      default: "",
    },
    assignmentId: {
      type: String,
      default: "",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
