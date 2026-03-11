"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import ProtectedLayout from "../../src/components/Login/ProtectedLayout.client";
import DashboardClient from "../../src/components/Dashboard/Dashboard.client";

export default function CatchAllPage() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ev = new CustomEvent("app:navigate", { detail: { path: pathname } });
    window.dispatchEvent(ev);
  }, [pathname]);

  return (
    <ProtectedLayout>
      <DashboardClient />
    </ProtectedLayout>
  );
}
