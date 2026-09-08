import { Router } from "express";
import {
  getBlogs,
  getBlogStats,
  getBlogFilters,
  getBlogById,
  exportBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
} from "../controllers/blogs.controller";

const router = Router();

router.get("/", getBlogs);
router.get("/stats", getBlogStats);
router.get("/filters", getBlogFilters);
router.get("/export", exportBlogs);
router.get("/:id", getBlogById);
router.post("/", createBlog);
router.put("/:id", updateBlog);
router.delete("/:id", deleteBlog);

export default router;
