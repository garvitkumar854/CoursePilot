const express = require("express");

const {
  createAssignment,
  getAssignmentsBySubject,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
} = require("../controllers/Assignment.controller");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// Create Assignment
router.post("/create", adminMiddleware, createAssignment);

// Get All Assignments of a Subject
router.get("/subject/:subjectId", getAssignmentsBySubject);

// Get Single Assignment
router.get("/:id", getAssignmentById);

// Update Assignment
router.put("/:id", adminMiddleware, updateAssignment);

// Delete Assignment
router.delete("/:id", adminMiddleware, deleteAssignment);

module.exports = router;