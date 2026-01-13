"use client";

import React, { useEffect, useState, useMemo } from "react";
import { MdEmojiTransportation, MdOutlinePhoneAndroid } from "react-icons/md";
import { GiKnifeFork, GiPencilBrush } from "react-icons/gi";
import { TbTriangleSquareCircle } from "react-icons/tb";
import ParticipantSelection from "./ParticipantSelection.client";
import "./Reimbursement.css"; // keep this if your CSS is global or adjust to module import if you're using CSS modules

/**
 * ClaimFields (Next.js client component)
 *
 * Props:
 *  - claimTypes (array) : [{ label: 'Transportation' }, ...]
 *  - projects (array) : list of project names
 *  - formData (object) : form state
 *  - setFormData (func) : setter for form state
 *  - selectedFiles (array) : selected file names
 *  - setSelectedFiles (func)
 *  - handleFileUpload (func) : function(e, { rowIndex, files })
 *  - setSelectedSubType (func)
 *  - selectedSubType (string)
 *  - modalContentRef (ref) : ref to modal wrapper for class toggling
 *  - shouldShowParticipantControls (func)
 *  - renderSingleTile (func)
 *  - onParticipantSelectionChange (func)
 *  - participants (array)
 *  - employeeOptions (array)
 *  - initialSelectionForChild (array)
 *
 * This file preserves the UI & behaviour from the original component while
 * adding "use client" for Next.js app-router usage.
 */

const iconMap = {
  Transportation: <MdEmojiTransportation className="claim-icons" />,
  Meals: <GiKnifeFork className="claim-icons" />,
  Telecommunication: <MdOutlinePhoneAndroid className="claim-icons" />,
  Stationary: <GiPencilBrush className="claim-icons" />,
  Miscellaneous: <TbTriangleSquareCircle className="claim-icons" />,
};

const ClaimFields = ({
  claimTypes = [],
  projects = [],
  formData = {},
  setFormData = () => {},
  selectedFiles = [],
  setSelectedFiles = () => {},
  handleFileUpload,
  setSelectedSubType,
  selectedSubType,
  modalContentRef,
  shouldShowParticipantControls,
  renderSingleTile,
  onParticipantSelectionChange,
  participants = [],
  employeeOptions = [],
  initialSelectionForChild = [],
}) => {
  const [localParticipantMode, setLocalParticipantMode] = useState(
    formData.participant_mode || "single"
  );

  const maxDate = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  useEffect(() => {
    setLocalParticipantMode(formData.participant_mode || "single");
  }, [formData.participant_mode]);

  useEffect(() => {
    const ct = formData.claim_type;
    if (!ct) return;

    if (!formData.claim_rows || typeof formData.claim_rows !== "object") {
      setFormData((p) => ({ ...p, claim_rows: {} }));
      return;
    }

    const rows = Array.isArray(formData.claim_rows[ct])
      ? formData.claim_rows[ct]
      : [];

    if (!Array.isArray(rows) || rows.length === 0) {
      const seed = defaultRowForType(ct);
      if (formData.purpose) seed.purpose = formData.purpose;
      if (Array.isArray(selectedFiles) && selectedFiles.length > 0)
        seed.attachments = selectedFiles.slice();

      setFormData((p) => ({
        ...p,
        claim_rows: { ...(p.claim_rows || {}), [ct]: [seed] },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.claim_type]);

  const updateField = (k, v) => setFormData((prev) => ({ ...prev, [k]: v }));

  const ensureRowsForCurrentType = () => {
    const ct = formData.claim_type;
    if (!ct) return [];
    const rowsObj =
      formData.claim_rows && typeof formData.claim_rows === "object"
        ? formData.claim_rows
        : {};
    return Array.isArray(rowsObj[ct]) ? rowsObj[ct] : [];
  };

  const setRowsForCurrentType = (newRows) => {
    const ct = formData.claim_type;
    setFormData((prev) => ({
      ...prev,
      claim_rows: { ...(prev.claim_rows || {}), [ct]: newRows },
    }));
  };

  const defaultRowForType = (type) => {
    const base = {
      purpose: "",
      attachments: [],
      invoices: [],
      total_amount: "",
    };
    switch (type) {
      case "Transportation":
        return {
          ...base,
          travel_from: "",
          travel_to: "",
          transport_amount: "",
          accommodation_fees: "",
          da: "",
        };
      case "Meals":
        return {
          ...base,
          meal_type: "",
          meals_objective: "",
        };
      case "Telecommunication":
        return {
          ...base,
          service_provider: "",
        };
      case "Stationary":
        return {
          ...base,
          stationary: "",
          purchasing_item: "",
        };
      case "Miscellaneous":
        return {
          ...base,
        };
      default:
        return { ...base };
    }
  };

  const addRow = (afterIndex = null) => {
    const ct = formData.claim_type;
    if (!ct) return;
    const rows = ensureRowsForCurrentType().slice();
    const newRow = defaultRowForType(ct);
    if (afterIndex === null || afterIndex >= rows.length - 1) rows.push(newRow);
    else rows.splice(afterIndex + 1, 0, newRow);
    setRowsForCurrentType(rows);
  };

  const removeRow = (idx) => {
    const rows = ensureRowsForCurrentType().slice();
    if (idx < 0 || idx >= rows.length) return;
    rows.splice(idx, 1);
    setRowsForCurrentType(rows);
  };

  const updateRow = (idx, key, value) => {
    const rows = ensureRowsForCurrentType().slice();
    if (idx < 0) return;
    if (rows.length === 0 && idx === 0) {
      rows[0] = defaultRowForType(formData.claim_type);
    }
    if (idx >= rows.length) return;
    rows[idx] = { ...(rows[idx] || {}), [key]: value };
    setRowsForCurrentType(rows);

    if (idx === 0) {
      if (key === "purpose") updateField("purpose", value);
      if (key === "attachments") {
        setSelectedFiles && setSelectedFiles(value);
      }
    }
  };

  const handleInvoiceChangeInRow = (rowIdx, invIdx, value) => {
    const rows = ensureRowsForCurrentType().slice();
    if (rowIdx < 0 || rowIdx >= rows.length) return;
    const invs = [String(value || "").trim()];
    updateRow(rowIdx, "invoices", invs);
  };

  const handleRowFileChange = (rowIdx, e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const names = files.map((f) => f.name);

    updateRow(rowIdx, "attachments", names);

    const rows = ensureRowsForCurrentType().slice();
    rows[rowIdx] = { ...(rows[rowIdx] || {}), _files: files };
    setRowsForCurrentType(rows);

    if (typeof handleFileUpload === "function") {
      try {
        handleFileUpload(e, { rowIndex: rowIdx, files });
      } catch {}
    }
  };

  const handleMainFileChange = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const names = files.map((f) => f.name);
    setSelectedFiles && setSelectedFiles(names);
    const rows = ensureRowsForCurrentType().slice();
    if (rows.length === 0) {
      rows[0] = defaultRowForType(formData.claim_type);
    }
    rows[0] = { ...(rows[0] || {}), attachments: names };
    setRowsForCurrentType(rows);
    if (typeof handleFileUpload === "function") {
      try {
        handleFileUpload(e, { rowIndex: null });
      } catch {}
    }
  };

  const handleTransportSubTypeChange = (type) => {
    updateField("transport_type", type);
    setSelectedSubType && setSelectedSubType(type);
    const modalEl = modalContentRef?.current;
    if (modalEl) {
      modalEl.classList.add("transport-claim");
      modalEl.classList.add("subtype-selected");
    }
  };

  const onParticipantModeChange = (mode) => {
    setLocalParticipantMode(mode);
    setFormData((prev) => ({ ...prev, participant_mode: mode }));

    const modalEl = modalContentRef?.current;
    if (modalEl) {
      if (mode === "group") modalEl.classList.add("show-participants");
      else modalEl.classList.remove("show-participants");
    }

    if (
      mode === "single" &&
      typeof onParticipantSelectionChange === "function"
    ) {
      const empId =
        formData.employeeId || employeeOptions?.[0]?.employee_id || null;

      if (empId) {
        onParticipantSelectionChange([{ employee_id: empId }]);
      }
    }
  };

  const computeOutstationRowTotal = (row) => {
    const ta = parseFloat(row.transport_amount) || 0;
    const af = parseFloat(row.accommodation_fees) || 0;
    const da = parseFloat(row.da) || 0;
    const total = ta + af + da;
    return Number.isFinite(total) ? Number(total) : 0;
  };

  const handleOutstationFieldChange = (idx, key, value) => {
    const rows = ensureRowsForCurrentType().slice();
    if (idx < 0 || idx >= rows.length) return;

    const updatedRow = {
      ...(rows[idx] || {}),
      [key]: value,
    };

    const computed = computeOutstationRowTotal(updatedRow);

    rows[idx] = {
      ...updatedRow,
      total_amount: computed.toFixed(2),
    };

    setRowsForCurrentType(rows);
  };

  const handleTransportAmountChange = (idx, value) => {
    if (formData.transport_type === "Outstation") {
      handleOutstationFieldChange(idx, "transport_amount", value);
    } else {
      updateRow(idx, "transport_amount", value);
    }
  };
  const handleAccommodationChange = (idx, value) => {
    if (formData.transport_type === "Outstation") {
      handleOutstationFieldChange(idx, "accommodation_fees", value);
    } else {
      updateRow(idx, "accommodation_fees", value);
    }
  };
  const handleDaChange = (idx, value) => {
    if (formData.transport_type === "Outstation") {
      handleOutstationFieldChange(idx, "da", value);
    } else {
      updateRow(idx, "da", value);
    }
  };

  const handleTotalAmountChange = (idx, value) => {
    updateRow(idx, "total_amount", value);
  };

  const overallTotal = useMemo(() => {
    const rows = ensureRowsForCurrentType();
    if (!Array.isArray(rows) || rows.length === 0) return "0.00";
    const sum = rows.reduce((acc, r) => {
      const val = parseFloat(r && r.total_amount) || 0;
      return acc + val;
    }, 0);
    return sum.toFixed(2);
  }, [formData.claim_rows, formData.claim_type, formData.transport_type]);

  const handleClaimTypeSelect = (label) => {
    setFormData((prev) => {
      const newPrev = {
        ...prev,
        claim_type: label,
        participants: [],
        participant_mode: "single",
      };

      const rowsObj =
        newPrev.claim_rows && typeof newPrev.claim_rows === "object"
          ? { ...newPrev.claim_rows }
          : {};
      if (!Array.isArray(rowsObj[label]) || rowsObj[label].length === 0) {
        const seed = defaultRowForType(label);
        if (newPrev.purpose) seed.purpose = newPrev.purpose;
        if (Array.isArray(selectedFiles) && selectedFiles.length > 0)
          seed.attachments = selectedFiles.slice();

        rowsObj[label] = [seed];
      }
      newPrev.claim_rows = rowsObj;
      return newPrev;
    });

    if (typeof onParticipantSelectionChange === "function") {
      try {
        onParticipantSelectionChange([]);
      } catch (e) {
        console.warn("onParticipantSelectionChange([]) failed:", e);
      }
    }

    setLocalParticipantMode("single");

    const modalEl = modalContentRef?.current;
    if (modalEl) {
      modalEl.classList.remove("show-participants");
    }
  };

  const renderDateFields = (claimType, isMainRow) => {
    if (!isMainRow) return null;

    if (claimType === "Transportation") {
      if (formData.transport_type === "Outstation") {
        return (
          <>
            <div className="field">
              <label>From Date</label>
              <input
                type="date"
                name="fromDate"
                value={formData.fromDate || ""}
                max={maxDate}
                onChange={(e) => updateField("fromDate", e.target.value)}
              />
            </div>
            <div className="field">
              <label>To Date</label>
              <input
                type="date"
                name="toDate"
                value={formData.toDate || ""}
                max={maxDate}
                onChange={(e) => updateField("toDate", e.target.value)}
              />
            </div>
          </>
        );
      } else if (formData.no_of_days === "single") {
        return (
          <div className="field">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date || ""}
              max={maxDate}
              onChange={(e) => updateField("date", e.target.value)}
            />
          </div>
        );
      } else if (formData.no_of_days === "multiple") {
        return (
          <>
            <div className="field">
              <label>From Date</label>
              <input
                type="date"
                name="fromDate"
                value={formData.fromDate || ""}
                max={maxDate}
                onChange={(e) => updateField("fromDate", e.target.value)}
              />
            </div>
            <div className="field">
              <label>To Date</label>
              <input
                type="date"
                name="toDate"
                value={formData.toDate || ""}
                max={maxDate}
                onChange={(e) => updateField("toDate", e.target.value)}
              />
            </div>
          </>
        );
      }
      return null;
    }

    return (
      <div className="field">
        <label>Date</label>
        <input
          type="date"
          name="date"
          value={formData.date || ""}
          max={maxDate}
          onChange={(e) => updateField("date", e.target.value)}
        />
      </div>
    );
  };

  const renderRowsUI = () => {
    const rows = ensureRowsForCurrentType();
    const ct = formData.claim_type;
    if (!ct) return null;
    if (!Array.isArray(rows) || rows.length === 0) {
      return null;
    }

    return (
      <div className="line-items">
        <div className="rb-form-grid">
          {rows.map((row, idx) => {
            const isMain = idx === 0;
            const val = (key) =>
              row && Object.prototype.hasOwnProperty.call(row, key)
                ? row[key]
                : "";

            const isOutstation =
              ct === "Transportation" &&
              formData.transport_type === "Outstation";

            return (
              <div
                className={`row-item ${isMain ? "main-row" : "child-row"}`}
                key={`row-${idx}`}
              >
                <div className="row-header">
                  {renderDateFields(ct, isMain)}

                  {ct === "Transportation" && (
                    <>
                      <div className="field">
                        <label>Travel From</label>
                        <input
                          type="text"
                          name={`travel_from_${idx}`}
                          value={val("travel_from") || ""}
                          onChange={(e) =>
                            isMain
                              ? (updateRow(idx, "travel_from", e.target.value),
                                updateField("travel_from", e.target.value))
                              : updateRow(idx, "travel_from", e.target.value)
                          }
                        />
                      </div>

                      <div className="field">
                        <label>Travel To</label>
                        <input
                          type="text"
                          name={`travel_to_${idx}`}
                          value={val("travel_to") || ""}
                          onChange={(e) =>
                            isMain
                              ? (updateRow(idx, "travel_to", e.target.value),
                                updateField("travel_to", e.target.value))
                              : updateRow(idx, "travel_to", e.target.value)
                          }
                        />
                      </div>

                      {isOutstation && (
                        <>
                          <div className="field">
                            <label>Transport Amount</label>
                            <input
                              type="number"
                              name={`transport_amount_${idx}`}
                              value={val("transport_amount") || ""}
                              onChange={(e) =>
                                handleTransportAmountChange(idx, e.target.value)
                              }
                            />
                          </div>

                          <div className="field">
                            <label>Accommodation Fees</label>
                            <input
                              type="number"
                              name={`accommodation_fees_${idx}`}
                              value={val("accommodation_fees") || ""}
                              onChange={(e) =>
                                handleAccommodationChange(idx, e.target.value)
                              }
                            />
                          </div>

                          <div className="field">
                            <label>DA</label>
                            <input
                              type="number"
                              name={`da_${idx}`}
                              value={val("da") || ""}
                              onChange={(e) =>
                                handleDaChange(idx, e.target.value)
                              }
                            />
                          </div>
                        </>
                      )}

                      <div className="field">
                        <label>Total Amount</label>
                        <input
                          type="number"
                          name={`total_amount_${idx}`}
                          value={
                            val("total_amount") !== undefined
                              ? val("total_amount")
                              : ""
                          }
                          onChange={(e) =>
                            !isOutstation
                              ? handleTotalAmountChange(idx, e.target.value)
                              : undefined
                          }
                          placeholder="0.00"
                          readOnly={isOutstation}
                          className={isOutstation ? "total-readonly" : ""}
                        />
                      </div>
                    </>
                  )}

                  {ct === "Meals" && (
                    <>
                      <div className="field">
                        <label>Meal Type</label>
                        <select
                          name={`meal_type_${idx}`}
                          value={val("meal_type") || ""}
                          onChange={(e) =>
                            updateRow(idx, "meal_type", e.target.value)
                          }
                        >
                          <option value="">Select</option>
                          <option value="breakfast">Break Fast</option>
                          <option value="lunch">Lunch</option>
                          <option value="dinner">Dinner</option>
                          <option value="Full Day">Full Day</option>
                        </select>
                      </div>

                      <div className="field">
                        <label>Meal's objective</label>
                        <select
                          name={`meals_objective_${idx}`}
                          value={val("meals_objective") || ""}
                          onChange={(e) =>
                            updateRow(idx, "meals_objective", e.target.value)
                          }
                        >
                          <option value="">Select</option>
                          <option value="client_visit">Client Visit</option>
                          <option value="team_outing">Team Outing</option>
                          <option value="extended_work">Extended</option>
                          <option value="others">Others</option>
                        </select>
                      </div>

                      <div className="field">
                        <label>Total Amount</label>
                        <input
                          type="number"
                          name={`total_amount_${idx}`}
                          value={val("total_amount") || ""}
                          onChange={(e) =>
                            handleTotalAmountChange(idx, e.target.value)
                          }
                        />
                      </div>
                    </>
                  )}

                  {ct === "Telecommunication" && (
                    <>
                      <div className="field">
                        <label>Service Provider</label>
                        <input
                          type="text"
                          name={`service_provider_${idx}`}
                          value={val("service_provider") || ""}
                          onChange={(e) =>
                            updateRow(idx, "service_provider", e.target.value)
                          }
                        />
                      </div>
                      <div className="field">
                        <label>Total Amount</label>
                        <input
                          type="number"
                          name={`total_amount_${idx}`}
                          value={val("total_amount") || ""}
                          onChange={(e) =>
                            handleTotalAmountChange(idx, e.target.value)
                          }
                        />
                      </div>
                    </>
                  )}

                  {ct === "Stationary" && (
                    <>
                      <div className="field">
                        <label>Stationary</label>
                        <select
                          name={`stationary_${idx}`}
                          value={val("stationary") || ""}
                          onChange={(e) =>
                            updateRow(idx, "stationary", e.target.value)
                          }
                        >
                          <option value="">Select</option>
                          <option value="office equipments">
                            Office Equipments
                          </option>
                          <option value="general stationary">
                            General Stationary
                          </option>
                        </select>
                      </div>
                      <div className="field">
                        <label>Purchasing Items</label>
                        <input
                          type="text"
                          name={`purchasing_item_${idx}`}
                          value={val("purchasing_item") || ""}
                          onChange={(e) =>
                            updateRow(idx, "purchasing_item", e.target.value)
                          }
                        />
                      </div>
                      <div className="field">
                        <label>Total Amount</label>
                        <input
                          type="number"
                          name={`total_amount_${idx}`}
                          value={val("total_amount") || ""}
                          onChange={(e) =>
                            handleTotalAmountChange(idx, e.target.value)
                          }
                        />
                      </div>
                    </>
                  )}

                  {ct === "Miscellaneous" && (
                    <div className="field">
                      <label>Total Amount</label>
                      <input
                        type="number"
                        name={`total_amount_${idx}`}
                        value={val("total_amount") || ""}
                        onChange={(e) =>
                          handleTotalAmountChange(idx, e.target.value)
                        }
                      />
                    </div>
                  )}

                  <div className={`field purpose-inline`}>
                    <label>{isMain ? "Purpose" : "Purpose / Comments"}</label>
                    {isMain ? (
                      <input
                        type="text"
                        name={`purpose_${idx}`}
                        value={val("purpose") || ""}
                        onChange={(e) => (
                          updateRow(idx, "purpose", e.target.value),
                          updateField("purpose", e.target.value)
                        )}
                        placeholder="Purpose / Comments"
                      />
                    ) : (
                      <input
                        type="text"
                        name={`purpose_${idx}`}
                        value={val("purpose") || ""}
                        onChange={(e) =>
                          updateRow(idx, "purpose", e.target.value)
                        }
                        placeholder="Purpose / Comments"
                      />
                    )}
                  </div>

                  <div className={`field attachment-inline`}>
                    <label>Attachment</label>
                    <div className="attachment-inline-wrapper">
                      <div className="file-links-inline">
                        {Array.isArray(row.attachments) &&
                        row.attachments.length > 0 ? (
                          row.attachments.map((n, i) => (
                            <span key={i} className="file-name-inline">
                              {n}
                            </span>
                          ))
                        ) : (
                          <span className="file-name-inline">No files</span>
                        )}
                      </div>
                      <input
                        type="file"
                        multiple
                        id={`fileInput-row-${idx}-inline`}
                        className="hidden-file-input"
                        onChange={(e) => handleRowFileChange(idx, e)}
                      />
                      <label
                        htmlFor={`fileInput-row-${idx}-inline`}
                        className="custom-file-upload small"
                      >
                        Browse
                      </label>
                    </div>
                  </div>

                  <div className={`field invoice-inline`}>
                    <label>Invoice</label>
                    <div className="invoice-inline-row">
                      <input
                        type="text"
                        className="invoice-input"
                        name={`invoice_${idx}_0`}
                        value={
                          (Array.isArray(row.invoices) && row.invoices[0]) || ""
                        }
                        onChange={(e) =>
                          handleInvoiceChangeInRow(idx, 0, e.target.value)
                        }
                        placeholder="Invoice / Transaction #"
                      />
                    </div>
                  </div>
                </div>

                <div className="row-actions" style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    className="remove-row-btn"
                    onClick={() => removeRow(idx)}
                    aria-label={`Remove line ${idx + 1}`}
                  >
                    - Remove
                  </button>
                  <button
                    type="button"
                    className="insert-row-btn"
                    onClick={() => addRow(idx)}
                    aria-label={`Insert new row after ${idx + 1}`}
                  >
                    + Insert
                  </button>
                </div>
              </div>
            );
          })}

          <div className="rows-total">
            <div className="rows-total-left" />
            <div className="rows-total-right">
              <label>Total</label>
              <div className="rows-total-value">₹ {overallTotal}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderClaimSpecificFields = () => {
    switch (formData.claim_type) {
      case "Transportation":
        return (
          <>
            <div className="sub-tabs">
              {["Outstation", "Intercity", "Fuel"].map((type) => (
                <div
                  key={type}
                  className={`sub-tab ${
                    formData.transport_type === type ? "active" : ""
                  }`}
                  onClick={() => handleTransportSubTypeChange(type)}
                  data-subtype={type}
                >
                  {type}
                </div>
              ))}
            </div>

            {(formData.transport_type === "Intercity" ||
              formData.transport_type === "Fuel") && (
              <div className="rb-radio">
                <label>Select no of days</label>
                <div className="rb-radio-options">
                  <label>
                    <input
                      type="radio"
                      name="no_of_days"
                      value="single"
                      checked={formData.no_of_days === "single"}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          no_of_days: e.target.value,
                        }))
                      }
                    />
                    Single
                  </label>

                  <label>
                    <input
                      type="radio"
                      name="no_of_days"
                      value="multiple"
                      checked={formData.no_of_days === "multiple"}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          no_of_days: e.target.value,
                        }))
                      }
                    />
                    Multiple
                  </label>
                </div>
              </div>
            )}

            {formData.transport_type && (
              <div className="rb-main-form">{renderRowsUI()}</div>
            )}
          </>
        );

      case "Meals":
      case "Telecommunication":
      case "Stationary":
      case "Miscellaneous":
        return <div className="rb-main-form">{renderRowsUI()}</div>;

      default:
        return null;
    }
  };

  return (
    <>
      <div className="claim-type">
        <label>
          Project<span className="asterisk">*</span>
        </label>
        <select
          name="project"
          value={formData.project || ""}
          onChange={(e) =>
            setFormData((p) => ({ ...p, project: e.target.value }))
          }
          required
        >
          <option value="">Select project</option>
          <option value="STS CLAIM">STS CLAIM</option>
          {projects.map((proj, i) => (
            <option key={i} value={proj}>
              {proj}
            </option>
          ))}
        </select>

        <div className="rb-tabs" role="tablist" aria-label="Claim types">
          {claimTypes.map(({ label }) => (
            <div
              key={label}
              className={`rb-tab ${
                formData.claim_type === label ? "active" : ""
              }`}
              onClick={() => handleClaimTypeSelect(label)}
              role="tab"
              aria-selected={formData.claim_type === label}
            >
              {iconMap[label]} {label}
            </div>
          ))}
        </div>

        {typeof shouldShowParticipantControls === "function" &&
          shouldShowParticipantControls() && (
            <div className="participant-controls-wrapper">
              <div className="participant-mode-toggle">
                <label className="ps-mode-label">
                  <input
                    type="radio"
                    name="pmode"
                    checked={localParticipantMode === "single"}
                    onChange={() => onParticipantModeChange("single")}
                  />
                  <span className="ps-mode-text">Single</span>
                </label>
                <label className="ps-mode-label">
                  <input
                    type="radio"
                    name="pmode"
                    checked={localParticipantMode === "group"}
                    onChange={() => onParticipantModeChange("group")}
                  />
                  <span className="ps-mode-text">Group</span>
                </label>
              </div>

              {localParticipantMode === "single" ? (
                <div className="participant-single-inline">
                  {typeof renderSingleTile === "function"
                    ? renderSingleTile()
                    : null}
                </div>
              ) : (
                <ParticipantSelection
                  departmentId={formData.department_id || ""}
                  selectionMode="group"
                  value={participants}
                  onSelectionChange={(parts) => {
                    if (typeof onParticipantSelectionChange === "function")
                      onParticipantSelectionChange(parts);
                    else setFormData((p) => ({ ...p, participants: parts }));
                  }}
                  initialSelection={initialSelectionForChild || []}
                  limit={500}
                  hideModeToggle={true}
                  employeeOptions={employeeOptions}
                />
              )}
            </div>
          )}
      </div>

      {renderClaimSpecificFields()}
    </>
  );
};

export default ClaimFields;
