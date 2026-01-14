"use client";

import React, { useMemo, useRef, useCallback } from "react";
import { MdOutlineCancel } from "react-icons/md";
import ClaimFields from "./ClaimFields.client";
import "./Reimbursement.css";
import "./ParticipantSelection.css";
import { useAuth } from "../../context/AuthProvider.client";

const ReimbursementForm = (props) => {
  const {
    projects = [],
    claimTypes = [],
    formData = {},
    setFormData,
    shouldShowParticipantControls = () => false,
    renderSingleTile,
    onParticipantSelectionChange,
    employeeOptions = [],
    handleFileUpload,
    handleTransportSubTypeChange,
    selectedFiles = [],
    setSelectedFiles,
    handleSubmit,
    editingId,
    setShowForm,
    participants = [],
  } = props;

  const { user } = useAuth();

  const buildHeaders = useCallback(() => {
    const headers = {};
    const apiKey =
      process.env.NEXT_PUBLIC_API_KEY || process.env.REACT_APP_API_KEY || "";
    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");
    if (apiKey) headers["x-api-key"] = apiKey;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const actorId =
      user?.employeeId ||
      user?.id ||
      (() => {
        try {
          const raw = localStorage.getItem("dashboardData");
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          return (
            parsed?.employeeId || parsed?.employee_id || parsed?.id || null
          );
        } catch (e) {
          return null;
        }
      })();
    if (actorId) headers["x-employee-id"] = String(actorId);

    const orgId =
      user?.orgId ||
      user?.raw?.org_id ||
      user?.org_id ||
      user?.organization_id ||
      localStorage.getItem("x-org-id") ||
      localStorage.getItem("orgId") ||
      null;
    if (orgId) headers["x-org-id"] = String(orgId);

    return headers;
  }, [user]);

  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
  const formRef = useRef(null);
  const modalContentRef = useRef(null);

  const { cleanedInvoices, hasEmptyInvoice, duplicateInvoice } = useMemo(() => {
    const ct = formData.claim_type;
    const raw = [];

    const pushRaw = (v) => {
      if (v === undefined || v === null) return;
      raw.push(String(v).trim());
    };

    if (Array.isArray(formData.invoices)) {
      formData.invoices.forEach(pushRaw);
    } else if (formData.invoices !== undefined) {
      pushRaw(formData.invoices);
    }

    if (ct && formData.claim_rows && Array.isArray(formData.claim_rows[ct])) {
      for (const r of formData.claim_rows[ct]) {
        if (Array.isArray(r?.invoices)) {
          r.invoices.forEach(pushRaw);
        } else if (r?.invoices !== undefined) {
          pushRaw(r.invoices);
        }
      }
    }

    const cleaned = raw.map((i) =>
      i === undefined || i === null ? "" : String(i).trim()
    );

    const hasEmpty = cleaned.some((c) => c === "");

    const seen = new Set();
    let dup = null;
    for (const c of cleaned) {
      if (!c) continue;
      const k = c.toLowerCase();
      if (seen.has(k)) {
        dup = c;
        break;
      }
      seen.add(k);
    }

    const nonEmpty = cleaned.filter(Boolean);

    return {
      cleanedInvoices: nonEmpty,
      hasEmptyInvoice: hasEmpty,
      duplicateInvoice: dup,
    };
  }, [formData.invoices, formData.claim_rows, formData.claim_type]);

  let invoicesValid;
  if (cleanedInvoices.length === 0) {
    invoicesValid = !hasEmptyInvoice;
  } else {
    invoicesValid = !hasEmptyInvoice && !duplicateInvoice;
  }

  const initialSelectionForChild = useMemo(() => {
    if (!Array.isArray(participants)) return [];
    return participants
      .filter(Boolean)
      .map((p) => {
        if (typeof p === "object") {
          return {
            employee_id: p.employee_id || p.id || p.employeeId,
            name: p.name || p.employee_name || "",
          };
        }
        const found = (employeeOptions || []).find(
          (e) =>
            String(e.employee_id) === String(p) ||
            String(e.id) === String(p) ||
            String(e.empId) === String(p)
        );
        return {
          employee_id: p,
          name: found ? found.name : String(p),
        };
      })
      .filter((x) => x.employee_id);
  }, [participants, employeeOptions]);

  const onFormSubmit = (e) => {
    if (invoicesValid) {
      handleSubmit(e);
      return;
    }

    e.preventDefault();

    const formEl = formRef.current;
    if (!formEl) return;

    if (duplicateInvoice || hasEmptyInvoice) {
      const ct = formData.claim_type;
      const mainInvs = Array.isArray(formData.invoices)
        ? formData.invoices
        : formData.invoices
        ? [formData.invoices]
        : [];

      for (let i = 0; i < mainInvs.length; i++) {
        const v = (mainInvs[i] || "").toString().trim();
        const input =
          formEl.querySelector(`[name="invoice_main_${i}"]`) ||
          formEl.querySelector(".invoice-input");

        if (hasEmptyInvoice && v === "" && input) {
          input.reportValidity?.();
          input.focus?.();
          return;
        }

        if (
          duplicateInvoice &&
          v.toLowerCase() === duplicateInvoice.toLowerCase() &&
          input
        ) {
          input.setCustomValidity(
            `Duplicate invoice in form: "${duplicateInvoice}"`
          );
          input.reportValidity?.();
          input.focus?.();
          setTimeout(() => input.setCustomValidity(""), 1500);
          return;
        }
      }

      if (ct && Array.isArray(formData.claim_rows?.[ct])) {
        for (let r = 0; r < formData.claim_rows[ct].length; r++) {
          const invs = Array.isArray(formData.claim_rows[ct][r].invoices)
            ? formData.claim_rows[ct][r].invoices
            : [];

          for (let j = 0; j < invs.length; j++) {
            const v = (invs[j] || "").toString().trim();
            const input =
              formEl.querySelector(`[name="invoice_${r}_${j}"]`) ||
              formEl.querySelector(".invoice-input");

            if (hasEmptyInvoice && v === "" && input) {
              input.reportValidity?.();
              input.focus?.();
              return;
            }

            if (
              duplicateInvoice &&
              v.toLowerCase() === duplicateInvoice.toLowerCase() &&
              input
            ) {
              input.setCustomValidity(
                `Duplicate invoice in form: "${duplicateInvoice}"`
              );
              input.reportValidity?.();
              input.focus?.();
              setTimeout(() => input.setCustomValidity(""), 1500);
              return;
            }
          }
        }
      }
    }

    formEl.reportValidity?.();
  };

  return (
    <div className="rb-modal">
      <div ref={modalContentRef} className="rb-modal-content">
        <div className="claim-form-header">
          <h2 className="claim-form-title">
            {editingId ? "Edit Reimbursement" : "New Reimbursement"}
          </h2>
          <MdOutlineCancel
            className="claim-form-close"
            onClick={() => setShowForm(false)}
          />
        </div>

        <form
          ref={formRef}
          className="reimbursement-form"
          onSubmit={onFormSubmit}
        >
          <ClaimFields
            claimTypes={claimTypes}
            projects={projects}
            formData={formData}
            setFormData={setFormData}
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
            handleFileUpload={handleFileUpload}
            setSelectedSubType={handleTransportSubTypeChange}
            selectedSubType={formData.transport_type}
            modalContentRef={modalContentRef}
            shouldShowParticipantControls={shouldShowParticipantControls}
            renderSingleTile={renderSingleTile}
            onParticipantSelectionChange={onParticipantSelectionChange}
            participants={participants}
            employeeOptions={employeeOptions}
            initialSelectionForChild={initialSelectionForChild}
          />

          <div className="reimbursement-form-button">
            <button
              type="button"
              className="rb-close"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>

            <button type="submit" className="rb-submit">
              {editingId ? "Update" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReimbursementForm;
