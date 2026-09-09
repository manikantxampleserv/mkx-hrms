import {
  Box,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";
import * as React from "react";
import { cn } from "utils";

/**
 * Definition for a table column.
 */
export interface ColumnDef<T> {
  /** The text to display in the column header */
  header: string;
  /** The key from the data object to access for simple text rendering */
  accessorKey?: keyof T;
  /** Custom renderer function for the cell */
  cell?: (row: T) => React.ReactNode;
  /** Optional fixed width for the column */
  width?: string | number;
  /** Optional alignment */
  align?: "left" | "center" | "right";
}

/**
 * Props for the custom DataTable component.
 */
interface DataTableProps<T> {
  /** Array of data objects to display */
  data: T[];
  /** Array of column definitions */
  columns: ColumnDef<T>[];
  /** Optional CSS classes for the container */
  className?: string;
  /** Default rows per page */
  pageSize?: number;
  /** Available page size options */
  rowsPerPageOptions?: number[];
  /** Whether the table is currently loading or refetching filtered data */
  loading?: boolean;
  /** Number of animated skeleton placeholder rows to render while loading */
  skeletonRowCount?: number;
}

/**
 * Modern MUI DataTable adhering to the 5px border-radius global theme standard.
 * Built strictly with MUI Table primitives (TableContainer, Table, TableHead, TableRow, TableCell, TableBody, TablePagination).
 * Includes an integrated skeleton loading state for smooth data fetching and refetching.
 *
 * @param props - Configuration properties for the data table
 * @returns Rendered MUI data table
 */
export function DataTable<T>({
  data,
  columns,
  className,
  pageSize = 8,
  rowsPerPageOptions = [10],
  loading = false,
  skeletonRowCount = 5,
}: DataTableProps<T>) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(pageSize);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const currentData = React.useMemo(() => {
    const start = page * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  }, [data, page, rowsPerPage]);

  return (
    <div
      className={cn(
        "w-full rounded-[5px] border border-border bg-card overflow-hidden shadow-sm",
        className,
      )}
    >
      <TableContainer className="custom-scrollbar overflow-x-auto w-full">
        <Table
          aria-label="data table"
          className="min-w-full [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap"
        >
          <TableHead>
            <TableRow className="bg-secondary/40 border-b border-border">
              {columns.map((col, index) => (
                <TableCell
                  key={index}
                  style={{ width: col.width }}
                  align={col.align || "left"}
                  className="!p-3 !text-[11px] !font-semibold !uppercase !tracking-wider !text-muted-foreground !border-b !border-border !bg-transparent !whitespace-nowrap"
                >
                  {col.header || (index === columns.length - 1 ? "ACTION" : "")}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
                <TableRow
                  key={`skeleton-row-${rowIndex}`}
                  className="border-b border-border/40 hover:bg-transparent"
                >
                  {columns.map((col, colIndex) => {
                    const isFirstCol = colIndex === 0;
                    const isActionCol = colIndex === columns.length - 1;

                    return (
                      <TableCell
                        key={`skeleton-cell-${colIndex}`}
                        align={col.align || "left"}
                        className="!p-3 !border-b !border-border/40 align-middle !whitespace-nowrap"
                      >
                        {isFirstCol ? (
                          <Box className="flex items-center gap-3">
                            <Skeleton
                              variant="rounded"
                              width={36}
                              height={36}
                              animation="wave"
                              className="!bg-muted/70 !rounded-[8px] shrink-0"
                            />
                            <Box className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
                              <Skeleton
                                variant="text"
                                width="75%"
                                height={16}
                                animation="wave"
                                className="!bg-muted/70 !rounded-[4px]"
                              />
                              <Skeleton
                                variant="text"
                                width="45%"
                                height={12}
                                animation="wave"
                                className="!bg-muted/40 !rounded-[4px]"
                              />
                            </Box>
                          </Box>
                        ) : isActionCol ? (
                          <Box className="flex items-center justify-end">
                            <Skeleton
                              variant="rounded"
                              width={28}
                              height={28}
                              animation="wave"
                              className="!bg-muted/50 !rounded-[6px]"
                            />
                          </Box>
                        ) : col.header.includes("STATUS") ? (
                          <Skeleton
                            variant="rounded"
                            width={82}
                            height={24}
                            animation="wave"
                            className="!bg-muted/50 !rounded-[5px]"
                          />
                        ) : col.header.includes("TYPE") ? (
                          <Skeleton
                            variant="rounded"
                            width={74}
                            height={22}
                            animation="wave"
                            className="!bg-muted/50 !rounded-[5px]"
                          />
                        ) : col.header.includes("DURATION") || col.header.includes("ROLE") ? (
                          <Box className="flex flex-col gap-1.5">
                            <Skeleton
                              variant="text"
                              width="85%"
                              height={15}
                              animation="wave"
                              className="!bg-muted/60 !rounded-[4px]"
                            />
                            <Skeleton
                              variant="text"
                              width="40%"
                              height={11}
                              animation="wave"
                              className="!bg-muted/40 !rounded-[4px]"
                            />
                          </Box>
                        ) : (
                          <Skeleton
                            variant="text"
                            width={colIndex % 2 === 0 ? "70%" : "50%"}
                            height={15}
                            animation="wave"
                            className="!bg-muted/50 !rounded-[4px]"
                          />
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : currentData.length > 0 ? (
              currentData.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className="hover:bg-muted/30 transition-colors duration-150"
                >
                  {columns.map((col, colIndex) => (
                    <TableCell
                      key={colIndex}
                      align={col.align || "left"}
                      className="!p-2 !text-sm !text-foreground !border-b !border-border/50 align-middle !whitespace-nowrap"
                    >
                      {col.cell
                        ? col.cell(row)
                        : (row[col.accessorKey as keyof T] as React.ReactNode)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  align="center"
                  className="!py-14 !text-center !text-sm !text-muted-foreground !border-none"
                >
                  <div className="flex flex-col items-center justify-center gap-1 text-center w-full">
                    <span className="text-sm font-medium text-muted-foreground">
                      No matching records found.
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box className="border-t border-border/60 bg-card">
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          showFirstButton
          showLastButton
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    </div>
  );
}
