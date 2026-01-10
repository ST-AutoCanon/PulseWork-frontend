import ProtectedLayout from "../FacePunch/FacePunch.client.jsx";

export default function DashboardLayout({ children }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
