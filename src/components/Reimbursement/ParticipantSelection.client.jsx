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
  const { user, hydrated } = useAuth();

  const [mode, setMode] = useState(selectionMode || "single");
  const [query, setQuery] = useState("");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selected, setSelected] = useState(() =>
    Array.isArray(initialSelection)
      ? initialSelection.filter(Boolean).map((it) =>
          typeof it === "object"
            ? {
                employee_id: it.employee_id || it.id || it.employeeId,
                name: it.name || it.employee_name || "",
              }
            : { employee_id: it, name: String(it) }
        )
      : []
  );

  const cancelRef = useRef(null);
  const searchTimer = useRef(null);

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "";
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

  const loggedEmployeeId = user?.employeeId || null;

  const buildHeaders = () => ({
    ...(API_KEY ? { "x-api-key": API_KEY } : {}),
    ...(loggedEmployeeId ? { "x-employee-id": String(loggedEmployeeId) } : {}),
  });

  const parentControlsMode = typeof onModeChange === "function";
  const shouldShowInternalModeToggle = !hideModeToggle && !parentControlsMode;

  const employeeEndpoints = [
    "/reimbursement/employees",
    "/reimbursements/employees",
    "/employees",
    "/employees/list",
    "/employee/list",
    "/employees/all",
  ].map((p) => `${BACKEND}${p}`);

  const tryFetchFromCandidate = async (url, params, cancelToken) => {
    try {
      const res = await axios.get(url, {
        params,
        withCredentials: true,
        headers: buildHeaders(),
        cancelToken,
      });

      return (
        res.data?.data ||
        res.data?.employees ||
        res.data?.result ||
        (Array.isArray(res.data) ? res.data : null)
      );
    } catch (err) {
      if (axios.isCancel(err)) throw err;
      return null;
    }
  };

  const fetchEmployees = useCallback(
    async (q = "") => {
      if (!hydrated || !loggedEmployeeId) return;

      if (cancelRef.current) {
        cancelRef.current.cancel("cancel previous");
      }

      cancelRef.current = axios.CancelToken.source();
      setLoading(true);
      setError(null);

      const params = {
        ...(q ? { q, search: q } : {}),
        ...(departmentId ? { departmentId } : {}),
        ...(limit ? { limit } : {}),
      };

      try {
        let results = null;

        for (const url of employeeEndpoints) {
          results = await tryFetchFromCandidate(
            url,
            params,
            cancelRef.current.token
          );
          if (Array.isArray(results) && results.length) break;
        }

        if (!results) {
          setEmployees([]);
          setError("No employees found.");
          return;
        }

        setEmployees(
          results.map((r) => ({
            employee_id: r.employee_id || r.id || r.employeeId || r.empId,
            name:
              r.name ||
              r.employee_name ||
              `${r.first_name || ""} ${r.last_name || ""}`.trim(),
            position: r.position || r.designation || "",
            department_name: r.department_name || r.department || "",
            raw: r,
          }))
        );
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error("fetchEmployees error:", err);
          setError("Failed to load employees.");
        }
      } finally {
        setLoading(false);
      }
    },
    [hydrated, loggedEmployeeId, departmentId, limit]
  );

  useEffect(() => {
    if (!visible) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);

    searchTimer.current = setTimeout(() => {
      fetchEmployees(query);
    }, 250);

    return () => clearTimeout(searchTimer.current);
  }, [query, fetchEmployees, visible]);

  useEffect(() => {
    fetchEmployees("");
  }, [departmentId, hydrated]);

  useEffect(() => {
    if (selectionMode) setMode(selectionMode);
  }, [selectionMode]);

  useEffect(() => {
    onSelectionChange?.(selected.slice());
  }, [selected]);

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
