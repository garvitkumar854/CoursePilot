const express = require("express");

const {
  getSubjects,
  createSubject,
  getSubjectBySlug,
  updateSubject,
  deleteSubject,
} = require("../controllers/Subject.controller");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", getSubjects);

router.get("/:slug", getSubjectBySlug);

router.post("/create", adminMiddleware, createSubject);

router.put("/:id", adminMiddleware, updateSubject);

router.delete("/:id", adminMiddleware, deleteSubject);


module.exports = router;