import ProtectedLayout from "../../src/components/Login/ProtectedLayout.client";

export default function DashboardLayout({ children }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
