import { Request, Response, NextFunction } from "express";
import { prisma } from "../../libraries/prisma";
import { generateExcelBuffer } from "../services/excel.service";

/**
 * Controller to retrieve paginated blog posts with dynamic filters
 *
 * @param req - Express request with search, status, category, startDate, endDate query parameters
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const getBlogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "All";
    const category = (req.query.category as string) || "All";
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const andConditions: Array<Record<string, unknown>> = [];

    if (search.trim()) {
      andConditions.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { excerpt: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
          { category: { contains: search, mode: "insensitive" } },
          { author_name: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (status !== "All") {
      andConditions.push({ status });
    }

    if (category !== "All") {
      andConditions.push({ category });
    }

    if (startDate || endDate) {
      const dateCondition: { gte?: Date; lte?: Date } = {};
      if (startDate) {
        dateCondition.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateCondition.lte = end;
      }
      andConditions.push({ created_at: dateCondition });
    }

    const whereClause = andConditions.length > 0 ? { AND: andConditions } : {};

    const blogs = await prisma.blogPost.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
    });

    const formatted = blogs.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || "",
      cover_image: post.cover_image || "",
      category: post.category,
      tags: post.tags,
      status: post.status,
      author_name: post.author_name,
      author_id: post.author_id,
      published_at: post.published_at ? post.published_at.toISOString().split("T")[0] : null,
      created_at: post.created_at.toISOString().split("T")[0],
      updated_at: post.updated_at.toISOString().split("T")[0],
    }));

    res.sendSuccess({
      message: "Blogs fetched successfully",
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to compute blog metrics for top KPI cards
 *
 * @param _req - Express request
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const getBlogStats = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const totalPosts = await prisma.blogPost.count();
    const publishedPosts = await prisma.blogPost.count({
      where: { status: "Published" },
    });
    const draftPosts = await prisma.blogPost.count({
      where: { status: "Draft" },
    });

    const uniqueCategoriesGroup = await prisma.blogPost.groupBy({
      by: ["category"],
    });

    res.sendSuccess({
      message: "Blog stats computed successfully",
      data: {
        total_posts: totalPosts,
        published_posts: publishedPosts,
        draft_posts: draftPosts,
        categories_count: uniqueCategoriesGroup.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to retrieve dynamic filter options for blogs
 *
 * @param _req - Express request
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const getBlogFilters = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const categoriesGroup = await prisma.blogPost.groupBy({
      by: ["category"],
      where: {
        category: { not: "" },
      },
      orderBy: { category: "asc" },
    });

    const authorsGroup = await prisma.blogPost.groupBy({
      by: ["author_name"],
      where: {
        author_name: { not: "" },
      },
      orderBy: { author_name: "asc" },
    });

    res.sendSuccess({
      message: "Blog filters fetched successfully",
      data: {
        categories: categoriesGroup.map((c) => c.category),
        authors: authorsGroup.map((a) => a.author_name),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to retrieve a single blog post by numeric ID or slug
 *
 * @param req - Express request with `id` parameter
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const getBlogById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const param = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const numericId = Number(param);

    const post = !isNaN(numericId)
      ? await prisma.blogPost.findUnique({ where: { id: numericId } })
      : await prisma.blogPost.findUnique({ where: { slug: param } });

    if (!post) {
      res.sendError({
        statusCode: 404,
        message: "Blog post not found",
      });
      return;
    }

    res.sendSuccess({
      message: "Blog post retrieved successfully",
      data: post,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Helper to generate URL-friendly slugs
 *
 * @param text - Raw title string
 * @returns Formatted slug string
 */
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

/**
 * Controller to create a new blog post
 *
 * @param req - Express request with blog body payload
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const createBlog = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      title,
      slug,
      content,
      excerpt,
      cover_image,
      category,
      tags,
      status,
      author_name,
      author_id,
    } = req.body;

    if (!title || !content || !category) {
      res.sendError({
        statusCode: 400,
        message: "Title, content, and category are required",
      });
      return;
    }

    const baseSlug = slug && slug.trim() ? slugify(slug) : slugify(title);
    let finalSlug = baseSlug;
    let counter = 1;

    while (await prisma.blogPost.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const isPublished = status === "Published";

    const newPost = await prisma.blogPost.create({
      data: {
        title,
        slug: finalSlug,
        content,
        excerpt: excerpt || "",
        cover_image: cover_image || "",
        category,
        tags: Array.isArray(tags) ? tags : [],
        status: status || "Draft",
        author_name: author_name || "Admin",
        author_id: author_id ? Number(author_id) : null,
        published_at: isPublished ? new Date() : null,
      },
    });

    res.sendSuccess({
      statusCode: 201,
      message: "Blog post created successfully",
      data: newPost,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to update an existing blog post
 *
 * @param req - Express request with updated blog fields
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const updateBlog = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.sendError({
        statusCode: 400,
        message: "Invalid blog ID",
      });
      return;
    }

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      res.sendError({
        statusCode: 404,
        message: "Blog post not found",
      });
      return;
    }

    const {
      title,
      slug,
      content,
      excerpt,
      cover_image,
      category,
      tags,
      status,
      author_name,
      author_id,
    } = req.body;

    let finalSlug = existing.slug;
    if (slug && slug !== existing.slug) {
      const candidateSlug = slugify(slug);
      const conflict = await prisma.blogPost.findFirst({
        where: { slug: candidateSlug, NOT: { id } },
      });
      if (conflict) {
        res.sendError({
          statusCode: 400,
          message: "Slug is already in use by another article",
        });
        return;
      }
      finalSlug = candidateSlug;
    }

    let publishedAt = existing.published_at;
    if (status === "Published" && !existing.published_at) {
      publishedAt = new Date();
    }

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        slug: finalSlug,
        content: content !== undefined ? content : existing.content,
        excerpt: excerpt !== undefined ? excerpt : existing.excerpt,
        cover_image: cover_image !== undefined ? cover_image : existing.cover_image,
        category: category !== undefined ? category : existing.category,
        tags: Array.isArray(tags) ? tags : existing.tags,
        status: status !== undefined ? status : existing.status,
        author_name: author_name !== undefined ? author_name : existing.author_name,
        author_id:
          author_id !== undefined ? (author_id ? Number(author_id) : null) : existing.author_id,
        published_at: publishedAt,
      },
    });

    res.sendSuccess({
      message: "Blog post updated successfully",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to delete a blog post
 *
 * @param req - Express request with blog `id`
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const deleteBlog = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.sendError({
        statusCode: 400,
        message: "Invalid blog ID",
      });
      return;
    }

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      res.sendError({
        statusCode: 404,
        message: "Blog post not found",
      });
      return;
    }

    await prisma.blogPost.delete({ where: { id } });

    res.sendSuccess({
      message: "Blog post deleted successfully",
      data: { id },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to export all blogs to a styled Excel sheet
 *
 * @param _req - Express request
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const exportBlogs = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const blogs = await prisma.blogPost.findMany({
      orderBy: { created_at: "desc" },
    });

    const exportData = blogs.map((post) => ({
      "Post ID": post.id,
      Title: post.title,
      Slug: post.slug,
      Category: post.category,
      Status: post.status,
      Author: post.author_name,
      "Published Date": post.published_at ? post.published_at.toISOString().split("T")[0] : "",
      "Created Date": post.created_at.toISOString().split("T")[0],
    }));

    const buffer = await generateExcelBuffer("Company_Blogs", exportData);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", 'attachment; filename="Company_Blogs.xlsx"');

    res.send(buffer);
  } catch (err) {
    next(err);
  }
};
