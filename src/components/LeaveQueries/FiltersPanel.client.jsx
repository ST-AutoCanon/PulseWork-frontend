"use client";

import React from "react";
import { IoSearch, IoCalendarOutline, IoAdd } from "react-icons/io5";
import { useMediaQuery } from "react-responsive";

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
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  if (isMobile) {
    return (
      <div className="mobile-compact-filter">
        <div className="compact-date-row">
          <input
            type="date"
            name="from_date"
            value={filters.from_date || ""}
            onChange={handleFilterChange}
          />
          <input
            type="date"
            name="to_date"
            value={filters.to_date || ""}
            onChange={handleFilterChange}
          />
        </div>

        {canViewTeam && (
          <div className="compact-team-row">
            <input
              type="text"
              placeholder="Search employee..."
              value={teamSearch || ""}
              onChange={(e) => setTeamSearch(e.target.value)}
            />
            <select
              value={teamStatus || ""}
              onChange={(e) => setTeamStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        )}

        <div className="compact-buttons">
          <button onClick={onSearch}>
            <IoSearch size={20} /> Search
          </button>
          <button onClick={onOpenForm} className="primary">
            <IoAdd size={22} /> Apply Leave
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="leave-filters">
      <label>From:</label>
      <input
        className="date-filter-input"
        type="date"
        name="from_date"
        value={filters.from_date || ""}
        onChange={handleFilterChange}
      />

      <label>To:</label>
      <input
        className="date-filter-input"
        type="date"
        name="to_date"
        value={filters.to_date || ""}
        onChange={handleFilterChange}
      />

      {canViewTeam && (
        <>
          <label>Search:</label>
          <input
            type="text"
            placeholder="Name, ID, Reason..."
            value={teamSearch || ""}
            onChange={(e) => setTeamSearch(e.target.value)}
            className="team-search-input"
          />

          <label>Status:</label>
          <select
            value={teamStatus || ""}
            onChange={(e) => setTeamStatus(e.target.value)}
            className="team-search-input"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </>
      )}

      <button className="filter-button" onClick={onSearch}>
        <IoSearch /> Search
      </button>
      <button className="leave-form-button" onClick={onOpenForm}>
        Leave Request
      </button>
    </div>
  );
}
