// utils.js

/**
 * Returns background color for project status
 * @param {string} status - Project status
 * @returns {string} - Hex color code
 */
export const getStatusBgColor = (status) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "#d1ecf1"; // light blue
    case "pending":
      return "#fff3cd"; // light yellow
    case "completed":
      return "#d4edda"; // light green
    default:
      return "transparent";
  }
};

/**
 * Returns background color for finance status
 * @param {string} status - Finance status
 * @returns {string} - Hex color code
 */
export const getFinanceStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "not initiated":
      return "#d1ecf1"; // light blue
    case "pending":
      return "#fff3cd"; // light yellow
    case "received":
      return "#d4edda"; // light green
    default:
      return "#f7f7f7"; // neutral gray
  }
};

/**
 * Formats an ISO date string to YYYY-MM-DD
 * @param {string} isoString - ISO date string
 * @returns {string} - Formatted date or empty string
 */
export const formatDate = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};
