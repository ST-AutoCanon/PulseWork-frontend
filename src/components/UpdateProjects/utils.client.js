export const getStatusBgColor = (status) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "#d1ecf1";
    case "pending":
      return "#fff3cd";
    case "completed":
      return "#d4edda";
    default:
      return "transparent";
  }
};

export const getFinanceStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "not initiated":
      return "#d1ecf1";
    case "pending":
      return "#fff3cd";
    case "received":
      return "#d4edda";
    default:
      return "#f7f7f7";
  }
};

export const formatDate = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};
