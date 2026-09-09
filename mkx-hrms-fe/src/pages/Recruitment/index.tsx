import {
  AccessTime,
  Cancel,
  CheckCircle,
  DeleteOutlined,
  HowToReg,
  MoreHoriz,
  Star,
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
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Download,
  Filter,
  Plus,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ArrowMenu } from "shared/ArrowMenu";
import { CustomDialog } from "shared/CustomDialog";
import { DataTable, type ColumnDef } from "shared/DataTable";
import { CustomDateRangePicker } from "shared/DatePicker";
import { StatsCard } from "shared/StatsCard";
import { FadeUpItem, StaggerContainer } from "shared/animations";
import { downloadExcelFromApi } from "src/utils/exportToExcel";

/**
 * Type representing recruitment pipeline stage filter categories
 */
type RecruitmentStageFilter = "All" | "Screening" | "Interviewing" | "Offered" | "Hired";

import {
  useDeleteCandidate,
  useGetCandidates,
  useGetRecruitmentFilters,
  useGetRecruitmentStats,
  useOnboardCandidate,
  useUpdateCandidateStatus,
  type CandidateRecord,
} from "services/recruitment";

const iconMap: Record<string, LucideIcon> = {
  Briefcase,
  Users,
  Calendar,
  CheckCircle2,
};

/**
 * Filter tabs list
 */
const stageTabs: RecruitmentStageFilter[] = [
  "All",
  "Screening",
  "Interviewing",
  "Offered",
  "Hired",
];

/**
 * Props definition for CandidateRowActions component
 */
interface CandidateRowActionsProps {
  row: CandidateRecord;
  onUpdateStageStatus: (
    candidate: CandidateRecord,
    stage: "Screening" | "Interviewing" | "Offered" | "Hired",
    status?: "Active" | "In Review" | "Offered" | "Rejected",
  ) => void;
  onOnboard: (candidate: CandidateRecord) => void;
  onDelete: (candidate: CandidateRecord) => void;
  onView: (candidate: CandidateRecord) => void;
}

/**
 * Dynamic row actions popup menu for Candidates
 *
 * @param props - Component configuration props
 * @returns Rendered action menu trigger and popup
 */
function CandidateRowActions({
  row,
  onUpdateStageStatus,
  onOnboard,
  onDelete,
  onView,
}: CandidateRowActionsProps): React.ReactElement {
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
        paperClassName="!min-w-[170px]"
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onView(row);
          }}
          className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-muted-foreground hover:!text-foreground hover:!bg-secondary/70"
        >
          <Visibility className="!w-4 !h-4" />
          View Candidate
        </MenuItem>

        {!row.onboarded_at && (row.stage === "Offered" || row.stage === "Hired") && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              onOnboard(row);
            }}
            className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-primary hover:!bg-primary/10"
          >
            <HowToReg className="!w-4 !h-4 text-primary" />
            <span className="font-semibold text-primary">Onboard Employee</span>
          </MenuItem>
        )}

        {row.stage !== "Interviewing" && row.stage !== "Hired" && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              onUpdateStageStatus(row, "Interviewing", "In Review");
            }}
            className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-amber-500 hover:!bg-amber-500/10"
          >
            <AccessTime className="!w-4 !h-4 text-amber-500" />
            <span className="font-medium text-amber-500">Move to Interview</span>
          </MenuItem>
        )}

        {row.stage !== "Offered" && row.stage !== "Hired" && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              onUpdateStageStatus(row, "Offered", "Offered");
            }}
            className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-emerald-500 hover:!bg-emerald-500/10"
          >
            <CheckCircle className="!w-4 !h-4 text-emerald-500" />
            <span className="font-medium text-emerald-500">Extend Offer</span>
          </MenuItem>
        )}

        {row.stage !== "Hired" && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              onUpdateStageStatus(row, "Hired", "Offered");
            }}
            className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-emerald-600 hover:!bg-emerald-600/10"
          >
            <CheckCircle className="!w-4 !h-4 text-emerald-600" />
            <span className="font-semibold text-emerald-600">Mark Hired</span>
          </MenuItem>
        )}

        {row.status !== "Rejected" && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              onUpdateStageStatus(row, row.stage, "Rejected");
            }}
            className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-destructive hover:!bg-destructive/10"
          >
            <Cancel className="!w-4 !h-4 text-destructive" />
            <span className="font-medium text-destructive">Reject Candidate</span>
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onDelete(row);
          }}
          className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-destructive hover:!bg-destructive/10 !border-t !border-border/60 !mt-1"
        >
          <DeleteOutlined className="!w-4 !h-4 text-destructive" />
          <span className="font-medium text-destructive">Delete</span>
        </MenuItem>
      </ArrowMenu>
    </>
  );
}

/**
 * Generates dynamic column definitions for Recruitment pipeline
 *
 * @param onUpdateStageStatus - Callback to transition stage/status
 * @param onOnboard - Callback to onboard candidate into employee
 * @param onDelete - Callback to remove candidate
 * @param onView - Callback to open candidate details
 * @returns Column definitions list
 */
function getCandidateColumns(
  onUpdateStageStatus: (
    candidate: CandidateRecord,
    stage: "Screening" | "Interviewing" | "Offered" | "Hired",
    status?: "Active" | "In Review" | "Offered" | "Rejected",
  ) => void,
  onOnboard: (candidate: CandidateRecord) => void,
  onDelete: (candidate: CandidateRecord) => void,
  onView: (candidate: CandidateRecord) => void,
): ColumnDef<CandidateRecord>[] {
  return [
    {
      header: "CANDIDATE",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={row.avatar || undefined}
            variant="rounded"
            className="!bg-secondary !text-foreground shrink-0"
          >
            {row.name.charAt(0)}
          </Avatar>
          <div className="flex flex-col">
            <span
              onClick={() => onView(row)}
              className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              {row.name}
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">{row.email}</span>
          </div>
        </div>
      ),
      width: "24%",
    },
    {
      header: "POSITION APPLIED",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-sm">{row.position}</span>
          <span className="text-xs text-muted-foreground mt-0.5">{row.department}</span>
        </div>
      ),
      width: "22%",
    },
    {
      header: "STAGE",
      cell: (row) => (
        <div className="px-2.5 py-1 rounded-[5px] text-xs font-medium bg-secondary text-foreground w-fit">
          {row.stage}
        </div>
      ),
      width: "15%",
    },
    {
      header: "EXP & RATING",
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-foreground font-medium">{row.experience}</span>
          <span className="text-muted-foreground">•</span>
          <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
            <Star className="!w-3 !h-3" />
            {row.rating}
          </span>
        </div>
      ),
      width: "14%",
    },
    {
      header: "STATUS",
      cell: (row) => {
        if (row.status === "Offered" || row.status === "Active") {
          return (
            <Chip
              icon={<CheckCircle className="!w-3.5 !h-3.5" />}
              label={row.status}
              size="small"
              color="success"
              variant="outlined"
              className="!h-6 !text-xs !bg-success/10 !border-success/20 !font-medium"
            />
          );
        }
        if (row.status === "In Review") {
          return (
            <Chip
              icon={<AccessTime className="!w-3.5 !h-3.5" />}
              label="In Review"
              size="small"
              color="warning"
              variant="outlined"
              className="!h-6 !text-xs !bg-warning/10 !border-warning/20 !font-medium"
            />
          );
        }
        return (
          <Chip
            icon={<Cancel className="!w-3.5 !h-3.5" />}
            label="Rejected"
            size="small"
            color="error"
            variant="outlined"
            className="!h-6 !text-xs !bg-destructive/10 !border-destructive/20 !font-medium"
          />
        );
      },
      width: "13%",
    },
    {
      header: "APPLIED DATE",
      cell: (row) => <span className="text-sm text-muted-foreground">{row.applied_date}</span>,
      width: "12%",
    },
    {
      header: "ACTION",
      cell: (row) => (
        <CandidateRowActions
          row={row}
          onUpdateStageStatus={onUpdateStageStatus}
          onOnboard={onOnboard}
          onDelete={onDelete}
          onView={onView}
        />
      ),
      width: "5%",
      align: "right",
    },
  ];
}

/**
 * Recruitment page component providing hiring pipeline tracking and candidate evaluation.
 */
export default function Recruitment() {
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<RecruitmentStageFilter>("All");
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>("All");
  const [positionFilter, setPositionFilter] = useState<string>("All");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [viewingCandidate, setViewingCandidate] = useState<CandidateRecord | null>(null);

  const {
    data: candidatesResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetCandidates({
    search: searchTerm,
    stage: stageFilter,
    department: departmentFilter,
    position: positionFilter,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const { data: filtersResponse } = useGetRecruitmentFilters();
  const filterOptions = filtersResponse?.data;
  const { data: statsResponse, refetch: refetchStats } = useGetRecruitmentStats();

  const updateCandidateStatusMutation = useUpdateCandidateStatus(() => {
    refetch();
    refetchStats();
  });

  const onboardCandidateMutation = useOnboardCandidate(() => {
    refetch();
    refetchStats();
  });

  const deleteCandidateMutation = useDeleteCandidate(() => {
    refetch();
    refetchStats();
  });

  /**
   * Updates candidate recruitment pipeline stage and status
   */
  const handleUpdateStageStatus = async (
    candidate: CandidateRecord,
    stage: "Screening" | "Interviewing" | "Offered" | "Hired",
    status?: "Active" | "In Review" | "Offered" | "Rejected",
  ) => {
    await updateCandidateStatusMutation.mutateAsync({
      id: candidate.id,
      stage,
      status: status || (stage === "Hired" ? "Offered" : "In Review"),
    });
    if (viewingCandidate?.id === candidate.id) {
      setViewingCandidate((prev) =>
        prev
          ? {
              ...prev,
              stage,
              status: status || (stage === "Hired" ? "Offered" : "In Review"),
            }
          : null,
      );
    }
  };

  /**
   * Onboards a qualified candidate into active employees directory
   */
  const handleOnboard = async (candidate: CandidateRecord) => {
    await onboardCandidateMutation.mutateAsync({ id: candidate.id });
    if (viewingCandidate?.id === candidate.id) {
      setViewingCandidate((prev) =>
        prev ? { ...prev, onboarded_at: new Date().toISOString() } : null,
      );
    }
  };

  /**
   * Deletes a candidate application
   */
  const handleDelete = async (candidate: CandidateRecord) => {
    await deleteCandidateMutation.mutateAsync(candidate.id);
    if (viewingCandidate?.id === candidate.id) {
      setViewingCandidate(null);
    }
  };

  /**
   * Opens detailed candidate profile dialog
   */
  const handleView = (candidate: CandidateRecord) => {
    setViewingCandidate(candidate);
  };

  const candidateColumns = useMemo(
    () => getCandidateColumns(handleUpdateStageStatus, handleOnboard, handleDelete, handleView),
    [handleUpdateStageStatus, handleOnboard, handleDelete, handleView],
  );

  const candidates = useMemo(() => candidatesResponse?.data || [], [candidatesResponse]);

  /**
   * Dynamic departments available in the Recruitment pipeline
   */
  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>(filterOptions?.departments || []);
    candidates.forEach((c) => {
      if (c.department) set.add(c.department);
    });
    if (departmentFilter !== "All") set.add(departmentFilter);
    return Array.from(set);
  }, [filterOptions?.departments, candidates, departmentFilter]);

  /**
   * Dynamic positions available in the Recruitment pipeline
   */
  const uniquePositions = useMemo(() => {
    const set = new Set<string>(filterOptions?.positions || []);
    candidates.forEach((c) => {
      if (c.position) set.add(c.position);
    });
    if (positionFilter !== "All") set.add(positionFilter);
    return Array.from(set);
  }, [filterOptions?.positions, candidates, positionFilter]);

  const activeKpiCards = useMemo(() => {
    return (statsResponse?.data || []).map((card) => ({
      id: card.id,
      title: card.title,
      value: card.value,
      subtext: card.subtext,
      icon: iconMap[card.icon_name] || Users,
      icon_color: card.icon_color,
      icon_bg: card.icon_bg,
    }));
  }, [statsResponse]);

  /**
   * Filtered candidate list based on search and stage
   */
  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      const matchesSearch =
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStage = stageFilter === "All" || candidate.stage === stageFilter;

      return matchesSearch && matchesStage;
    });
  }, [candidates, searchTerm, stageFilter]);

  return (
    <StaggerContainer className="space-y-4">
      <FadeUpItem className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeKpiCards.map((card) => (
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
          Track applicants, interview stages, and hiring pipelines
        </p>
      </FadeUpItem>

      <FadeUpItem className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <InputBase
            placeholder="Search candidates or roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 h-9 pl-3 pr-4 rounded-[5px] bg-secondary border border-border text-sm text-foreground [&_input]:p-0 [&_input::placeholder]:text-muted-foreground [&_input::placeholder]:opacity-100 transition-all duration-200"
            startAdornment={
              <InputAdornment position="start">
                <Search className="w-4 h-4 text-muted-foreground" />
              </InputAdornment>
            }
          />

          <div className="flex items-center gap-1 bg-card/60 p-0.5 h-9 rounded-[5px] border border-border/50 box-border">
            {stageTabs.map((stage) => (
              <Button
                key={stage}
                size="small"
                onClick={() => setStageFilter(stage)}
                className={`${
                  stageFilter === stage
                    ? "!bg-accent !text-accent-foreground"
                    : "!text-muted-foreground"
                }`}
              >
                {stage}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="contained"
            size="small"
            startIcon={<Plus className="w-3.5 h-3.5" />}
            className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !text-xs !normal-case !font-semibold !px-3.5 !py-2 !rounded-[5px] shadow-sm"
          >
            Post New Job
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() =>
              downloadExcelFromApi("/v1/recruitment/export", "Candidates_Pipeline.xlsx")
            }
            startIcon={<Download className="w-3.5 h-3.5 text-muted-foreground" />}
            className="!border-border !bg-secondary !text-muted-foreground hover:!text-foreground !text-xs !normal-case !font-normal !px-3.5 !py-2 !rounded-[5px]"
          >
            Export
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
            startIcon={<Filter className="w-3.5 h-3.5 text-muted-foreground" />}
            endIcon={<ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
            className="!border-border !bg-secondary !text-muted-foreground hover:!text-foreground !text-xs !normal-case !font-normal !px-3.5 !py-2 !rounded-[5px]"
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
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="!rounded-[5px] !text-sm"
                >
                  <MenuItem value="All" className="!text-sm">
                    All Departments
                  </MenuItem>
                  {uniqueDepartments.map((dept) => (
                    <MenuItem key={dept} value={dept} className="!text-sm">
                      {dept}
                    </MenuItem>
                  ))}
                  {departmentFilter !== "All" && !uniqueDepartments.includes(departmentFilter) && (
                    <MenuItem value={departmentFilter} className="!text-sm">
                      {departmentFilter}
                    </MenuItem>
                  )}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <Select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="!rounded-[5px] !text-sm"
                >
                  <MenuItem value="All" className="!text-sm">
                    All Positions
                  </MenuItem>
                  {uniquePositions.map((pos) => (
                    <MenuItem key={pos} value={pos} className="!text-sm">
                      {pos}
                    </MenuItem>
                  ))}
                  {positionFilter !== "All" && !uniquePositions.includes(positionFilter) && (
                    <MenuItem value={positionFilter} className="!text-sm">
                      {positionFilter}
                    </MenuItem>
                  )}
                </Select>
              </FormControl>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Applied Date Range
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
                    setDepartmentFilter("All");
                    setPositionFilter("All");
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
          data={filteredCandidates}
          columns={candidateColumns}
          pageSize={8}
          loading={isLoading || isFetching}
        />
      </FadeUpItem>

      {viewingCandidate && (
        <CustomDialog
          open={Boolean(viewingCandidate)}
          onClose={() => setViewingCandidate(null)}
          title="Candidate Application Profile"
          maxWidth="xs"
          actions={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outlined"
                size="small"
                color="error"
                onClick={() => handleDelete(viewingCandidate)}
                className="!text-xs !normal-case"
              >
                Delete Candidate
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setViewingCandidate(null)}
                className="!text-xs !normal-case !text-muted-foreground"
              >
                Close
              </Button>
            </div>
          }
        >
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <Avatar
              src={viewingCandidate.avatar || undefined}
              className="!w-12 !h-12 !bg-primary/20 !text-primary !text-lg !font-bold"
            >
              {viewingCandidate.name.charAt(0)}
            </Avatar>
            <div>
              <h4 className="text-base font-semibold text-foreground">{viewingCandidate.name}</h4>
              <p className="text-xs text-muted-foreground">{viewingCandidate.email}</p>
              <p className="text-xs font-medium text-foreground mt-0.5">
                {viewingCandidate.position} • {viewingCandidate.department}
              </p>
            </div>
            <div className="ml-auto flex flex-col items-end gap-1">
              <Chip
                label={viewingCandidate.stage}
                size="small"
                className="!bg-primary/10 !text-primary !font-medium !text-xs"
              />
              <Chip
                label={viewingCandidate.status}
                size="small"
                color={
                  viewingCandidate.status === "Offered" || viewingCandidate.status === "Active"
                    ? "success"
                    : viewingCandidate.status === "In Review"
                      ? "warning"
                      : "error"
                }
                variant="outlined"
                className="!text-[10px] !h-5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-secondary/50 rounded-[5px]">
              <span className="text-muted-foreground">Experience</span>
              <p className="font-semibold text-foreground mt-0.5">{viewingCandidate.experience}</p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-[5px]">
              <span className="text-muted-foreground">Interview Rating</span>
              <p className="font-semibold text-amber-500 mt-0.5 flex items-center gap-1">
                <Star className="!w-3.5 !h-3.5" />
                {viewingCandidate.rating} / 5.0
              </p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-[5px]">
              <span className="text-muted-foreground">Applied Date</span>
              <p className="font-semibold text-foreground mt-0.5">
                {viewingCandidate.applied_date}
              </p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-[5px]">
              <span className="text-muted-foreground">Onboarding Status</span>
              <p className="font-semibold text-foreground mt-0.5">
                {viewingCandidate.onboarded_at ? "Onboarded Employee" : "Candidate"}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-border space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Pipeline Stage Actions
            </span>
            <div className="flex flex-wrap gap-2">
              {viewingCandidate.stage !== "Interviewing" && (
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  onClick={() =>
                    handleUpdateStageStatus(viewingCandidate, "Interviewing", "In Review")
                  }
                  className="!text-xs !normal-case"
                >
                  Move to Interview
                </Button>
              )}
              {viewingCandidate.stage !== "Offered" && (
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  onClick={() => handleUpdateStageStatus(viewingCandidate, "Offered", "Offered")}
                  className="!text-xs !normal-case"
                >
                  Extend Offer
                </Button>
              )}
              {viewingCandidate.stage !== "Hired" && (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  onClick={() => handleUpdateStageStatus(viewingCandidate, "Hired", "Offered")}
                  className="!text-xs !normal-case"
                >
                  Mark Hired
                </Button>
              )}
              {!viewingCandidate.onboarded_at &&
                (viewingCandidate.stage === "Offered" || viewingCandidate.stage === "Hired") && (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleOnboard(viewingCandidate)}
                    className="!text-xs !normal-case !bg-primary !text-primary-foreground"
                  >
                    Onboard Employee
                  </Button>
                )}
              {viewingCandidate.status !== "Rejected" && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() =>
                    handleUpdateStageStatus(viewingCandidate, viewingCandidate.stage, "Rejected")
                  }
                  className="!text-xs !normal-case"
                >
                  Reject
                </Button>
              )}
            </div>
          </div>
        </CustomDialog>
      )}
    </StaggerContainer>
  );
}
