const express = require("express");

const {
  createAssignment,
  importAssignments,
  getAssignmentsBySubject,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getAllAssignments,
} = require("../controllers/Assignment.controller");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// Get All Active Assignments across all subjects
router.get("/", getAllAssignments);

// Create Assignment
router.post("/create", adminMiddleware, createAssignment);

// Import a validated text-file batch
router.post("/import", adminMiddleware, importAssignments);

// Get All Assignments of a Subject
router.get("/subject/:subjectId", getAssignmentsBySubject);

// Get Single Assignment
router.get("/:id", getAssignmentById);

// Update Assignment
router.put("/:id", adminMiddleware, updateAssignment);

// Delete Assignment
router.delete("/:id", adminMiddleware, deleteAssignment);

module.exports = router;