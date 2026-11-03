"use client";

export default function PrintPolicyButton() {
  return (
    <button
      type="button"
      className="pdp-print-button"
      onClick={() => window.print()}
      aria-label="Print or save this privacy policy as PDF"
    >
      ↓ Print / Save as PDF
    </button>
  );
}
