const mongoose = require("mongoose");

const SUBJECT_ACCENT_COLORS = [
  "#2563eb",
  "#8b5cf6",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#14b8a6",
  "#f97316",
  "#f43f5e",
  "#06b6d4",
  "#6366f1",
];

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    accentColor: {
      type: String,
      enum: ["", ...SUBJECT_ACCENT_COLORS],
      default: "",
    },

    assignmentCount: {
      type: Number,
      default: 0,
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Subject", subjectSchema);