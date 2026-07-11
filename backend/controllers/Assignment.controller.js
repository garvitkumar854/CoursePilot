const Assignment = require("../models/Assignment.model");
const Subject = require("../models/Subject.model");
const Notification = require("../models/Notification.model");

const createAssignment = async (req, res, next) => {
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

    const assignmentCount = await Assignment.countDocuments({
      subjectId,
    });

    const assignment = await Assignment.create({
      subjectId,
      assignmentNumber,
      title,
      description,
      assignedDate,
      order: assignmentCount + 1,
      updatedBy: req.user ? req.user.username : "",
    });
    console.log(`[DATABASE] MongoDB: Assignment created successfully. ID: ${assignment._id}, Order: ${assignment.order}`);

    subject.assignmentCount += 1;
    subject.lastUpdated = new Date();
    await subject.save();
    console.log(`[DATABASE] MongoDB: Updated assignmentCount for subject "${subject.name}" to ${subject.assignmentCount}`);

    try {
      await Notification.create({
        title: "Assignment Added",
        body: `Assignment #${assignment.assignmentNumber}: "${assignment.title}" posted in "${subject.name}".`,
        type: "assignment_created",
        subjectSlug: subject.slug,
        assignmentId: assignment._id.toString(),
      });
    } catch (err) {
      console.error("Failed to create assignment notification:", err);
    }

    res.status(201).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error("[DATABASE] MongoDB Error in createAssignment:", error);
    next(error);
  }
};

const getAssignmentsBySubject = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    console.log(`[DATABASE] MongoDB: Fetching all active assignments for subject ID: "${subjectId}"...`);

    const assignments = await Assignment.find({
      subjectId,
      isActive: true,
    }).sort({
      order: 1,
    }).lean();
    console.log(`[DATABASE] MongoDB: Found ${assignments.length} active assignments.`);

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments,
    });
  } catch (error) {
    console.error("[DATABASE] MongoDB Error in getAssignmentsBySubject:", error);
    next(error);
  }
};

const getAssignmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`[DATABASE] MongoDB: Fetching assignment by ID: "${id}"...`);

    const assignment = await Assignment.findById(id).lean();

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
    next(error);
  }
};

const updateAssignment = async (req, res, next) => {
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

    assignment.assignmentNumber = assignmentNumber ?? assignment.assignmentNumber;
    assignment.title = title ?? assignment.title;
    assignment.description = description ?? assignment.description;
    assignment.assignedDate = assignedDate ?? assignment.assignedDate;
    assignment.order = order ?? assignment.order;
    assignment.updatedBy = req.user ? req.user.username : assignment.updatedBy;

    const subject = await Subject.findById(assignment.subjectId);
    if (subject) {
      subject.lastUpdated = new Date();
      await subject.save();
      console.log(`[DATABASE] MongoDB: Updated lastUpdated field for subject "${subject.name}".`);
    }

    await assignment.save();
    console.log(`[DATABASE] MongoDB: Assignment ID "${assignment._id}" updated successfully. Next order: ${assignment.order}`);

    try {
      await Notification.create({
        title: "Assignment Updated",
        body: `Assignment #${assignment.assignmentNumber}: "${assignment.title}" in "${subject ? subject.name : "syllabus"}" was updated.`,
        type: "assignment_updated",
        subjectSlug: subject ? subject.slug : "",
        assignmentId: assignment._id.toString(),
      });
    } catch (err) {
      console.error("Failed to create assignment update notification:", err);
    }

    res.status(200).json({
      success: true,
      message: "Assignment updated successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("[DATABASE] MongoDB Error in updateAssignment:", error);
    next(error);
  }
};

const deleteAssignment = async (req, res, next) => {
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

    const subject = await Subject.findById(assignment.subjectId);

    await Assignment.findByIdAndDelete(id);
    console.log(`[DATABASE] MongoDB: Assignment ID "${id}" deleted successfully.`);

    if (subject) {
      subject.assignmentCount = Math.max(0, subject.assignmentCount - 1);
      subject.lastUpdated = new Date();
      await subject.save();
      console.log(`[DATABASE] MongoDB: Updated assignmentCount for subject "${subject.name}" to ${subject.assignmentCount}`);
    }

    try {
      await Notification.create({
        title: "Assignment Removed",
        body: `Assignment "${assignment.title}" was removed from "${subject ? subject.name : "syllabus"}".`,
        type: "assignment_deleted",
      });
    } catch (err) {
      console.error("Failed to create assignment deletion notification:", err);
    }

    res.status(200).json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    console.error("[DATABASE] MongoDB Error in deleteAssignment:", error);
    next(error);
  }
};

const getAllAssignments = async (req, res, next) => {
  try {
    console.log("[DATABASE] MongoDB: Querying all active assignments populated with subject...");
    const assignments = await Assignment.find({ isActive: true })
      .populate("subjectId", "name slug")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error("[DATABASE] MongoDB Error in getAllAssignments:", error);
    next(error);
  }
};

module.exports = {
  createAssignment,
  getAssignmentsBySubject,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getAllAssignments,
};
