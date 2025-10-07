"use client";

import React from "react";
import { IoSearch } from "react-icons/io5";

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
      <label htmlFor="from_date">From:</label>
      <input
        id="from_date"
        type="date"
        name="from_date"
        value={filters.from_date || ""}
        onChange={handleFilterChange}
        className="date-filter-input"
      />

      <label htmlFor="to_date">To:</label>
      <input
        id="to_date"
        type="date"
        name="to_date"
        value={filters.to_date || ""}
        onChange={handleFilterChange}
        className="date-filter-input"
      />

      {canViewTeam && (
        <>
          <label htmlFor="teamSearch">Search:</label>
          <input
            id="teamSearch"
            type="text"
            placeholder="Name, Emp ID, Reason"
            value={teamSearch || ""}
            onChange={(e) => setTeamSearch(e.target.value)}
            className="team-search-input"
          />

          <label htmlFor="teamStatus">Status:</label>
          <select
            id="teamStatus"
            className="team-search-input"
            value={teamStatus || ""}
            onChange={(e) => setTeamStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </>
      )}

      <button type="button" className="filter-button" onClick={onSearch}>
        <IoSearch /> Search
      </button>

      <button type="button" className="leave-form-button" onClick={onOpenForm}>
        Leave Request
      </button>
    </div>
  );
}
