import { useCustomQuery } from "hooks/useCustomQuery";
import { useCustomMutation } from "hooks/useCustomMutation";
import { type ApiResponse } from "../api.types";

/**
 * Interface representing a blog post record
 */
export interface BlogPost {
  /** Numeric database identifier */
  id: number;
  /** Article title */
  title: string;
  /** Unique URL-friendly slug */
  slug: string;
  /** HTML content body from rich text editor */
  content: string;
  /** Short summary excerpt */
  excerpt: string;
  /** Thumbnail or banner image URL */
  cover_image: string;
  /** Blog category name */
  category: string;
  /** List of topical tags */
  tags: string[];
  /** Publication lifecycle status */
  status: "Draft" | "Published" | "Archived";
  /** Author name */
  author_name: string;
  /** Author user ID if linked */
  author_id?: number | null;
  /** Formatted publication date */
  published_at?: string | null;
  /** Formatted creation date */
  created_at: string;
  /** Formatted last updated date */
  updated_at: string;
}

/**
 * KPI stats aggregate for top summary cards
 */
export interface BlogStats {
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  categories_count: number;
}

/**
 * Filter payload contract for dynamic blog filters
 */
export interface BlogFilterOptions {
  categories: string[];
  authors: string[];
}

/**
 * Payload for creating a blog post
 */
export interface CreateBlogInput {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  category: string;
  tags?: string[];
  status?: "Draft" | "Published" | "Archived";
  author_name?: string;
  author_id?: number | null;
}

/**
 * Payload for updating an existing blog post
 */
export interface UpdateBlogInput extends Partial<CreateBlogInput> {
  id: number;
}

/**
 * Hook to retrieve blogs with query filters
 *
 * @param params - Optional query filter parameters
 * @returns React Query query result
 */
export const useGetBlogs = (params?: {
  search?: string;
  status?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append("search", params.search);
  if (params?.status && params.status !== "All") queryParams.append("status", params.status);
  if (params?.category && params.category !== "All") queryParams.append("category", params.category);
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/v1/blogs?${queryString}` : "/v1/blogs";

  return useCustomQuery<ApiResponse<BlogPost[]>>(
    ["blogs", params?.search, params?.status, params?.category, params?.startDate, params?.endDate],
    endpoint,
  );
};

/**
 * Hook to retrieve blog KPI stats
 *
 * @returns React Query query result
 */
export const useGetBlogStats = () => {
  return useCustomQuery<ApiResponse<BlogStats>>(
    ["blog-stats"],
    "/v1/blogs/stats",
  );
};

/**
 * Hook to retrieve dynamic filter dropdown categories and authors
 *
 * @returns React Query query result
 */
export const useGetBlogFilters = () => {
  return useCustomQuery<ApiResponse<BlogFilterOptions>>(
    ["blog-filters"],
    "/v1/blogs/filters",
  );
};

/**
 * Hook to retrieve a single blog post by id or slug
 *
 * @param idOrSlug - Blog post ID or slug
 * @returns React Query query result
 */
export const useGetBlogById = (idOrSlug: string | number | undefined) => {
  return useCustomQuery<ApiResponse<BlogPost>>(
    ["blog", idOrSlug],
    `/v1/blogs/${idOrSlug}`,
    {
      enabled: Boolean(idOrSlug),
    },
  );
};

/**
 * Hook to create a new blog post
 *
 * @param onSuccessCallback - Optional callback invoked after successful creation
 * @returns Wrapped mutation object with typed mutate and mutateAsync functions
 */
export const useCreateBlog = (onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<ApiResponse<BlogPost>, unknown, CreateBlogInput>({
    toastMessages: {
      loading: "Creating article...",
      success: "Article created successfully!",
      error: "Failed to create article",
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (data: CreateBlogInput) =>
      mutation.mutate({
        url: "/v1/blogs",
        method: "POST",
        data,
      }),
    mutateAsync: (data: CreateBlogInput) =>
      mutation.mutateAsync({
        url: "/v1/blogs",
        method: "POST",
        data,
      }),
  };
};

/**
 * Hook to update an existing blog post
 *
 * @param onSuccessCallback - Optional callback invoked after successful update
 * @returns Wrapped mutation object with typed mutate and mutateAsync functions
 */
export const useUpdateBlog = (onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<ApiResponse<BlogPost>, unknown, UpdateBlogInput>({
    toastMessages: {
      loading: "Updating article...",
      success: "Article updated successfully!",
      error: "Failed to update article",
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (data: UpdateBlogInput) =>
      mutation.mutate({
        url: `/v1/blogs/${data.id}`,
        method: "PUT",
        data,
      }),
    mutateAsync: (data: UpdateBlogInput) =>
      mutation.mutateAsync({
        url: `/v1/blogs/${data.id}`,
        method: "PUT",
        data,
      }),
  };
};

/**
 * Hook to delete a blog post
 *
 * @param onSuccessCallback - Optional callback invoked after successful deletion
 * @returns Wrapped mutation object with typed mutate and mutateAsync functions
 */
export const useDeleteBlog = (onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<ApiResponse<{ id: number }>, unknown, undefined>({
    toastMessages: {
      loading: "Deleting article...",
      success: "Article deleted successfully!",
      error: "Failed to delete article",
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (id: number) =>
      mutation.mutate({
        url: `/v1/blogs/${id}`,
        method: "DELETE",
      }),
    mutateAsync: (id: number) =>
      mutation.mutateAsync({
        url: `/v1/blogs/${id}`,
        method: "DELETE",
      }),
  };
};
