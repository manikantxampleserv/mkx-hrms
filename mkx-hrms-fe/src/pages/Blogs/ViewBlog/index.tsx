import { CalendarToday } from "@mui/icons-material";
import { Avatar, Box, Button, Chip } from "@mui/material";
import React from "react";
import { CustomDialog } from "shared/CustomDialog";
import { type BlogPost } from "services/blogs";

/**
 * Props for ViewBlog modal dialog
 */
export interface ViewBlogProps {
  open: boolean;
  onClose: () => void;
  blog: BlogPost | null;
}

/**
 * Reader view dialog rendering styled HTML content and article metadata
 *
 * @param props - Component configuration props
 * @returns The rendered ViewBlog dialog
 */
export function ViewBlog({ open, onClose, blog }: ViewBlogProps): React.ReactElement {
  if (!blog) return <></>;

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2">
          <Chip
            label={blog.category}
            size="small"
            className="!bg-primary/10 !text-primary !font-semibold !text-xs"
          />
          <Chip
            label={blog.status}
            size="small"
            color={
              blog.status === "Published"
                ? "success"
                : blog.status === "Draft"
                  ? "warning"
                  : "default"
            }
            variant="outlined"
            className="!text-xs"
          />
        </div>
      }
      contentClassName="!p-6 !space-y-5 !overflow-y-auto"
      actions={
        <Button
          onClick={onClose}
          size="small"
          variant="outlined"
          className="!border-border !bg-secondary !text-muted-foreground hover:!text-foreground !text-xs !normal-case !px-4 !py-1.5 !rounded-[5px]"
        >
          Close Reader
        </Button>
      }
    >
      {blog.cover_image && (
        <Box className="w-full h-56 rounded-md overflow-hidden bg-secondary">
          <img src={blog.cover_image} alt={blog.title} className="w-full h-full object-cover" />
        </Box>
      )}

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {blog.title}
        </h1>

        {blog.excerpt && (
          <p className="text-sm sm:text-base text-muted-foreground italic font-normal">
            {blog.excerpt}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <Avatar className="!w-5 !h-5 !text-[10px] !bg-primary/20 !text-primary">
              {blog.author_name.charAt(0).toUpperCase()}
            </Avatar>
            <span className="font-medium text-foreground">{blog.author_name}</span>
          </div>

          <div className="flex items-center gap-1">
            <CalendarToday className="!w-3.5 !h-3.5" />
            <span>{blog.published_at || blog.created_at}</span>
          </div>
        </div>
      </div>

      <Box
        className="prose dark:prose-invert max-w-none text-sm leading-relaxed pt-3 border-t border-border/60
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-3
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-2
          [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-2
          [&_p]:my-2
          [&_ul]:list-disc [&_ul]:pl-5
          [&_ol]:list-decimal [&_ol]:pl-5
          [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-3 [&_blockquote]:italic
          [&_img]:max-w-full [&_img]:rounded-md [&_img]:my-3"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />
    </CustomDialog>
  );
}

export default ViewBlog;
