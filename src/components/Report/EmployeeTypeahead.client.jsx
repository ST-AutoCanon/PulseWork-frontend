"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { MdClose } from "react-icons/md";
import { getApiBase } from "./ReportUtils";
import { useAuth } from "../../context/AuthProvider.client";

function extractEmployeeIdFromUser(user) {
  try {
    if (!user) return "";
    return (
      user.employeeId ||
      user.employee_id ||
      user.id ||
      user.raw?.employeeId ||
      user.raw?.employee_id ||
      user.raw?.id ||
      ""
    );
  } catch {
    return "";
  }
}

export default function EmployeeTypeahead({
  placeholder = "Search by name or email...",
  limit = 10,
  onSelect = () => {},
  onTyping = () => {},
  onClear = () => {},

  selectedValue = "",
  isTyping = false,
  minChars = 2,
  debounceMs = 180,
}) {
  const { user } = useAuth();

  const employeeId = extractEmployeeIdFromUser(user);
  const departmentId =
    user?.raw?.department_id ||
    user?.department_id ||
    user?.departmentId ||
    null;

  const [query, setQuery] = useState(selectedValue || "");
  const [suggestions, setSuggestions] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [errorText, setErrorText] = useState("");

  const debRef = useRef(null);
  const latestRequestId = useRef(0);
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const lastTypingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debRef.current) clearTimeout(debRef.current);
      latestRequestId.current++;
    };
  }, []);

  useEffect(() => {
    if (
      !isTyping &&
      typeof selectedValue === "string" &&
      selectedValue !== query
    ) {
      setQuery(selectedValue);
    }
  }, [selectedValue, isTyping, query]);

  useEffect(() => {
    function onDocClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        if (debRef.current) clearTimeout(debRef.current);
        setOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    const nowTyping = Boolean(query && query.trim().length > 0);
    if (lastTypingRef.current !== nowTyping) {
      lastTypingRef.current = nowTyping;
      onTyping?.(nowTyping);
      if (!nowTyping) onClear?.();
    }
  }, [query, onTyping, onClear]);

  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);

    const trimmed = query?.trim() || "";
    if (trimmed.length < minChars) {
      setSuggestions([]);
      setTotalMatches(0);
      setLoading(false);
      setOpen(false);
      setErrorText("");
      return;
    }

    setLoading(true);
    setErrorText("");

    debRef.current = setTimeout(async () => {
      const reqId = ++latestRequestId.current;
      const base = getApiBase?.() || "";
      const params = new URLSearchParams();

      params.set("q", trimmed);
      params.set("limit", String(limit));
      if (departmentId) params.set("department_id", String(departmentId));

      const url = `${base.replace(
        /\/$/,
        ""
      )}/api/report/search-employees?${params.toString()}`;

      try {
        const resp = await axios.get(url, {
          withCredentials: true,
          timeout: 10_000,
          headers: {
            Accept: "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
            ...(employeeId ? { "x-employee-id": String(employeeId) } : {}),
          },
        });

        if (!mountedRef.current || reqId !== latestRequestId.current) return;

        const data = resp?.data || {};
        const items = Array.isArray(data)
          ? data
          : data.results || data.data || data.rows || [];

        setSuggestions(items.slice(0, limit));
        setTotalMatches(
          typeof data.total === "number" ? data.total : items.length
        );
        setOpen(items.length > 0);
        setErrorText("");
      } catch (err) {
        if (!mountedRef.current || reqId !== latestRequestId.current) return;

        const msg = err?.message || "Unknown error";
        if (
          msg.toLowerCase().includes("cors") ||
          msg.toLowerCase().includes("network")
        ) {
          setErrorText(
            "Network/CORS error — check backend CORS configuration."
          );
        } else if (err?.response?.status) {
          setErrorText(`Server returned ${err.response.status}`);
        } else {
          setErrorText(msg);
        }

        setSuggestions([]);
        setTotalMatches(0);
        setOpen(false);
      } finally {
        if (mountedRef.current && reqId === latestRequestId.current)
          setLoading(false);
        debRef.current = null;
      }
    }, debounceMs);

    return () => {
      if (debRef.current) clearTimeout(debRef.current);
    };
  }, [query, limit, departmentId, debounceMs, minChars, employeeId]);

  function handleSelect(item) {
    const name = item.employee_name || item.name || item.email || "";
    setQuery(name);
    setSuggestions([]);
    setTotalMatches(0);
    setOpen(false);
    onSelect?.(item);

    setTimeout(() => {
      const input = inputRef.current;
      input?.focus?.();
      if (input?.setSelectionRange) {
        const len = input.value?.length || 0;
        input.setSelectionRange(len, len);
      }
    }, 30);
  }

  function handleClear() {
    if (debRef.current) clearTimeout(debRef.current);
    latestRequestId.current++;
    setQuery("");
    setSuggestions([]);
    setTotalMatches(0);
    setOpen(false);
    setErrorText("");
    onClear?.();
  }

  return (
    <div
      className="rp-input-with-icon"
      ref={boxRef}
      style={{ position: "relative" }}
    >
      <input
        ref={inputRef}
        className="typeahead-input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => suggestions.length && setOpen(true)}
        autoComplete="off"
        aria-label="Search employee"
      />

      {loading && (
        <span className="typeahead-spinner">
          <span className="rp-spinner" />
        </span>
      )}

      {query && !loading && (
        <button
          type="button"
          className="typeahead-clear"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <MdClose size={16} />
        </button>
      )}

      {errorText && (
        <div style={{ color: "crimson", fontSize: 12, marginTop: 6 }}>
          {errorText}
        </div>
      )}

      {open && (suggestions.length > 0 || totalMatches > 0) && (
        <div className="typeahead-dropdown" role="listbox">
          <div className="typeahead-info">
            {totalMatches === 0
              ? "No matches"
              : `${totalMatches} employee${totalMatches > 1 ? "s" : ""} match`}
          </div>

          <ul>
            {suggestions.map((s) => (
              <li
                key={`${s.employee_id || s.id}-${s.email || s.name}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(s);
                }}
              >
                <div className="typeahead-name">
                  {s.employee_name || s.name || s.email || "(no name)"}
                </div>
                <div className="typeahead-sub">
                  {s.employee_id || ""}{" "}
                  {s.department_name || s.department || "No department"}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
