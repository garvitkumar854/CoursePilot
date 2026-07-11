const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    assignmentNumber: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    assignedDate: {
      type: Date,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: String,
      default: "",
    }
  },
  {
    timestamps: true,
  }
);

// High-performance database indexing for rapid queries and sorting
assignmentSchema.index({ subjectId: 1, isActive: 1, order: 1 });
assignmentSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model(
  "Assignment",
  assignmentSchema
);
