const Subject = require("../models/Subject.model");
const Assignment = require("../models/Assignment.model");

const getSubjects = async (req, res, next) => {
  try {
    console.log("[DATABASE] MongoDB: Querying all subjects sorted by createdAt descending...");
    const subjects = await Subject.find().sort({
      createdAt: -1,
    });
    console.log(`[DATABASE] MongoDB: Found ${subjects.length} subjects.`);

    res.status(200).json(subjects);
  } catch (error) {
    console.error("[DATABASE] MongoDB Error in getSubjects:", error);
    next(error);
  }
};

const getSubjectBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    console.log(`[DATABASE] MongoDB: Querying subject by slug: "${slug}"...`);

    const subject = await Subject.findOne({ slug });

    if (!subject) {
      console.warn(`[DATABASE] MongoDB: Subject with slug "${slug}" not found.`);
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    console.log(`[DATABASE] MongoDB: Found subject "${subject.name}" (${subject._id}). Querying its active assignments...`);
    const assignments = await Assignment.find({
      subjectId: subject._id,
      isActive: true,
    }).sort({
      order: 1,
    });
    console.log(`[DATABASE] MongoDB: Found ${assignments.length} active assignments for subject "${subject.name}".`);

    res.status(200).json({
      success: true,
      subject,
      assignments,
    });
  } catch (error) {
    console.error("[DATABASE] MongoDB Error in getSubjectBySlug:", error);
    next(error);
  }
};

const createSubject = async (req, res, next) => {
  try {
    const { name } = req.body;
    console.log(`[DATABASE] MongoDB: Creating a new subject with name: "${name}"...`);

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-");

    const existing = await Subject.findOne({ slug });

    if (existing) {
      console.warn(`[DATABASE] MongoDB: Rejecting creation, subject with slug "${slug}" already exists.`);
      return res.status(400).json({
        message: "Subject already exists",
      });
    }

    const subject = await Subject.create({
      name,
      slug,
    });
    console.log(`[DATABASE] MongoDB: Subject created successfully. ID: ${subject._id}, Slug: ${subject.slug}`);

    res.status(201).json(subject);
  } catch (error) {
    console.error("[DATABASE] MongoDB Error in createSubject:", error);
    next(error);
  }
};

const updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    console.log(`[DATABASE] MongoDB: Updating subject ID: "${id}" to new name: "${name}"...`);

    const subject = await Subject.findById(id);

    if (!subject) {
      console.warn(`[DATABASE] MongoDB: Subject with ID "${id}" not found.`);
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    const nextName = String(name || "").trim();

    if (!nextName) {
      return res.status(400).json({
        success: false,
        message: "Subject name is required",
      });
    }

    const nextSlug = nextName.toLowerCase().replace(/\s+/g, "-");

    const duplicate = await Subject.findOne({
      slug: nextSlug,
      _id: { $ne: subject._id },
    });

    if (duplicate) {
      console.warn(`[DATABASE] MongoDB: Rejecting update, subject with slug "${nextSlug}" already exists for another ID.`);
      return res.status(400).json({
        success: false,
        message: "Subject already exists",
      });
    }

    subject.name = nextName;
    subject.slug = nextSlug;
    subject.lastUpdated = new Date();

    await subject.save();
    console.log(`[DATABASE] MongoDB: Subject updated successfully. ID: ${subject._id}, Slug: ${subject.slug}`);

    res.status(200).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    console.error("[DATABASE] MongoDB Error in updateSubject:", error);
    next(error);
  }
};

const deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`[DATABASE] MongoDB: Requested deletion of subject ID: "${id}"...`);

    const subject = await Subject.findById(id);

    if (!subject) {
      console.warn(`[DATABASE] MongoDB: Subject ID "${id}" not found for deletion.`);
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    console.log(`[DATABASE] MongoDB: Deleting all assignments associated with subject ID: "${subject._id}"...`);
    const deleteAssignmentsRes = await Assignment.deleteMany({ subjectId: subject._id });
    console.log(`[DATABASE] MongoDB: Deleted ${deleteAssignmentsRes.deletedCount} assignments.`);

    await Subject.findByIdAndDelete(subject._id);
    console.log(`[DATABASE] MongoDB: Subject ID "${subject._id}" deleted successfully.`);

    res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    console.error("[DATABASE] MongoDB Error in deleteSubject:", error);
    next(error);
  }
};

module.exports = {
  getSubjects,
  createSubject,
  getSubjectBySlug,
  updateSubject,
  deleteSubject,
};
