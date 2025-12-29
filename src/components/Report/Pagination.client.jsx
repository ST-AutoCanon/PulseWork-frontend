"use client";

import React, { useState, useEffect } from "react";

export default function Pagination({
  totalPages = 1,
  currentPage = 1,
  onPageChange = () => {},
  sticky = true,
}) {
  const [jump, setJump] = useState(currentPage);

  useEffect(() => {
    setJump(currentPage);
  }, [currentPage]);

  const goTo = (p) => {
    const pageNum = Math.min(Math.max(1, Number(p || 1)), totalPages || 1);

    setJump(pageNum);

    if (pageNum !== currentPage) {
      onPageChange(pageNum);
    }
  };

  const renderPages = () => {
    const pages = [];
    const windowSize = 5;

    let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
    let end = start + windowSize - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - windowSize + 1);
    }

    for (let p = start; p <= end; p++) {
      pages.push(
        <button
          key={p}
          className={`rp-page-num ${p === currentPage ? "active" : ""}`}
          onClick={() => goTo(p)}
          aria-current={p === currentPage ? "page" : undefined}
          type="button"
        >
          {p}
        </button>
      );
    }

    return pages;
  };

  const wrapperClass = sticky
    ? "rp-pagination rp-pagination-static"
    : "rp-pagination";

  return (
    <div className={wrapperClass} role="navigation" aria-label="Pagination">
      <button
        className="rp-page-btn"
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        type="button"
      >
        Prev
      </button>

      {renderPages()}

      <button
        className="rp-page-btn"
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        type="button"
      >
        Next
      </button>

      <div className="rp-page-jump" aria-label="Jump to page">
        <label style={{ fontSize: 13 }}>Go to</label>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={jump}
          onChange={(e) => setJump(Number(e.target.value || 1))}
          onKeyDown={(e) => {
            if (e.key === "Enter") goTo(jump);
          }}
          aria-label="Page number"
        />
        <button
          className="rp-page-btn"
          onClick={() => goTo(jump)}
          type="button"
        >
          Go
        </button>
      </div>
    </div>
  );
}
