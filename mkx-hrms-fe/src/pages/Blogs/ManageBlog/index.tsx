import React, { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button, CircularProgress } from "@mui/material";
import { Article, Close, Edit } from "@mui/icons-material";

import { AppDrawer } from "shared/Drawer";
import { Input } from "shared/Input";
import { Select, type SelectOption } from "shared/Select";
import { RichTextEditor } from "shared/RichTextEditor";
import { type BlogPost, type CreateBlogInput } from "services/blogs";

/**
 * Form values contract for creating or updating a blog post
 */
export interface ManageBlogFormValues {
  title: string;
  slug: string;
  category: string;
  status: "Draft" | "Published" | "Archived";
  author_name: string;
  cover_image: string;
  excerpt: string;
  content: string;
}

/**
 * Props for ManageBlog component
 */
export interface ManageBlogProps {
  open: boolean;
  onClose: () => void;
  initialData?: BlogPost | null;
  onSubmit: (values: CreateBlogInput, id?: number) => Promise<void>;
  availableCategories?: string[];
}

const statusOptions: SelectOption[] = [
  { label: "Draft", value: "Draft" },
  { label: "Published", value: "Published" },
  { label: "Archived", value: "Archived" },
];

/**
 * Helper to slugify a title string
 *
 * @param text - Raw title string
 * @returns Formatted URL slug
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

const validationSchema = Yup.object().shape({
  title: Yup.string().required("Article title is required"),
  category: Yup.string().required("Category is required"),
  status: Yup.string().oneOf(["Draft", "Published", "Archived"]).required("Status is required"),
  content: Yup.string().required("Article content cannot be empty"),
});

/**
 * Slide-out drawer component for creating and editing blog articles with mui-tiptap
 *
 * @param props - Component configuration props
 * @returns The rendered ManageBlog drawer
 */
export function ManageBlog({
  open,
  onClose,
  initialData,
  onSubmit,
  availableCategories = [],
}: ManageBlogProps): React.ReactElement {
  const isEditing = Boolean(initialData);

  const categoryOptions: SelectOption[] = React.useMemo(() => {
    const base = [
      "Company News",
      "Engineering",
      "HR Policy",
      "Product Updates",
      "Culture & Events",
      "Leadership",
    ];
    const set = new Set([...base, ...availableCategories]);
    return Array.from(set).map((cat) => ({ label: cat, value: cat }));
  }, [availableCategories]);

  const formik = useFormik<ManageBlogFormValues>({
    initialValues: {
      title: initialData?.title || "",
      slug: initialData?.slug || "",
      category: initialData?.category || "Company News",
      status: initialData?.status || "Draft",
      author_name: initialData?.author_name || "HR Team",
      cover_image: initialData?.cover_image || "",
      excerpt: initialData?.excerpt || "",
      content: initialData?.content || "<p>Write your article here...</p>",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSubmit(
          {
            title: values.title,
            slug: values.slug || slugify(values.title),
            category: values.category,
            status: values.status,
            author_name: values.author_name,
            cover_image: values.cover_image,
            excerpt: values.excerpt,
            content: values.content,
          },
          initialData?.id,
        );
        onClose();
      } catch (err: unknown) {
        // The service hook's useCustomMutation handles error toasts.
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (!isEditing && formik.values.title && !formik.touched.slug) {
      formik.setFieldValue("slug", slugify(formik.values.title));
    }
  }, [formik.values.title, isEditing, formik.touched.slug]);

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      width={720}
      title={isEditing ? "Edit Article" : "Create New Article"}
      subtitle={
        isEditing
          ? `Update details and content for "${initialData?.title}"`
          : "Draft or publish a company announcement or knowledge-base article"
      }
      footer={
        <>
          <Button
            variant="outlined"
            size="small"
            onClick={onClose}
            startIcon={<Close className="!w-4 !h-4" />}
            className="!border-border !bg-secondary !text-muted-foreground hover:!text-foreground !text-xs !normal-case !px-3.5 !py-2 !rounded-[5px]"
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            size="small"
            disabled={formik.isSubmitting}
            onClick={() => formik.handleSubmit()}
            startIcon={
              formik.isSubmitting ? (
                <CircularProgress size={16} className="!text-white" />
              ) : isEditing ? (
                <Edit className="!w-4 !h-4" />
              ) : (
                <Article className="!w-4 !h-4" />
              )
            }
            className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !text-xs !normal-case !font-semibold !px-4 !py-2 !rounded-[5px] shadow-sm"
          >
            {formik.isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Article"}
          </Button>
        </>
      }
    >
      <form onSubmit={formik.handleSubmit} className="space-y-4 flex flex-col gap-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input<ManageBlogFormValues>
            name="title"
            label="Article Title"
            placeholder="e.g. Annual Company Retreat 2026 Announcements"
            required
            formik={formik}
          />

          <Input<ManageBlogFormValues>
            name="slug"
            label="URL Slug"
            placeholder="e.g. annual-company-retreat-2026"
            formik={formik}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 mb-2 gap-4">
          <Select<ManageBlogFormValues>
            name="category"
            label="Category"
            options={categoryOptions}
            required
            formik={formik}
          />

          <Select<ManageBlogFormValues>
            name="status"
            label="Status"
            options={statusOptions}
            required
            formik={formik}
          />

          <Input<ManageBlogFormValues>
            name="author_name"
            label="Author"
            placeholder="e.g. HR Communications"
            required
            formik={formik}
          />
        </div>

        <Input<ManageBlogFormValues>
          name="cover_image"
          label="Cover Image URL"
          placeholder="https://images.unsplash.com/... (optional)"
          formik={formik}
        />

        <Input<ManageBlogFormValues>
          name="excerpt"
          label="Short Excerpt"
          placeholder="Brief 1-2 sentence overview of the article..."
          multiline
          rows={2}
          formik={formik}
        />

        <RichTextEditor<ManageBlogFormValues>
          name="content"
          label="Article Content (Rich Text Editor)"
          placeholder="Type or format your article content here..."
          formik={formik}
          minHeight={280}
        />
      </form>
    </AppDrawer>
  );
}

export default ManageBlog;
