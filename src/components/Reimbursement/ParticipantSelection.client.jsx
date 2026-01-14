"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import "./ParticipantSelection.css";
import { useAuth } from "../../context/AuthProvider.client";

const ParticipantSelection = ({
  departmentId = null,
  selectionMode = "single",
  onModeChange = null,
  onSelectionChange,
  initialSelection = [],
  visible = true,
  limit = 200,
  hideModeToggle = false,
}) => {
  const { user } = useAuth();

  const [mode, setMode] = useState(selectionMode || "single");
  const [query, setQuery] = useState("");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(() => {
    if (!Array.isArray(initialSelection)) return [];
    return initialSelection.filter(Boolean).map((it) =>
      typeof it === "object"
        ? {
            employee_id: it.employee_id || it.id || it.employeeId,
            name: it.name || it.employee_name || "",
          }
        : { employee_id: it, name: String(it) }
    );
  });
  const [error, setError] = useState(null);

  const cancelRef = useRef(null);
  const searchTimer = useRef(null);

  const RAW_BACKEND =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.REACT_APP_BACKEND_URL ||
    user?.raw?.backend ||
    user?.raw?.backendUrl ||
    localStorage.getItem("backend") ||
    "";
  const BACKEND = (() => {
    if (!RAW_BACKEND) return "";
    if (!/^https?:\/\//i.test(RAW_BACKEND))
      return `http://${RAW_BACKEND}`.replace(/\/$/, "");
    return RAW_BACKEND.replace(/\/$/, "");
  })();

  const apiKey =
    process.env.NEXT_PUBLIC_API_KEY ||
    process.env.REACT_APP_API_KEY ||
    user?.apiKey ||
    user?.raw?.apiKey ||
    localStorage.getItem("apiKey") ||
    localStorage.getItem("x-api-key") ||
    "";

  const authToken =
    user?.token ||
    user?.authToken ||
    user?.accessToken ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("token") ||
    null;

  const readLoggedEmployeeId = useCallback(() => {
    if (user) {
      if (user.employeeId || user.id || user.empId || user.emp_id)
        return user.employeeId || user.id || user.empId || user.emp_id || null;
    }
    try {
      const rawDashboard = localStorage.getItem("dashboardData");
      if (rawDashboard) {
        const parsed = JSON.parse(rawDashboard);
        if (parsed) {
          return (
            parsed.employeeId ||
            parsed.employee_id ||
            parsed.id ||
            parsed.empId ||
            parsed.emp_id ||
            null
          );
        }
      }
    } catch (e) {}
    return (
      localStorage.getItem("x-employee-id") ||
      localStorage.getItem("employeeId") ||
      localStorage.getItem("employee_id") ||
      null
    );
  }, [user]);

  const loggedEmployeeId = readLoggedEmployeeId();

  const readOrgId = useCallback(() => {
    if (user) {
      return (
        user.orgId ||
        user.raw?.org_id ||
        user.org_id ||
        user.organization_id ||
        null
      );
    }
    try {
      const rawDashboard = localStorage.getItem("dashboardData");
      if (rawDashboard) {
        const parsed = JSON.parse(rawDashboard);
        if (parsed)
          return (
            parsed.orgId || parsed.org_id || parsed.organization_id || null
          );
      }
    } catch (e) {}
    return (
      localStorage.getItem("x-org-id") ||
      localStorage.getItem("orgId") ||
      localStorage.getItem("org_id") ||
      null
    );
  }, [user]);

  const buildHeaders = useCallback(() => {
    const headers = {};
    if (apiKey) headers["x-api-key"] = apiKey;
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
    const lid = readLoggedEmployeeId();
    if (lid) headers["x-employee-id"] = String(lid);
    const oid = readOrgId();
    if (oid) headers["x-org-id"] = String(oid);
    return headers;
  }, [apiKey, authToken, readLoggedEmployeeId, readOrgId]);

  const parentControlsMode = typeof onModeChange === "function";
  const shouldShowInternalModeToggle = !hideModeToggle && !parentControlsMode;

  const employeeEndpoints = [
    "/reimbursement/employees",
    "/reimbursements/employees",
    "/employees",
    "/employees/list",
    "/employee/list",
    "/employees/all",
    "/api/employees",
  ].map((p) => (BACKEND ? `${BACKEND}${p}` : p));

  const tryFetchFromCandidate = async (url, params, cancelToken) => {
    try {
      const res = await axios.get(url, {
        params,
        withCredentials: true,
        headers: buildHeaders(),
        cancelToken,
      });
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.data)) return res.data.data;
      if (Array.isArray(res.data?.employees)) return res.data.employees;
      if (Array.isArray(res.data?.result)) return res.data.result;
      return null;
    } catch (err) {
      if (err?.response?.data) {
        const body = err.response.data;
        const bodyMsg =
          (typeof body === "string" && body) ||
          body?.error ||
          body?.message ||
          null;
        if (
          bodyMsg &&
          String(bodyMsg).toLowerCase().includes("missing x-employee-id")
        ) {
          const e = new Error("Missing x-employee-id header");
          e.code = "MISSING_X_EMPLOYEE_ID";
          throw e;
        }
      }
      if (axios.isCancel(err)) throw err;
      return null;
    }
  };

  const fetchEmployees = useCallback(
    async (q = "") => {
      if (cancelRef.current) {
        try {
          cancelRef.current.cancel("cancel previous");
        } catch {}
      }
      cancelRef.current = axios.CancelToken.source();
      setLoading(true);
      setError(null);

      const params = {};
      if (q && String(q).trim()) {
        params.q = String(q).trim();
        params.search = String(q).trim();
      }
      if (departmentId) params.departmentId = departmentId;
      if (limit) params.limit = limit;

      try {
        let results = null;
        for (const url of employeeEndpoints) {
          try {
            results = await tryFetchFromCandidate(
              url,
              params,
              cancelRef.current.token
            );
            if (results && results.length) break;
          } catch (err) {
            if (err?.code === "MISSING_X_EMPLOYEE_ID") {
              setEmployees([]);
              setError(
                "Server requires x-employee-id header for this request. Please ensure you're logged in."
              );
              setLoading(false);
              return;
            }
            if (axios.isCancel(err)) throw err;

            console.warn("endpoint failed:", url, err?.message || err);
          }
        }

        if (!results) {
          setEmployees([]);
          setError("No employees found (tried multiple endpoints).");
          setLoading(false);
          return;
        }

        const mapped = results.map((r) => {
          const id = r.employee_id || r.id || r.employeeId || r.empId;
          const name =
            r.name ||
            r.employee_name ||
            `${r.first_name || ""} ${r.last_name || ""}`.trim() ||
            String(id || "");
          return {
            employee_id: id,
            name,
            position: r.position || r.designation || "",
            department_name: r.department_name || r.department || "",
            raw: r,
          };
        });
        setEmployees(mapped);
        setError(null);
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error("Error fetching employees:", err);
          setEmployees([]);
          setError("Failed to load employees.");
        }
      } finally {
        setLoading(false);
      }
    },
    [departmentId, limit, BACKEND, employeeEndpoints, buildHeaders]
  );

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchEmployees(query);
    }, 260);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query, fetchEmployees]);

  useEffect(() => {
    fetchEmployees("");
  }, [departmentId, fetchEmployees]);

  useEffect(() => {
    if (selectionMode) setMode(selectionMode);
  }, [selectionMode]);

  const selectionIdsFromArray = (arr) =>
    (arr || [])
      .filter(Boolean)
      .map((it) =>
        typeof it === "object" ? it.employee_id || it.id || it.employeeId : it
      )
      .filter(Boolean)
      .map(String);

  const areIdSetsEqual = (aArr, bArr) => {
    const a = selectionIdsFromArray(aArr);
    const b = selectionIdsFromArray(bArr);
    if (a.length !== b.length) return false;
    const aSet = new Set(a);
    for (const x of b) if (!aSet.has(String(x))) return false;
    return true;
  };

  useEffect(() => {
    if (!Array.isArray(initialSelection)) return;

    const normalized = initialSelection
      .filter(Boolean)
      .map((it) =>
        typeof it === "object"
          ? {
              employee_id: it.employee_id || it.id || it.employeeId,
              name: it.name || it.employee_name || "",
            }
          : { employee_id: it, name: String(it) }
      )
      .filter((n) => n.employee_id);

    setSelected(normalized);
  }, []);

  useEffect(() => {
    if (!employees || employees.length === 0) return;
    let changed = false;
    const empMap = new Map();
    for (const e of employees) {
      if (e && e.employee_id) empMap.set(String(e.employee_id), e.name || "");
    }
    const patched = selected.map((s) => {
      const id = String(s.employee_id);
      const realName = empMap.get(id);
      if (realName && realName !== s.name) {
        changed = true;
        return { ...s, name: realName };
      }
      return s;
    });
    if (changed) setSelected(patched);
  }, [employees]);

  useEffect(() => {
    if (typeof onModeChange === "function") onModeChange(mode);
  }, [mode]);

  useEffect(() => {
    if (typeof onSelectionChange === "function") {
      onSelectionChange(selected.slice());
    }
  }, [selected]);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (!parentControlsMode && typeof onModeChange === "function")
      onModeChange(newMode);
    if (newMode === "single" && selected.length > 1) setSelected([selected[0]]);
  };

  const handleSelectSingle = (emp) => {
    if (!emp) return;
    const obj = {
      employee_id: emp.employee_id || emp.id || emp.employeeId,
      name:
        emp.name ||
        emp.employee_name ||
        String(emp.employee_id || emp.id || emp.employeeId),
    };
    setSelected([obj]);
  };

  const handleToggleGroup = (emp) => {
    if (!emp) return;
    const empId = emp.employee_id || emp.id || emp.employeeId;
    const existsIndex = selected.findIndex(
      (s) => String(s.employee_id) === String(empId)
    );
    if (existsIndex !== -1) {
      setSelected((prev) =>
        prev.filter((p) => String(p.employee_id) !== String(empId))
      );
    } else {
      const obj = {
        employee_id: empId,
        name: emp.name || emp.employee_name || String(empId),
      };
      setSelected((prev) => {
        if (prev.some((p) => String(p.employee_id) === String(empId)))
          return prev;
        return [...prev, obj];
      });
    }
  };

  const handleRemoveChip = (emp) => {
    setSelected((prev) =>
      prev.filter((p) => String(p.employee_id) !== String(emp.employee_id))
    );
  };

  const searchInputRef = useRef(null);
  const handleKeyDownSearch = (e) => {
    if (e.key === "Enter") {
      if (employees && employees.length) handleSelectSingle(employees[0]);
    }
  };

  if (!visible) return null;

  return (
    <div className="ps-root" aria-live="polite">
      {shouldShowInternalModeToggle && (
        <div
          className="ps-mode-toggle"
          role="radiogroup"
          aria-label="Participant selection mode"
        >
          <label className="ps-mode-label">
            <input
              type="radio"
              name="participant_mode_internal"
              checked={mode === "single"}
              onChange={() => handleModeChange("single")}
            />
            <span className="ps-mode-text">Single</span>
          </label>

          <label className="ps-mode-label">
            <input
              type="radio"
              name="participant_mode_internal"
              checked={mode === "group"}
              onChange={() => handleModeChange("group")}
            />
            <span className="ps-mode-text">Group</span>
          </label>
        </div>
      )}

      <div className="ps-hint">
        {mode === "single"
          ? "Select a single employee (self) for the claim."
          : "Select one or more employees for group claims."}
      </div>

      <div className="ps-chips">
        {selected.map((emp) => (
          <button
            key={emp.employee_id}
            type="button"
            className="ps-chip"
            onClick={() => handleRemoveChip(emp)}
            title="Click to remove"
          >
            <span className="ps-chip-name">{emp.name}</span>
            <span className="ps-chip-id">{emp.employee_id}</span>
            <span className="ps-chip-x">✕</span>
          </button>
        ))}
      </div>

      <div className="ps-search-row">
        <input
          ref={searchInputRef}
          className="ps-search-input"
          type="text"
          placeholder="Search employees by name or id..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDownSearch}
        />
        <button
          type="button"
          className="ps-search-btn"
          onClick={() => fetchEmployees(query)}
        >
          Search
        </button>
      </div>

      <div
        className="ps-list"
        role={mode === "single" ? "listbox" : "list"}
        aria-label="Employee list"
      >
        {loading && <div className="ps-loading">Loading…</div>}
        {!loading && employees.length === 0 && (
          <div className="ps-empty">No employees found</div>
        )}

        {employees.map((emp) => {
          const empId =
            emp.employee_id || emp.id || emp.employeeId || emp.empId;
          const name = emp.name || String(empId);
          const isSelected = selected.some(
            (s) => String(s.employee_id) === String(empId)
          );
          return (
            <div
              key={empId}
              className={`ps-item ${isSelected ? "selected" : ""}`}
              role={mode === "single" ? "option" : "checkbox"}
              aria-selected={isSelected}
              onClick={() =>
                mode === "single"
                  ? handleSelectSingle({ ...emp, employee_id: empId, name })
                  : handleToggleGroup({ ...emp, employee_id: empId, name })
              }
            >
              <div className="ps-item-top">
                <div className="ps-item-name">{name}</div>
                <div className="ps-item-id">{empId}</div>
              </div>
              {emp.position || emp.department_name ? (
                <div className="ps-item-meta">
                  {emp.position || ""}{" "}
                  {emp.department_name ? ` • ${emp.department_name}` : ""}
                </div>
              ) : null}
              <div className={`ps-item-action ${isSelected ? "sel" : ""}`}>
                {mode === "group"
                  ? isSelected
                    ? "Selected — click to remove"
                    : "Click to add to group"
                  : isSelected
                  ? "Selected"
                  : "Click to select"}
              </div>
            </div>
          );
        })}
      </div>

      {error && <div className="ps-error">{error}</div>}
    </div>
  );
};

ParticipantSelection.propTypes = {
  departmentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  selectionMode: PropTypes.oneOf(["single", "group"]),
  onModeChange: PropTypes.func,
  onSelectionChange: PropTypes.func.isRequired,
  initialSelection: PropTypes.array,
  visible: PropTypes.bool,
  limit: PropTypes.number,
  hideModeToggle: PropTypes.bool,
};

export default ParticipantSelection;
