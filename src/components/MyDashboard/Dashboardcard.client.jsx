"use client";

import React, { useEffect, useState, useMemo } from "react";
import { IoBagSharp } from "react-icons/io5";
import { GrMoney } from "react-icons/gr";
import { GiWallet } from "react-icons/gi";
import "./Dashboardcard.css";
import { useAuth } from "../../context/AuthProvider.client";

export default function Dashboardcard() {
  const { user } = useAuth();

  const baseCards = useMemo(
    () => [
      {
        key: "credit",
        label: "Previous Month Credit",
        icon: "GiWallet",
        value: 0,
      },
      {
        key: "reimbursement",
        label: "Previous Month Reimbursement (Approved)",
        icon: "IoBagSharp",
        value: 0,
      },
      {
        key: "salary",
        label: "Previous Month Salary",
        icon: "GrMoney",
        value: 0,
      },
    ],
    []
  );

  const iconComponentMap = {
    GiWallet,
    IoBagSharp,
    GrMoney,
  };

  const [cards, setCards] = useState(baseCards);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

  const meId = user?.employeeId ?? user?.id ?? null;

  useEffect(() => {
    if (!user?.dashboard) return;

    const dash = user.dashboard || {};
    const pre = baseCards.map((c) => {
      if (c.key === "salary") {
        const val =
          Number(
            dash.total_previous_month_salary ?? dash.previous_month_salary ?? 0
          ) || 0;
        return { ...c, value: val };
      }
      if (c.key === "reimbursement") {
        const val =
          Number(
            dash.totalApprovedReimbursement ??
              dash.previous_month_reimbursement ??
              0
          ) || 0;
        return { ...c, value: val };
      }
      if (c.key === "credit") {
        const val = Number(dash.previous_month_credit ?? 0) || 0;
        return { ...c, value: val };
      }
      return c;
    });
    setCards(pre);
  }, [user?.dashboard]);

  useEffect(() => {
    if (!BACKEND) {
      setError("Missing NEXT_PUBLIC_BACKEND_URL");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const headers = { "x-api-key": API_KEY };
    if (meId) headers["x-employee-id"] = meId;

    let finished = { payroll: false, reimbursement: false };
    const markDone = (k) => {
      finished[k] = true;
      if (finished.payroll && finished.reimbursement) setLoading(false);
    };

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`${BACKEND}/salary/last-month-total`, {
          method: "GET",
          headers,
          signal: controller.signal,
        });

        if (!res.ok)
          throw new Error(
            `Payroll fetch failed: ${res.status} ${res.statusText}`
          );
        const json = await res.json();
        const total =
          Number(
            json?.total_salary ??
              json?.total_previous_month_salary ??
              json?.total ??
              0
          ) || 0;

        setCards((prev) =>
          prev.map((c) =>
            c.key === "salary" ? { ...c, value: Math.round(total) } : c
          )
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching payroll data:", err);
          setError((p) => p || String(err.message));
        }
      } finally {
        markDone("payroll");
      }
    })();

    (async () => {
      try {
        const res = await fetch(
          `${BACKEND}/approved-reimbursement-last-month`,
          {
            method: "GET",
            headers,
            signal: controller.signal,
          }
        );

        if (!res.ok)
          throw new Error(
            `Reimbursement fetch failed: ${res.status} ${res.statusText}`
          );
        const json = await res.json();
        const totalApproved =
          Number(
            json?.totalApprovedReimbursement ??
              json?.totalApproved ??
              json?.total ??
              json?.amount ??
              0
          ) || 0;

        setCards((prev) =>
          prev.map((c) =>
            c.key === "reimbursement"
              ? { ...c, value: Math.round(totalApproved) }
              : c
          )
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching reimbursement data:", err);
          setError((p) => p || String(err.message));
        }
      } finally {
        markDone("reimbursement");
      }
    })();

    return () => controller.abort();
  }, [BACKEND, API_KEY, meId]);

  if (loading) return <p>Loading...</p>;

  const formatValue = (val) => {
    if (val === null || val === undefined) return "0.00";
    const n = Number(val) || 0;
    return n % 1 === 0 ? String(n) : n.toFixed(2);
  };

  return (
    <div className="dashboard-card-containers">
      {cards.map((item, index) => {
        const IconComp = iconComponentMap[item.icon] || (() => <GiWallet />);
        return (
          <div className="card" key={index}>
            <div className="icon">
              <IconComp />
            </div>
            <div className="content">
              <div className="label">{item.label}</div>
              <div className="value">
                {item.key === "credit" &&
                  (item.value ? formatValue(item.value) : "Coming soon!")}
                {item.key === "reimbursement" && formatValue(item.value)}
                {item.key === "salary" && formatValue(item.value)}
              </div>
            </div>
          </div>
        );
      })}
      {error && <p className="error">Error: {error}</p>}
    </div>
  );
}
