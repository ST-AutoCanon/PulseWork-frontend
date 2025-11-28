"use client";

import React from "react";
import { IoSearch, IoCalendarOutline } from "react-icons/io5";

export default function FiltersPanel({
  filters,
  setFilters,
  canViewTeam,
  teamSearch,
  setTeamSearch,
  teamStatus,
  setTeamStatus,
  onSearch,
  onOpenForm,
}) {
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="leave-filters">
      {/* ULTRA COMPACT MOBILE-ONLY VERSION */}
      <div className="mobile-compact-filter">
        <div className="compact-date-row">
          <input type="date" name="from_date" value={filters.from_date || ""} onChange={handleFilterChange} />
          {/* <span>to</span> */}
          <input type="date" name="to_date" value={filters.to_date || ""} onChange={handleFilterChange} />
        </div>

        {canViewTeam && (
          <div className="compact-team-row">
            <input
              type="text"
              placeholder="Search..."
              value={teamSearch || ""}
              onChange={(e) => setTeamSearch(e.target.value)}
            />
            <select value={teamStatus || ""} onChange={(e) => setTeamStatus(e.target.value)}>
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        )}

        <div className="compact-buttons">
          <button onClick={onSearch}><IoSearch /></button>
          <button onClick={onOpenForm} className="primary">Apply Leave</button>
        </div>
      </div>

      {/* ORIGINAL DESKTOP VERSION – UNTOUCHED */}
      <label className="desktop-only">From:</label>
      <input className="date-filter-input desktop-only" type="date" name="from_date" value={filters.from_date || ""} onChange={handleFilterChange} />

      <label className="desktop-only">To:</label>
      <input className="date-filter-input desktop-only" type="date" name="to_date" value={filters.to_date || ""} onChange={handleFilterChange} />

      {canViewTeam && (
        <>
          <label>Search:</label>
          <input type="text" placeholder="Name, Emp ID, Reason" value={teamSearch || ""} onChange={(e) => setTeamSearch(e.target.value)} className="team-search-input" />
          <label>Status:</label>
          <select value={teamStatus || ""} onChange={(e) => setTeamStatus(e.target.value)} className="team-search-input">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </>
      )}

      <button className="filter-button desktop-only" onClick={onSearch}><IoSearch /> Search</button>
      <button className="leave-form-button desktop-only" onClick={onOpenForm}>Leave Request</button>
    </div>
  );
}