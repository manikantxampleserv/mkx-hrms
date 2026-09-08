import ExcelJS from "exceljs";

/**
 * Service responsible for generating professionally formatted and styled Microsoft Excel (.xlsx) workbooks
 */

/**
 * Generates an Excel (.xlsx) file buffer from a dataset with a colored, styled header row
 *
 * @template T - Object shape representing a row in the spreadsheet
 * @param sheetName - Name of the worksheet tab
 * @param data - Array of row objects to convert into sheet rows
 * @returns Promise resolving to the Buffer containing the binary Excel workbook
 */
export const generateExcelBuffer = async <T extends Record<string, unknown>>(
  sheetName: string,
  data: T[],
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MKX HRMS";
  workbook.lastModifiedBy = "MKX HRMS";
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
  });

  if (data.length === 0) {
    const rawBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(rawBuffer);
  }

  const columnHeaders = Object.keys(data[0]);

  worksheet.columns = columnHeaders.map((header) => ({
    header,
    key: header,
    width: Math.max(header.length + 5, 14),
  }));

  data.forEach((item) => {
    worksheet.addRow(item);
  });

  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF00B1D8" },
    };
    cell.font = {
      name: "Segoe UI",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "left",
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF0090B5" } },
      left: { style: "thin", color: { argb: "FF0090B5" } },
      bottom: { style: "medium", color: { argb: "FF007A99" } },
      right: { style: "thin", color: { argb: "FF0090B5" } },
    };
  });

  for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex += 1) {
    const row = worksheet.getRow(rowIndex);
    row.height = 22;
    const isEven = rowIndex % 2 === 0;

    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = {
        name: "Segoe UI",
        size: 10,
        color: { argb: "FF0F172A" },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "left",
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      if (isEven) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" },
        };
      }
    });
  }

  worksheet.columns.forEach((column) => {
    let maxContentLength = 0;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const cellValue = cell.value !== null && cell.value !== undefined ? String(cell.value) : "";
      if (cellValue.length > maxContentLength) {
        maxContentLength = cellValue.length;
      }
    });
    column.width = Math.max(maxContentLength + 5, 14);
  });

  const rawBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(rawBuffer);
};
