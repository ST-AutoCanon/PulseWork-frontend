"use client";

import React from "react";

export default function FieldsGrid({
  availableFields = [],
  selectedFields = [],
  toggleField = () => {},
  disabled = false,
}) {
  return (
    <div className="rp-fields-grid" aria-disabled={disabled}>
      {availableFields.map((f) => {
        const selected = selectedFields.includes(f.key);

        return (
          <button
            key={f.key}
            type="button"
            className={`rp-field-chip ${selected ? "selected" : ""}`}
            onClick={() => toggleField(f.key)}
            role="checkbox"
            aria-checked={selected}
            title={f.label}
            disabled={disabled}
          >
            <span className="rp-field-chip-label">{f.label}</span>
            {selected && <span className="rp-field-chip-check">✓</span>}
          </button>
        );
      })}
    </div>
  );
}
