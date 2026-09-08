import { api } from "libraries/axios";
import toast from "react-hot-toast";

/**
 * Helper function to trigger browser download of an Excel spreadsheet from a backend API endpoint
 *
 * @param url - Relative API endpoint URL (e.g. `/v1/employees/export`)
 * @param defaultFilename - Name of the downloaded file including extension
 * @returns Promise that resolves once the download is triggered
 */
export const downloadExcelFromApi = async (
  url: string,
  defaultFilename: string,
): Promise<void> => {
  const toastId = toast.loading("Generating Excel export...");

  try {
    const response = await api.get(url, {
      responseType: "blob",
    });

    const blob = new Blob([response.data as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    toast.success("Excel sheet downloaded successfully", { id: toastId });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Export failed";
    toast.error(`Failed to export: ${errMessage}`, { id: toastId });
  }
};
