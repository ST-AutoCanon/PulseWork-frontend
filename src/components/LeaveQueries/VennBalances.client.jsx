"use client";

import React from "react";
import { monthName } from "./leaveUtils.client";

export function RenderVenn({ label, allowance = 0, used = 0, remaining = 0 }) {
  const formatOne = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(1) : "0.0";
  };

  const aNum = Number.isFinite(Number(allowance)) ? Number(allowance) : 0;
  const uNum = Number.isFinite(Number(used)) ? Number(used) : 0;
  const rNum = Number.isFinite(Number(remaining))
    ? Number(remaining)
    : Math.max(aNum - uNum, 0);
  const adjustedRemainingNum = Math.max(rNum, aNum - uNum);

  const width = 320,
    height = 140,
    rCircle = 74,
    cy = 70,
    cx1 = 110,
    cx2 = 200;
  const midX = (cx1 + cx2) / 2,
    midY = cy;

  return (
    <div
      className="venn-card venn-card-fixed"
      aria-label={`${label} leave balance`}
    >
      <div className="venn-label">{label}</div>
      <svg
        className="venn-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={`venn-${label}-title`}
      >
        <title
          id={`venn-${label}-title`}
        >{`${label} - Used vs Remaining`}</title>

        <circle
          cx={cx1}
          cy={cy}
          r={rCircle}
          fill="rgba(220,53,69,0.28)"
          stroke="rgba(220,53,69,0.6)"
        />
        <circle
          cx={cx2}
          cy={cy}
          r={rCircle}
          fill="rgba(25,135,84,0.28)"
          stroke="rgba(25,135,84,0.6)"
        />

        <text
          x={cx1 - 12}
          y={cy - 22}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="22"
          fontWeight="600"
        >
          Used
        </text>
        <text
          x={cx1 - 11}
          y={cy + 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="25"
          fontWeight="700"
        >
          {formatOne(uNum)}
        </text>

        <text
          x={cx2 + 11}
          y={cy - 22}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="22"
          fontWeight="600"
        >
          Bal
        </text>
        <text
          x={cx2 + 10}
          y={cy + 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="25"
          fontWeight="700"
        >
          {formatOne(adjustedRemainingNum)}
        </text>

        <g>
          <text
            x={midX}
            y={midY + 5}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="16"
            fontWeight="800"
          >
            Total
          </text>
          <text
            x={midX}
            y={midY + 25}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="22"
            fontWeight="700"
          >
            {formatOne(aNum)}
          </text>
        </g>
      </svg>
    </div>
  );
}

export default function VennBalances({
  balances,
  activePolicy,
  vennStartIndex,
  vennVisibleCount,
  prevVenn,
  nextVenn,
  setIsLopModalOpen,
}) {
  if (!balances || balances.length === 0) return null;

  const start = activePolicy?.year_start
    ? new Date(activePolicy.year_start).toLocaleDateString()
    : "-";
  const end = activePolicy?.year_end
    ? new Date(activePolicy.year_end).toLocaleDateString()
    : "-";

  const hasOverflow = balances.length > vennVisibleCount;
  const visibleBalances = balances.slice(
    vennStartIndex,
    vennStartIndex + vennVisibleCount,
  );

  return (
    <div className="venn-balance-section">
      <div className="policy-period">
        <div className="policy-modal-content">
          <div className="policy-period-row">
            <div>
              <span className="date-label">Current Policy Period :</span>
              <span className="date-value">
                {start} - {end}
              </span>
            </div>
            <div>
              <button
                type="button"
                className="show-lop-btn"
                onClick={() => setIsLopModalOpen(true)}
              >
                Show LOP
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`venn-grid-with-nav ${hasOverflow ? "" : "no-nav"}`}>
        {hasOverflow && (
          <div className="venn-nav-column">
            <button
              className="venn-nav-btn venn-prev"
              onClick={prevVenn}
              disabled={vennStartIndex <= 0}
              aria-label="Previous balances"
            >
              ◀
            </button>
          </div>
        )}

        <div
          className="venn-cards-container"
          role="list"
          aria-label="Leave balances"
        >
          {visibleBalances.map((b) => {
            const typeLabel =
              b.type === "casual"
                ? "Casual Leave"
                : b.type === "earned"
                  ? "Earned Leave"
                  : b.type
                    ? String(b.type).charAt(0).toUpperCase() + b.type.slice(1)
                    : "Leave";

            const used = Number(b.used ?? 0);
            const allowance = Number(
              b.allowance ?? b.earned ?? b.annual_allowance ?? 0,
            );
            const remaining = Number(
              b.remaining ?? Math.max(allowance - used, 0),
            );

            return (
              <div key={b.type} role="listitem" className="venn-card-wrapper">
                <RenderVenn
                  label={typeLabel}
                  allowance={allowance}
                  used={used}
                  remaining={remaining}
                />
              </div>
            );
          })}
        </div>

        {hasOverflow && (
          <div className="venn-nav-column">
            <button
              className="venn-nav-btn venn-next"
              onClick={nextVenn}
              disabled={vennStartIndex + vennVisibleCount >= balances.length}
              aria-label="Next balances"
            >
              ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
