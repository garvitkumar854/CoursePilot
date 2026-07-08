const Subject = require("../models/Subject.model");
const Assignment = require("../models/Assignment.model");

const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({
      createdAt: -1,
    });

    res.status(200).json(subjects);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getSubjectBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const subject = await Subject.findOne({ slug });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    const assignments = await Assignment.find({
      subjectId: subject._id,
      isActive: true,
    }).sort({
      order: 1,
    });

    res.status(200).json({
      success: true,
      subject,
      assignments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createSubject = async (req, res) => {
  try {
    const { name } = req.body;

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-");

    const existing = await Subject.findOne({ slug });

    if (existing) {
      return res.status(400).json({
        message: "Subject already exists",
      });
    }

    const subject = await Subject.create({
      name,
      slug,
    });

    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const subject = await Subject.findById(id);

    if (!subject) {
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
      return res.status(400).json({
        success: false,
        message: "Subject already exists",
      });
    }

    subject.name = nextName;
    subject.slug = nextSlug;
    subject.lastUpdated = new Date();

    await subject.save();

    res.status(200).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findById(id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    await Assignment.deleteMany({ subjectId: subject._id });
    await Subject.findByIdAndDelete(subject._id);

    res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getSubjects,
  createSubject,
  getSubjectBySlug,
  updateSubject,
  deleteSubject,
};