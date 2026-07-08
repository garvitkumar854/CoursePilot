const Assignment = require("../models/Assignment.model");
const Subject = require("../models/Subject.model");

// Create Assignment
const createAssignment = async (req, res) => {
  try {
    const {
      subjectId,
      assignmentNumber,
      title,
      description,
      assignedDate,
    } = req.body;

    const subject = await Subject.findById(subjectId);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    const assignmentCount =
      await Assignment.countDocuments({
        subjectId,
      });

    const assignment = await Assignment.create({
      subjectId,
      assignmentNumber,
      title,
      description,
      assignedDate,
      order: assignmentCount + 1,
    });

    subject.assignmentCount += 1;
    subject.lastUpdated = new Date();

    await subject.save();

    res.status(201).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Get Assignments By Subject
const getAssignmentsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const assignments = await Assignment.find({
      subjectId,
      isActive: true,
    }).sort({
      order: 1,
    });

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Single Assignment
const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(
      req.params.id
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Update Assignment
const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      assignmentNumber,
      title,
      description,
      assignedDate,
    } = req.body;

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    assignment.assignmentNumber =
      assignmentNumber ?? assignment.assignmentNumber;

    assignment.title =
      title ?? assignment.title;

    assignment.description =
      description ?? assignment.description;

    assignment.assignedDate =
      assignedDate ?? assignment.assignedDate;

    const subject = await Subject.findById(assignment.subjectId);

    if (subject) {
      subject.lastUpdated = new Date();
      await subject.save();
    }

    await assignment.save();



    res.status(200).json({
      success: true,
      message: "Assignment updated successfully",
      data: assignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Delete Assignment
const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const subject = await Subject.findById(
      assignment.subjectId
    );

    await Assignment.findByIdAndDelete(id);

    if (subject) {
      subject.assignmentCount = Math.max(
        0,
        subject.assignmentCount - 1
      );

      subject.lastUpdated = new Date();

      await subject.save();
    }

    res.status(200).json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createAssignment,
  getAssignmentsBySubject,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
};