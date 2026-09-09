import {
  Article,
  Category,
  CheckCircle,
  Delete,
  Drafts,
  Edit,
  FileDownload,
  FilterList,
  KeyboardArrowDown,
  MenuBook,
  MoreHoriz,
  Visibility,
} from "@mui/icons-material";
import {
  Avatar,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputBase,
  MenuItem,
  Select,
} from "@mui/material";
import { Search } from "lucide-react";
import React, { useMemo, useState } from "react";
import {
  useCreateBlog,
  useDeleteBlog,
  useGetBlogFilters,
  useGetBlogs,
  useGetBlogStats,
  useUpdateBlog,
  type BlogPost,
  type CreateBlogInput,
} from "services/blogs";
import { ArrowMenu } from "shared/ArrowMenu";
import { DataTable, type ColumnDef } from "shared/DataTable";
import { CustomDateRangePicker } from "shared/DatePicker";
import { StatsCard } from "shared/StatsCard";
import { FadeUpItem, StaggerContainer } from "shared/animations";
import { downloadExcelFromApi } from "src/utils/exportToExcel";
import { ManageBlog } from "./ManageBlog";
import { ViewBlog } from "./ViewBlog";

/**
 * Filter tab definitions for the toolbar
 */
const statusTabs: Array<"All" | "Published" | "Draft" | "Archived"> = [
  "All",
  "Published",
  "Draft",
  "Archived",
];

/**
 * Props for RowActions component
 */
interface RowActionsProps {
  row: BlogPost;
  onView: (blog: BlogPost) => void;
  onEdit: (blog: BlogPost) => void;
  onDelete: (id: number) => void;
}

/**
 * Row actions popup menu for viewing, editing, and deleting an article
 */
const RowActions = ({ row, onView, onEdit, onDelete }: RowActionsProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <IconButton
        size="small"
        className="!text-muted-foreground hover:!text-foreground"
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        <MoreHoriz />
      </IconButton>
      <ArrowMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        arrowPosition="right"
        paperClassName="!min-w-[140px]"
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onView(row);
          }}
          className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-muted-foreground hover:!text-foreground hover:!bg-secondary/70"
        >
          <Visibility className="!w-4 !h-4" />
          Read Article
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onEdit(row);
          }}
          className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-muted-foreground hover:!text-foreground hover:!bg-secondary/70"
        >
          <Edit className="!w-4 !h-4" />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onDelete(row.id);
          }}
          className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-destructive hover:!bg-destructive/10"
        >
          <Delete className="!w-4 !h-4 text-destructive" />
          <span className="text-destructive font-medium">Delete</span>
        </MenuItem>
      </ArrowMenu>
    </>
  );
};

/**
 * Main Blogs page component with CRUD operations, stats, dynamic filters, and mui-tiptap editor
 *
 * @returns The rendered Blogs dashboard page
 */
export default function Blogs(): React.ReactElement {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Published" | "Draft" | "Archived">(
    "All",
  );
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

  const [isManageDrawerOpen, setIsManageDrawerOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingBlog, setViewingBlog] = useState<BlogPost | null>(null);

  const {
    data: blogsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetBlogs({
    search: searchTerm,
    status: statusFilter,
    category: categoryFilter,
    startDate,
    endDate,
  });

  const { data: statsResponse } = useGetBlogStats();
  const { data: filterOptionsResponse } = useGetBlogFilters();

  const createMutation = useCreateBlog();
  const updateMutation = useUpdateBlog();
  const deleteMutation = useDeleteBlog();

  const blogs = useMemo(() => blogsResponse?.data || [], [blogsResponse]);
  const stats = statsResponse?.data;
  const uniqueCategories = useMemo(
    () => filterOptionsResponse?.data?.categories || [],
    [filterOptionsResponse],
  );

  const handleCreateOrUpdate = async (input: CreateBlogInput, id?: number) => {
    if (id) {
      await updateMutation.mutateAsync({ ...input, id });
    } else {
      await createMutation.mutateAsync(input);
    }
    await refetch();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this article?")) {
      try {
        await deleteMutation.mutateAsync(id);
        await refetch();
      } catch {
        /** Mutation toast handles error feedback */
      }
    }
  };

  const dynamicKpiCards = useMemo(
    () => [
      {
        id: "total_blogs",
        title: "TOTAL ARTICLES",
        value: stats ? String(stats.total_posts) : "0",
        subtext: "Published and draft content",
        icon: MenuBook,
        icon_color: "text-blue-500",
        icon_bg: "bg-blue-500/10",
      },
      {
        id: "published_blogs",
        title: "PUBLISHED",
        value: stats ? String(stats.published_posts) : "0",
        subtext: "Live on company feed",
        icon: CheckCircle,
        icon_color: "text-emerald-500",
        icon_bg: "bg-emerald-500/10",
      },
      {
        id: "draft_blogs",
        title: "IN DRAFT",
        value: stats ? String(stats.draft_posts) : "0",
        subtext: "Work in progress",
        icon: Drafts,
        icon_color: "text-amber-500",
        icon_bg: "bg-amber-500/10",
      },
      {
        id: "categories_count",
        title: "CATEGORIES",
        value: stats ? String(stats.categories_count) : "0",
        subtext: "Distinct subject areas",
        icon: Category,
        icon_color: "text-purple-500",
        icon_bg: "bg-purple-500/10",
      },
    ],
    [stats],
  );

  const blogColumns: ColumnDef<BlogPost>[] = useMemo(
    () => [
      {
        header: "ARTICLE",
        cell: (row) => (
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => {
              setViewingBlog(row);
              setIsViewModalOpen(true);
            }}
          >
            {row.cover_image ? (
              <img
                src={row.cover_image}
                alt={row.title}
                className="w-10 h-10 rounded-[5px] object-cover shrink-0 border border-border"
              />
            ) : (
              <div className="w-10 h-10 rounded-[5px] bg-secondary flex items-center justify-center shrink-0 text-muted-foreground group-hover:text-primary transition-colors border border-border">
                <Article className="w-5 h-5" />
              </div>
            )}
            <div className="flex flex-col max-w-[280px]">
              <span className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors truncate">
                {row.title}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {row.excerpt || "No excerpt provided"}
              </span>
            </div>
          </div>
        ),
        width: "32%",
      },
      {
        header: "CATEGORY",
        cell: (row) => (
          <Chip
            label={row.category}
            size="small"
            className="!bg-secondary/70 !text-foreground !text-xs !font-medium"
          />
        ),
        width: "16%",
      },
      {
        header: "AUTHOR",
        cell: (row) => (
          <div className="flex items-center gap-2">
            <Avatar className="!w-6 !h-6 !text-[10px] !bg-primary/20 !text-primary">
              {row.author_name.charAt(0).toUpperCase()}
            </Avatar>
            <span className="text-sm font-medium text-foreground">{row.author_name}</span>
          </div>
        ),
        width: "18%",
      },
      {
        header: "STATUS",
        cell: (row) => (
          <Chip
            label={row.status}
            size="small"
            color={
              row.status === "Published"
                ? "success"
                : row.status === "Draft"
                  ? "warning"
                  : "default"
            }
            variant="outlined"
            className="!text-xs"
          />
        ),
        width: "14%",
      },
      {
        header: "DATE",
        cell: (row) => {
          const rawDate = row.published_at || row.created_at;
          const formatted = rawDate ? rawDate.split("-").reverse().join("/") : "-";
          return <span className="text-xs text-muted-foreground">{formatted}</span>;
        },
        width: "12%",
      },
      {
        header: "ACTION",
        cell: (row) => (
          <RowActions
            row={row}
            onView={(blog) => {
              setViewingBlog(blog);
              setIsViewModalOpen(true);
            }}
            onEdit={(blog) => {
              setSelectedBlog(blog);
              setIsManageDrawerOpen(true);
            }}
            onDelete={handleDelete}
          />
        ),
        width: "8%",
      },
    ],
    [],
  );

  return (
    <StaggerContainer className="space-y-4">
      <FadeUpItem className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dynamicKpiCards.map((card) => (
          <StatsCard
            key={card.id}
            title={card.title}
            value={card.value}
            subtext={card.subtext}
            icon={card.icon}
            iconBg={card.icon_bg}
            iconColor={card.icon_color}
          />
        ))}
      </FadeUpItem>

      <FadeUpItem>
        <p className="text-sm text-muted-foreground">
          Publish company announcements, HR updates, and knowledge-base articles
        </p>
      </FadeUpItem>

      <FadeUpItem className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <InputBase
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 h-9 pl-3 pr-4 rounded-[5px] bg-secondary border border-border text-sm text-foreground [&_input]:p-0 [&_input::placeholder]:text-muted-foreground [&_input::placeholder]:opacity-100 transition-all duration-200"
            startAdornment={
              <InputAdornment position="start">
                <Search className="!w-4 !h-4 text-muted-foreground" />
              </InputAdornment>
            }
          />

          <div className="flex items-center gap-1 bg-card/60 p-0.5 h-9 rounded-[5px] border border-border/50 box-border">
            {statusTabs.map((status) => (
              <Button
                key={status}
                size="small"
                onClick={() => setStatusFilter(status)}
                className={`${
                  statusFilter === status
                    ? "!bg-accent !text-accent-foreground"
                    : "!text-muted-foreground"
                }`}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              setSelectedBlog(null);
              setIsManageDrawerOpen(true);
            }}
            startIcon={<Article className="!w-4 !h-4" />}
            className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !text-xs !normal-case !font-medium !px-3.5 !py-2 !rounded-[5px] shrink-0"
          >
            Create Article
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => downloadExcelFromApi("/v1/blogs/export", "Company_Blogs.xlsx")}
            startIcon={<FileDownload className="!w-4 !h-4 text-muted-foreground" />}
            className="!border-border !bg-secondary !text-muted-foreground hover:!text-foreground !text-xs !normal-case !font-normal !px-3.5 !py-2 !rounded-[5px]"
          >
            Export
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
            startIcon={<FilterList className="!w-4 !h-4 text-muted-foreground" />}
            endIcon={<KeyboardArrowDown className="!w-4 !h-4 text-muted-foreground" />}
            className="!border-border !bg-secondary !text-muted-foreground hover:!text-foreground !text-xs !normal-case !font-normal !px-3.5 !py-2 !rounded-[5px] shrink-0"
          >
            More filters
          </Button>
          <ArrowMenu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={() => setFilterAnchorEl(null)}
            arrowPosition="right"
            arrowOffsetY={-6}
            paperClassName="!min-w-[280px] !p-3"
          >
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Advanced Filters
            </div>

            <div className="flex flex-col gap-3">
              <FormControl size="small" fullWidth>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="!rounded-[5px] !text-sm"
                >
                  <MenuItem value="All" className="!text-sm">
                    All Categories
                  </MenuItem>
                  {uniqueCategories.map((cat) => (
                    <MenuItem key={cat} value={cat} className="!text-sm">
                      {cat}
                    </MenuItem>
                  ))}
                  {categoryFilter !== "All" && !uniqueCategories.includes(categoryFilter) && (
                    <MenuItem value={categoryFilter} className="!text-sm">
                      {categoryFilter}
                    </MenuItem>
                  )}
                </Select>
              </FormControl>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Published Date Range
                </span>
                <CustomDateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  size="small"
                  onClick={() => {
                    setCategoryFilter("All");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="!text-xs !normal-case !text-muted-foreground hover:!text-foreground"
                >
                  Clear all
                </Button>
              </div>
            </div>
          </ArrowMenu>
        </div>
      </FadeUpItem>

      <FadeUpItem>
        <DataTable
          data={blogs}
          columns={blogColumns}
          pageSize={8}
          loading={isLoading || isFetching}
        />
      </FadeUpItem>

      <ManageBlog
        open={isManageDrawerOpen}
        onClose={() => {
          setIsManageDrawerOpen(false);
          setSelectedBlog(null);
        }}
        initialData={selectedBlog}
        onSubmit={handleCreateOrUpdate}
        availableCategories={uniqueCategories}
      />

      <ViewBlog
        open={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingBlog(null);
        }}
        blog={viewingBlog}
      />
    </StaggerContainer>
  );
}
