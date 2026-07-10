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
    console.log(`[DATABASE] MongoDB: Creating assignment for subjectId: "${subjectId}", title: "${title}"...`);

    const subject = await Subject.findById(subjectId);

    if (!subject) {
      console.warn(`[DATABASE] MongoDB: Subject not found with ID "${subjectId}" when creating assignment.`);
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
    console.log(`[DATABASE] MongoDB: Assignment created successfully. ID: ${assignment._id}, Order: ${assignment.order}`);

    subject.assignmentCount += 1;
    subject.lastUpdated = new Date();

    await subject.save();
    console.log(`[DATABASE] MongoDB: Updated assignmentCount for subject "${subject.name}" to ${subject.assignmentCount}`);

    res.status(201).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error("[DATABASE] MongoDB Error in createAssignment:", error);
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
    console.log(`[DATABASE] MongoDB: Fetching all active assignments for subject ID: "${subjectId}"...`);

    const assignments = await Assignment.find({
      subjectId,
      isActive: true,
    }).sort({
      order: 1,
    });
    console.log(`[DATABASE] MongoDB: Found ${assignments.length} active assignments.`);

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments,
    });
  } catch (error) {
    console.error("[DATABASE] MongoDB Error in getAssignmentsBySubject:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Single Assignment
const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[DATABASE] MongoDB: Fetching assignment by ID: "${id}"...`);

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      console.warn(`[DATABASE] MongoDB: Assignment ID "${id}" not found.`);
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    console.log(`[DATABASE] MongoDB: Found assignment "${assignment.title}".`);
    res.status(200).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error("[DATABASE] MongoDB Error in getAssignmentById:", error);
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
      order,
    } = req.body;
    console.log(`[DATABASE] MongoDB: Request to update assignment ID: "${id}". Update fields:`, req.body);

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      console.warn(`[DATABASE] MongoDB: Assignment ID "${id}" not found for updating.`);
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

    assignment.order =
      order ?? assignment.order;

    const subject = await Subject.findById(assignment.subjectId);

    if (subject) {
      subject.lastUpdated = new Date();
      await subject.save();
      console.log(`[DATABASE] MongoDB: Updated lastUpdated field for subject "${subject.name}".`);
    }

    await assignment.save();
    console.log(`[DATABASE] MongoDB: Assignment ID "${assignment._id}" updated successfully. Next order: ${assignment.order}`);

    res.status(200).json({
      success: true,
      message: "Assignment updated successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("[DATABASE] MongoDB Error in updateAssignment:", error);
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
    console.log(`[DATABASE] MongoDB: Request to delete assignment ID: "${id}"...`);

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      console.warn(`[DATABASE] MongoDB: Assignment ID "${id}" not found for deletion.`);
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const subject = await Subject.findById(
      assignment.subjectId
    );

    await Assignment.findByIdAndDelete(id);
    console.log(`[DATABASE] MongoDB: Assignment ID "${id}" deleted successfully.`);

    if (subject) {
      subject.assignmentCount = Math.max(
        0,
        subject.assignmentCount - 1
      );

      subject.lastUpdated = new Date();

      await subject.save();
      console.log(`[DATABASE] MongoDB: Updated assignmentCount for subject "${subject.name}" to ${subject.assignmentCount}`);
    }

    res.status(200).json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    console.error("[DATABASE] MongoDB Error in deleteAssignment:", error);
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