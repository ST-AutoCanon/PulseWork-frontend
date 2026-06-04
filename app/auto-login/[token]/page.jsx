"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../src/context/AuthProvider.client";

export default function AutoLoginPage() {
  const params = useParams();
  const router = useRouter();
  const { login } = useAuth();

  const startedRef = useRef(false);
  const [status, setStatus] = useState("Signing in...");

  const token = Array.isArray(params?.token) ? params.token[0] : params?.token;

  useEffect(() => {
    if (!token || startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auto-login/${token}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
              "x-employee-id": "STS-000001",
            },
          },
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.message || "Auto login failed");
        }

        const u = data.message || {};
        const minimalUser = {
          id: u.id ?? u.employeeId ?? u.employee_id ?? null,
          employeeId: u.employeeId ?? u.employee_id ?? u.id ?? null,
          role: u.role ?? "",
          name: u.name ?? "",
          orgId: u.org_id ?? u.orgId ?? null,
        };

        await login(minimalUser);

        const role = minimalUser.role?.toLowerCase();
        if (role === "general") {
          router.replace("/FacePunch");
        } else {
          router.replace("/dashboard");
        }
      } catch (err) {
        console.error("Auto login failed:", err);
        setStatus(err?.message || "Auto login failed");
        setTimeout(() => {
          router.replace("/login");
        }, 2000);
      }
    };

    run();
  }, [token, login, router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        fontSize: "18px",
      }}
    >
      {status}
    </div>
  );
}
