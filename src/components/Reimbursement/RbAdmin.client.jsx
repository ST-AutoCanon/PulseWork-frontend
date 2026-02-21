"use client";

import React, { useEffect, useState, useCallback } from "react";
import "./RbAdmin.css";
import { MdOutlineRemoveRedEye, MdOutlineCancel } from "react-icons/md";
import { FaSearch, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { FaFileInvoice } from "react-icons/fa6";
import axios from "axios";
import Reimbursement from "./Reimbursement.client";
import Modal from "../Modal/Modal.client";
import ParticipantSelection from "./ParticipantSelection.client";
import { useAuth } from "../../context/AuthProvider.client";

/**
 * RbAdmin (Next.js client component)
 *
 * Notes:
 *  - No localStorage usage — uses useAuth() only.
 *  - Attempts to resolve orgId from profile endpoints if missing.
 *  - Will NOT call /reimbursements if orgId cannot be resolved (avoids backend 500).
 */

const RbAdmin = () => {
  const { user } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [expandedClaims, setExpandedClaims] = useState({});
  const [submittedFrom, setSubmittedFrom] = useState("");
  const [submittedTo, setSubmittedTo] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [statusUpdates, setStatusUpdates] = useState({});
  const [paymentStatusUpdates, setPaymentStatusUpdates] = useState({});
  const [comments, setComments] = useState({});
  const [statusFilter, setStatusFilter] = useState("pending");
  const employeeData = (user && (user.raw || user.dashboard)) || {};
  const employeeId = user?.employeeId || employeeData?.employeeId || null;
  const rawUserRole = user?.role || user?.raw?.role || "";
  const userRole = (rawUserRole || "").toString().toLowerCase();
  const isHR = userRole === "hr";
  const departmentId =
    user?.raw?.department_id ||
    user?.department_id ||
    user?.raw?.deptId ||
    user?.deptId ||
    employeeData?.department_id ||
    null;

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentClaim, setSelectedPaymentClaim] = useState(null);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState("");
  const [view, setView] = useState("all");
  const [projects, setProjects] = useState([]);
  const [projectSelections, setProjectSelections] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [participantsForEdit, setParticipantsForEdit] = useState([]);
  const [participantsSaving, setParticipantsSaving] = useState(false);

  const backendBase =
    process.env.NEXT_PUBLIC_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;

  const apiKey =
    process.env.NEXT_PUBLIC_API_KEY || process.env.REACT_APP_API_KEY || "";

  const authToken = user?.raw?.token || user?.token || user?.authToken || "";

  const [orgId, setOrgId] = useState(
    user?.orgId ||
      user?.raw?.org_id ||
      user?.org_id ||
      user?.organization_id ||
      null,
  );
  const [orgResolveTried, setOrgResolveTried] = useState(false);
  const [resolvingOrg, setResolvingOrg] = useState(false);

  const formatDisplayDate = (raw) => {
    if (!raw) return " ";
    const d = raw instanceof Date ? raw : new Date(raw);
    if (isNaN(d)) return raw;
    const day = String(d.getDate()).padStart(2, "0");
    const mon = d.toLocaleString("en-GB", { month: "short" });
    const year = d.getFullYear();
    return `${day}-${mon}-${year}`;
  };

  const formatRange = (from, to) => {
    const f = formatDisplayDate(from);
    const t = formatDisplayDate(to);
    if ((!f || f === " ") && (!t || t === " ")) return " ";
    if (f && t && f !== t) return `${f} - ${t}`;
    return f || t || " ";
  };

  const resolveDateDisplay = (payload = {}, claim = {}) => {
    try {
      if (payload) {
        if (typeof payload === "string" && payload.trim()) {
          const parts = payload
            .replace(/\u2013|\u2014/g, "-")
            .split(/\s*[-–—]\s*/);
          if (parts.length >= 2)
            return `${formatDisplayDate(parts[0])} - ${formatDisplayDate(
              parts[1],
            )}`;
        } else if (
          typeof payload.date_range === "string" &&
          payload.date_range.trim()
        ) {
          const parts = payload.date_range
            .replace(/\u2013|\u2014/g, "-")
            .split(/\s*[-–—]\s*/);
          if (parts.length >= 2)
            return `${formatDisplayDate(parts[0])} - ${formatDisplayDate(
              parts[1],
            )}`;
        }

        if (payload.from_date || payload.to_date) {
          return formatRange(payload.from_date, payload.to_date);
        }

        if (Array.isArray(payload.dates) && payload.dates.length) {
          return payload.dates.map(formatDisplayDate).join(", ");
        }

        if (payload.date) return formatDisplayDate(payload.date);
      }

      if (claim) {
        if (typeof claim.date_range === "string" && claim.date_range.trim()) {
          const parts = claim.date_range
            .replace(/\u2013|\u2014/g, "-")
            .split(/\s*[-–—]\s*/);
          if (parts.length >= 2)
            return `${formatDisplayDate(parts[0])} - ${formatDisplayDate(
              parts[1],
            )}`;
        }

        if (claim.from_date || claim.to_date) {
          return formatRange(claim.from_date, claim.to_date);
        }

        if (claim.date) return formatDisplayDate(claim.date);
      }

      return " ";
    } catch (e) {
      return " ";
    }
  };

  const parseInvoicesFromClaim = (claimOrInv) => {
    let invs = claimOrInv || [];
    try {
      if (typeof invs === "object" && Array.isArray(invs))
        return invs.map((i) => String(i).trim()).filter(Boolean);
      if (typeof invs === "string" && invs.trim()) {
        try {
          const parsed = JSON.parse(invs);
          if (Array.isArray(parsed))
            return parsed.map((i) => String(i).trim()).filter(Boolean);
        } catch (_) {
          return invs
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }
      return Array.isArray(invs)
        ? invs.map((i) => String(i).trim()).filter(Boolean)
        : [];
    } catch (e) {
      return [];
    }
  };

  // buildHeaders uses auth & resolved orgId only (no localStorage)
  const buildHeaders = useCallback(() => {
    const h = {};
    if (apiKey) h["x-api-key"] = apiKey;

    const actorId =
      user?.employeeId ||
      user?.id ||
      user?.raw?.employee_id ||
      employeeData?.employeeId ||
      null;
    if (actorId) h["x-employee-id"] = String(actorId);

    if (orgId) h["x-org-id"] = String(orgId);
    if (departmentId && !isHR) h["x-department-id"] = String(departmentId);

    if (authToken) h["Authorization"] = `Bearer ${authToken}`;

    return h;
  }, [user, apiKey, authToken, orgId, employeeData, departmentId, isHR]);

  // resolve org id from backend profile endpoints (only when needed)
  const resolveOrgIdOnce = useCallback(async () => {
    if (orgId) return orgId;
    if (orgResolveTried) return orgId;
    if (!backendBase) {
      setOrgResolveTried(true);
      return null;
    }
    if (resolvingOrg) return null;
    setResolvingOrg(true);

    const candidatePaths = [
      "/me",
      "/profile",
      "/user/profile",
      "/auth/me",
      "/user",
    ];
    let found = null;

    try {
      for (const p of candidatePaths) {
        const url = `${backendBase}${p}`;
        try {
          const headers = {};
          if (authToken) headers.Authorization = `Bearer ${authToken}`;
          if (apiKey) headers["x-api-key"] = apiKey;
          const resp = await axios.get(url, {
            headers,
            withCredentials: true,
          });
          const data = resp?.data;
          if (!data) continue;
          const candidate =
            data.orgId ||
            data.org_id ||
            data.organization_id ||
            (data.organization &&
              (data.organization.id || data.organization.org_id)) ||
            null;
          if (candidate) {
            found = String(candidate);
            break;
          }
          if (data.user) {
            const u = data.user;
            const cand =
              u.orgId ||
              u.org_id ||
              u.organization_id ||
              (u.organization && (u.organization.id || u.organization.org_id));
            if (cand) {
              found = String(cand);
              break;
            }
          }
        } catch (err) {
          // try next endpoint silently
          console.debug(
            "resolveOrgIdOnce: candidate failed",
            p,
            err?.response?.status,
          );
        }
      }
    } catch (e) {
      console.warn("resolveOrgIdOnce unexpected error", e);
    } finally {
      setResolvingOrg(false);
      setOrgResolveTried(true);
    }

    if (found) {
      setOrgId(found);
      console.info("Resolved orgId for requests:", found);
      return found;
    }

    console.warn(
      "Could not resolve orgId from profile endpoints; requests may fail if backend requires x-org-id",
    );
    return null;
  }, [backendBase, authToken, apiKey, orgId, orgResolveTried, resolvingOrg]);

  // Ensure org resolution attempt runs on mount and when orgId changes
  useEffect(() => {
    if (!orgId && !orgResolveTried) {
      resolveOrgIdOnce();
    }
    // on mount we will attempt to fetch projects and employee options once org resolution was attempted
    const init = async () => {
      if (!orgId && !orgResolveTried) await resolveOrgIdOnce();
      await fetchProjects();
      await fetchEmployeeOptions();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, orgResolveTried]);

  const fetchProjects = async () => {
    try {
      if (!orgId && !orgResolveTried) await resolveOrgIdOnce();
      const url = (backendBase ? `${backendBase}` : "") + "/projectdrop";
      const response = await axios.get(url, {
        withCredentials: true,
        headers: buildHeaders(),
      });
      setProjects(response.data || []);
    } catch (error) {
      console.error(
        "Error fetching projects:",
        error?.response?.data || error?.message || error,
      );
    }
  };

  const fetchEmployeeOptions = async () => {
    try {
      if (!orgId && !orgResolveTried) await resolveOrgIdOnce();

      const url =
        (backendBase ? `${backendBase}` : "") + "/reimbursement/employees";
      const resp = await axios.get(url, {
        withCredentials: true,
        headers: buildHeaders(),
      });
      const list = Array.isArray(resp.data)
        ? resp.data
        : resp.data?.data || resp.data || [];
      const mapped = (list || []).map((r) => {
        const id = r.employee_id || r.id || r.employeeId || r.empId;
        const name =
          r.name ||
          r.employee_name ||
          `${r.first_name || ""} ${r.last_name || ""}`.trim();
        return {
          employee_id: id,
          name,
          position: r.position || r.designation || "",
          department_name: r.department_name || "",
        };
      });
      setEmployeeOptions(mapped);
    } catch (err) {
      console.warn(
        "Could not fetch employees for participant selection. Falling back to demo list.",
        err?.response?.data || err?.message || err,
      );
      setEmployeeOptions([
        { employee_id: employeeId || "E000", name: "You", position: "" },
        { employee_id: "E1001", name: "Priya Sharma", position: "Developer" },
        { employee_id: "E1002", name: "Rahul Verma", position: "Analyst" },
      ]);
    }
  };

  const getParticipantNamesForClaim = (claim = {}) => {
    const partRaw =
      claim.participants ||
      claim.participant_ids ||
      claim.participant_names ||
      [];
    let part = [];
    try {
      if (typeof partRaw === "string" && partRaw.trim()) {
        part = JSON.parse(partRaw);
      } else part = Array.isArray(partRaw) ? partRaw : [];
    } catch (e) {
      if (partRaw && typeof partRaw === "string")
        part = partRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      else part = Array.isArray(partRaw) ? partRaw : [];
    }
    if (!part || part.length === 0) {
      if (claim.employee_name) return claim.employee_name;
      return "You";
    }

    const names = part.map((p) => {
      if (typeof p === "object")
        return p.name || p.employee_name || p.employee_id || JSON.stringify(p);
      const found = employeeOptions.find(
        (e) =>
          String(e.employee_id) === String(p) || String(e.id) === String(p),
      );
      if (found) return found.name;
      return String(p);
    });

    return names.join(", ");
  };

  useEffect(() => {
    // initial employees load (safe: will attempt org resolution first)
    const initLoad = async () => {
      if (!orgId && !orgResolveTried) await resolveOrgIdOnce();
      await fetchEmployees();
    };
    initLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // initial employees load

  const getClaimAmount = (claim = {}) => {
    const raw =
      claim?.aggregated_total ??
      claim?.total_amount ??
      claim?.totalAmount ??
      claim?.total ??
      0;
    const n = parseFloat(
      String(raw || "")
        .toString()
        .replace(/,/g, "")
        .trim(),
    );
    return Number.isFinite(n) ? n : 0;
  };

  const fetchEmployees = async () => {
    try {
      // try resolving orgId if we don't have it yet
      if (!orgId && !orgResolveTried) await resolveOrgIdOnce();

      // if orgId is required by backend and still missing, do NOT call the endpoint
      if (!orgId) {
        console.error(
          "fetchEmployees aborted: orgId missing; headers:",
          buildHeaders(),
        );
        showAlert(
          "Organization id (x-org-id) is missing from your session. The backend requires it. Ensure your auth provider returns organization info (orgId / org_id).",
        );
        return;
      }

      const url = (backendBase ? `${backendBase}` : "") + "/reimbursements";
      const response = await axios.get(url, {
        withCredentials: true,
        headers: buildHeaders(),
        params: {
          submittedFrom: submittedFrom || null,
          submittedTo: submittedTo || null,
        },
      });
      const data = response.data || [];
      setEmployees(data);

      const attachmentsMap = {};
      (data || []).forEach((employee) => {
        (employee.claims || []).forEach((claim) => {
          attachmentsMap[claim.id] = claim.attachments || [];
        });
      });
      setAttachments(attachmentsMap);

      const initialProjects = {};
      (data || []).forEach((emp) =>
        (emp.claims || []).forEach((claim) => {
          if (claim.project) {
            initialProjects[claim.id] = claim.project;
          }
        }),
      );
      setProjectSelections(initialProjects);
    } catch (error) {
      console.error(
        "Error fetching employees:",
        error?.response?.data || error?.message || error,
      );
      const backendErrorCode =
        error?.response?.data?.code || error?.response?.data?.error;
      if (
        backendErrorCode &&
        String(backendErrorCode).toLowerCase().includes("org")
      ) {
        showAlert(
          "Server requires organization id (x-org-id). Your session lacks this value.",
        );
      } else {
        showAlert("Error fetching employees.");
      }
    }
  };

  const toggleRow = (employeeId) => {
    setExpandedRows((prev) => ({ ...prev, [employeeId]: !prev[employeeId] }));
  };

  const toggleClaimExpand = (claimId) => {
    setExpandedClaims((prev) => ({ ...prev, [claimId]: !prev[claimId] }));
  };

  const handleOpenAttachments = async (files, claim) => {
    try {
      if (!files || files.length === 0) {
        showAlert("No attachments available.");
        return;
      }

      // Use your buildHeaders() so HR gets x-org-id / Authorization / x-api-key etc.
      const baseHeaders = buildHeaders();

      const fetchedFiles = await Promise.all(
        (files || []).map(async (file) => {
          try {
            // support multiple attachment shapes
            const candidateFilename =
              file.filename ||
              file.file_name ||
              file.name ||
              file.fileName ||
              null;

            // If the server already provided a direct URL, use it (no extra headers)
            if (file.file_path && typeof file.file_path === "string") {
              const urlFromServer = file.file_path;
              // if file_path looks like a full URL use it directly
              if (/^https?:\/\//i.test(urlFromServer)) {
                return {
                  name: candidateFilename || urlFromServer.split("/").pop(),
                  url: urlFromServer,
                };
              }
              // otherwise try to build full URL from backend + file_path
              const fileUrl = `${backendBase || process.env.NEXT_PUBLIC_BACKEND_URL || ""}${urlFromServer}`;
              const resp = await axios.get(fileUrl, {
                withCredentials: true,
                headers: baseHeaders,
                responseType: "blob",
              });
              return {
                name:
                  candidateFilename || fileUrl.split("/").pop() || "attachment",
                url: URL.createObjectURL(
                  new Blob([resp.data], { type: resp.headers["content-type"] }),
                ),
              };
            }

            if (!candidateFilename) return null;

            // Try to extract year/month from filename (some filenames are prefixed with yyyy-mm-dd)
            let match = candidateFilename.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (!match) {
              const match2 = candidateFilename.match(
                /^(\d{4})[-_](\d{2})[-_](\d{2})/,
              );
              if (!match2) {
                // fallback: try search by claim date or just return "not found" for this file
                console.debug(
                  "filename does not contain date prefix, attempting fallback URL",
                  candidateFilename,
                );
                // Fallback: attempt path using claim.created_at or claim.date if available
                const fallbackYear =
                  (claim?.created_at &&
                    new Date(claim.created_at).getFullYear()) ||
                  (claim?.date && new Date(claim.date).getFullYear());
                const fallbackMonth =
                  (claim?.created_at &&
                    String(new Date(claim.created_at).getMonth() + 1).padStart(
                      2,
                      "0",
                    )) ||
                  (claim?.date &&
                    String(new Date(claim.date).getMonth() + 1).padStart(
                      2,
                      "0",
                    ));
                if (fallbackYear && fallbackMonth) {
                  match = [
                    null,
                    String(fallbackYear),
                    String(fallbackMonth),
                    "01",
                  ];
                } else return null;
              } else {
                match = match2;
              }
            }

            const year = match[1];
            const month = match[2];
            const empId = claim.employee_id || claim.employeeId || claim.empId;
            if (!empId) {
              console.warn(
                "handleOpenAttachments: missing employee id for claim",
                claim,
              );
              return null;
            }

            // Construct file URL using same convention your backend uses
            const fileUrl = `${backendBase || process.env.NEXT_PUBLIC_BACKEND_URL}/reimbursement/${orgId}/${year}/${month}/${empId}/${candidateFilename}`;

            const resp = await axios.get(fileUrl, {
              withCredentials: true,
              headers: baseHeaders, // includes x-org-id, Authorization, x-employee-id, x-api-key (if available)
              responseType: "blob",
            });

            return {
              name: candidateFilename,
              url: URL.createObjectURL(
                new Blob([resp.data], { type: resp.headers["content-type"] }),
              ),
            };
          } catch (errInner) {
            console.warn(
              "attachment fetch failed for",
              file,
              errInner?.response?.status || errInner?.message || errInner,
            );
            return null;
          }
        }),
      );

      setSelectedFiles((fetchedFiles || []).filter(Boolean));
      setSelectedClaim(claim);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      showAlert("No attachments found for this screen.");
    }
  };

  const totalAmount = employees.reduce(
    (sum, employee) =>
      sum +
      (Array.isArray(employee.claims)
        ? employee.claims.reduce(
            (claimSum, claim) => claimSum + getClaimAmount(claim),
            0,
          )
        : 0),
    0,
  );

  const approvedAmount = employees.reduce(
    (sum, employee) =>
      sum +
      (Array.isArray(employee.claims)
        ? employee.claims
            .filter(
              (claim) => String(claim.status).toLowerCase() === "approved",
            )
            .reduce((claimSum, claim) => claimSum + getClaimAmount(claim), 0)
        : 0),
    0,
  );

  const handleStatusChange = (id, value) => {
    setStatusUpdates((prev) => ({ ...prev, [id]: value }));
  };

  const getActorId = () => {
    return (
      user?.employeeId ||
      user?.id ||
      user?.raw?.employee_id ||
      employeeData?.employeeId ||
      null
    );
  };

  const updateStatus = async (id) => {
    if (!statusUpdates[id]) {
      showAlert("Please select a status.");
      return;
    }

    const project = projectSelections[id] || "";
    if (!project) {
      showAlert("Please select a project.");
      return;
    }

    const updatedStatus = statusUpdates[id];
    const approverComment = comments?.[id] || "";
    const actorId = getActorId();

    try {
      const url =
        (backendBase ? `${backendBase}` : "") + `/reimbursement/status/${id}`;
      await axios.put(
        url,
        {
          status: updatedStatus,
          approver_comments: approverComment,
          approver_id: actorId,
          project,
        },
        {
          withCredentials: true,
          headers: buildHeaders(),
        },
      );
      showAlert(`Reimbursement ${updatedStatus} successfully.`);
      setEmployees((prevEmployees) =>
        prevEmployees.map((emp) => ({
          ...emp,
          claims: emp.claims.map((claim) =>
            claim.id === id
              ? {
                  ...claim,
                  status: updatedStatus,
                  approver_comments: approverComment,
                }
              : claim,
          ),
        })),
      );
    } catch (error) {
      console.error(
        "Error updating reimbursement status:",
        error?.response?.data || error?.message || error,
      );
      showAlert("Status update was not successful. Try again later.");
    }
  };

  const updatePaymentStatus = async (id) => {
    if (!paymentStatusUpdates[id]) {
      showAlert("Please select a payment status.");
      return;
    }
    const updatedPaymentStatus = paymentStatusUpdates[id];
    try {
      const url =
        (backendBase ? `${backendBase}` : "") +
        `/reimbursement/payment-status/${id}`;
      await axios.put(
        url,
        {
          payment_status: updatedPaymentStatus,
          user_role: "admin",
        },
        {
          withCredentials: true,
          headers: buildHeaders(),
        },
      );
      showAlert("Payment status updated successfully.");
      setEmployees((prevEmployees) =>
        prevEmployees.map((emp) => ({
          ...emp,
          claims: emp.claims.map((claim) =>
            claim.id === id
              ? { ...claim, payment_status: updatedPaymentStatus }
              : claim,
          ),
        })),
      );
    } catch (error) {
      console.error(
        "Error updating payment status:",
        error?.response?.data || error?.message || error,
      );
      showAlert("Payment status couldn't be updated at the moment.");
    }
  };

  const sanitizeFileName = (name) => {
    if (!name) return "";
    return name
      .replace(/[\u0000-\u001F<>:\"/\\|?*]+/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .substring(0, 160);
  };

  const handleDownloadPDF = async (claim) => {
    try {
      const url =
        (backendBase ? `${backendBase}` : "") + `/download/${claim.id}`;
      const headers = buildHeaders();
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const response = await axios.get(url, {
        withCredentials: true,
        headers,
        responseType: "blob",
      });

      let filename = "";
      const empName = claim.employee_name || claim.employeeName || claim.name;
      if (empName) {
        const base = sanitizeFileName(empName) || `Reimbursement_${claim.id}`;
        filename = `${base}_Reimbursement_${claim.id}.pdf`;
      }

      if (!filename) {
        const cd = response.headers["content-disposition"];
        const filenameRegex = /filename[^;=\n]*=(['"]?)([^;\n]*)\1/;
        const matches = filenameRegex.exec(cd || "");
        if (matches != null && matches[2]) {
          filename = matches[2];
        }
      }

      if (!filename) {
        filename = `Reimbursement_${claim.id}.pdf`;
      }

      if (!filename.toLowerCase().endsWith(".pdf")) filename += ".pdf";

      const blob = new Blob([response.data], { type: "application/pdf" });
      const urlObj = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlObj;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(urlObj);
    } catch (error) {
      console.error(
        "Error downloading reimbursement PDF:",
        error?.response?.data || error?.message || error,
      );
      showAlert("There was an issue downloading the file.");
    }
  };

  // ensure filteredEmployees exists for rendering
  const filteredEmployees = (employees || [])
    .map((emp) => ({
      ...emp,
      claims: (emp.claims || []).filter((claim) => {
        const status = (claim.status || "").toLowerCase().trim();
        const pay = (claim.payment_status || "").toLowerCase().trim();

        switch (statusFilter) {
          case "approved":
            return status === "approved";
          case "rejected":
            return status === "rejected";
          case "pending":
            return status === "pending";
          case "approved_pending":
            return status === "approved" && pay === "pending";
          case "approved_paid":
            return status === "approved" && pay === "paid";
          default:
            return true;
        }
      }),
    }))
    .filter((emp) => emp.claims && emp.claims.length > 0)
    .filter((emp) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const name = (emp.claims?.[0]?.employee_name || "").toLowerCase();
      const idStr = String(emp.employee_id || "").toLowerCase();
      return name.includes(q) || idStr.includes(q);
    });

  const openParticipantsModal = (claim) => {
    let existing = claim.participants || claim.participant_ids || [];
    try {
      if (typeof existing === "string" && existing.trim()) {
        existing = JSON.parse(existing);
      }
    } catch (e) {
      if (typeof existing === "string") {
        existing = existing
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else existing = Array.isArray(existing) ? existing : [];
    }
    const ids = (existing || []).map((p) => {
      if (typeof p === "object")
        return p.employee_id || p.id || p.employeeId || String(p);
      return String(p);
    });
    setParticipantsForEdit(ids);
    setSelectedClaim(claim);
    setIsParticipantsModalOpen(true);
  };

  const saveParticipants = async () => {
    if (!selectedClaim) return;
    setParticipantsSaving(true);
    try {
      const url =
        (backendBase ? `${backendBase}` : "") +
        `/reimbursement/${selectedClaim.id}/participants`;
      await axios.put(
        url,
        { participants: participantsForEdit },
        {
          withCredentials: true,
          headers: buildHeaders(),
        },
      );
      showAlert("Participants updated.");
      setIsParticipantsModalOpen(false);
      fetchEmployees();
    } catch (err) {
      console.error(
        "Error saving participants:",
        err?.response?.data || err?.message || err,
      );
      showAlert("Failed to save participants.");
    } finally {
      setParticipantsSaving(false);
    }
  };

  const handleParticipantSelectionChange = (value) => {
    if (!value) {
      setParticipantsForEdit([]);
      return;
    }
    if (Array.isArray(value)) {
      const ids = value
        .map((v) => v.employee_id || v.id || v.empId || String(v))
        .filter(Boolean)
        .map(String);
      setParticipantsForEdit(ids);
    } else {
      const id = value.employee_id || value.id || value.empId || String(value);
      setParticipantsForEdit(id ? [String(id)] : []);
    }
  };

  const handleToggleChange = (e) => {
    setView(e.target.checked ? "self" : "all");
  };
  const downloadExcel = async () => {
    try {
      const url = `${backendBase || ""}/reimbursements/export`;
      const params = {};
      if (submittedFrom) params.submittedFrom = submittedFrom;
      if (submittedTo) params.submittedTo = submittedTo;

      const headers = { ...buildHeaders() };
      // ensure org header present
      if (!headers["x-org-id"] && orgId) headers["x-org-id"] = String(orgId);

      const resp = await axios.get(url, {
        headers,
        params,
        withCredentials: true,
        responseType: "arraybuffer", // <- crucial
      });

      // If server returned JSON (error), try to parse it and show message
      const contentType = resp.headers["content-type"] || "";
      if (contentType.includes("application/json")) {
        const text = Buffer.from(resp.data).toString("utf8");
        let parsed = null;
        try {
          parsed = JSON.parse(text);
        } catch {}
        console.error("Export returned JSON:", parsed || text);
        showAlert(parsed?.message || parsed?.error || "Failed to export Excel");
        return;
      }

      const blob = new Blob([resp.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      const fname = `Reimbursements_${submittedFrom || "all"}-to-${
        submittedTo || "all"
      }.xlsx`;
      link.href = URL.createObjectURL(blob);
      link.download = fname;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("downloadExcel failed:", err?.response || err);
      // If backend returned JSON error body, try to extract message
      if (err?.response?.data) {
        try {
          const text = new TextDecoder().decode(err.response.data);
          const parsed = JSON.parse(text);
          showAlert(
            parsed?.message || parsed?.error || "Failed to export Excel",
          );
          return;
        } catch {}
      }
      showAlert("Failed to export Excel");
    }
  };

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });
  const showAlert = (message, title = "") =>
    setAlertModal({ isVisible: true, title, message });
  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  // --- MISSING previously: openPaymentModal (added) ---
  const openPaymentModal = (claim) => {
    if (!claim) return;
    setSelectedPaymentClaim(claim);
    const current = (claim.payment_status || "").toLowerCase().trim();
    setSelectedPaymentOption(current || "pending");
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="rb-admin">
      <h2>Reimbursement Requests</h2>
      <div className="tabs-container">
        <button
          className={`tab ${view === "all" ? "active" : ""}`}
          onClick={() => setView("all")}
        >
          All
        </button>
        <button
          className={`tab ${view === "self" ? "active" : ""}`}
          onClick={() => setView("self")}
        >
          Self
        </button>
      </div>
      {view === "all" ? (
        <>
          <div className="rb-filters">
            <div className="rb-filter-group">
              <input
                type="text"
                placeholder="Search by Name or ID…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="rb-filter-group">
              <label>Status By</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="pending">Pending</option>
                <option value="approved_pending">Approved/Pending</option>
                <option value="approved_paid">Approved/Paid</option>
              </select>
            </div>

            <div className="rb-filter-group">
              <label>Submitted From:</label>
              <input
                type="date"
                value={submittedFrom}
                onChange={(e) => setSubmittedFrom(e.target.value)}
              />
            </div>
            <div className="rb-filter-group">
              <label>To:</label>
              <input
                type="date"
                value={submittedTo}
                onChange={(e) => setSubmittedTo(e.target.value)}
              />
            </div>
            <button className="rb-search" onClick={fetchEmployees}>
              <FaSearch /> Search
            </button>
            <button
              className="rb-search"
              onClick={downloadExcel}
              style={{ marginLeft: "8px" }}
            >
              <FiDownload /> Export
            </button>
          </div>

          <div className="rb-atable-container">
            {filteredEmployees.map((employee) => {
              const filteredClaims = employee.claims;
              if (!filteredClaims.length) return null;
              return (
                <div key={employee.employee_id} className="employee-section">
                  <div
                    className="employee-row"
                    onClick={() => toggleRow(employee.employee_id)}
                  >
                    <div className="empId-rows">
                      <span>
                        {employee.claims[0]?.employee_name} - [
                        {employee.employee_id}]
                      </span>
                    </div>
                    <div className="emp-rows">
                      <span>
                        Total Amount Claiming: Rs{" "}
                        {filteredClaims
                          .reduce(
                            (sum, claim) => sum + getClaimAmount(claim),
                            0,
                          )
                          .toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="emp-rows">
                      <span>
                        Amount Approved: Rs{" "}
                        {filteredClaims
                          .filter(
                            (claim) =>
                              String(claim.status).toLowerCase() === "approved",
                          )
                          .reduce(
                            (sum, claim) => sum + getClaimAmount(claim),
                            0,
                          )
                          .toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="rbtoggle-btn">
                      {expandedRows[employee.employee_id] ? (
                        <FaChevronUp className="drop-icon" />
                      ) : (
                        <FaChevronDown className="drop-icon" />
                      )}
                    </div>
                  </div>

                  {expandedRows[employee.employee_id] && (
                    <div className="reimbursement-table-scroll">
                      <div className="rb-sub-container">
                        <table className="rb-sub-table">
                          {/* table head/body omitted for brevity inside this snippet but unchanged */}
                          <thead>
                            <tr>
                              <th>Sl No</th>
                              <th>Claim Type</th>
                              <th>Date</th>
                              <th>Amount</th>
                              <th>Purpose</th>
                              <th>Participants</th>
                              <th>Invoice(s)</th>
                              <th>Attachments</th>
                              <th>Status</th>
                              <th>Projects</th>
                              <th>Approver Comments</th>
                              <th>Payment Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredClaims.map((claim, index) => {
                              const lines = Array.isArray(claim.lines)
                                ? claim.lines
                                    .slice()
                                    .sort(
                                      (a, b) =>
                                        (a.line_index || 0) -
                                        (b.line_index || 0),
                                    )
                                : [];

                              const firstLinePayload =
                                lines && lines.length
                                  ? lines[0].payload || {}
                                  : {};
                              let claimInvs = parseInvoicesFromClaim(
                                claim.invoices ||
                                  claim.invoice_numbers ||
                                  claim.invoice_no,
                              );
                              const invSet = new Set(
                                (claimInvs || []).map((i) => String(i).trim()),
                              );
                              (lines || []).forEach((ln) => {
                                const linv =
                                  ln?.payload?.invoices ||
                                  ln?.payload?.invoice ||
                                  [];
                                parseInvoicesFromClaim(linv).forEach((i) => {
                                  if (i) invSet.add(String(i).trim());
                                });
                              });
                              const claimInvDisplay = Array.from(invSet).length
                                ? Array.from(invSet).join(", ")
                                : "-";

                              return (
                                <React.Fragment
                                  key={
                                    claim.id ||
                                    `${employee.employee_id}-${index}`
                                  }
                                >
                                  <tr className="claim-main-row">
                                    <td>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleClaimExpand(claim.id)
                                        }
                                        aria-expanded={
                                          !!expandedClaims[claim.id]
                                        }
                                        style={{ minWidth: 36 }}
                                      >
                                        {expandedClaims[claim.id] ? "−" : "+"}
                                      </button>{" "}
                                      {index + 1}
                                    </td>

                                    <td>{claim.claim_type || "-"}</td>
                                    <td>
                                      {resolveDateDisplay(
                                        firstLinePayload,
                                        claim,
                                      )}
                                    </td>
                                    <td>₹{claim.aggregated_total}</td>
                                    <td
                                      className="participants-cell-col"
                                      title={claim.purpose}
                                    >
                                      <div className="rbadmin-comments">
                                        {claim.purpose || claim.comments || "-"}
                                      </div>
                                    </td>
                                    <td
                                      className="participants-cell-col"
                                      title={getParticipantNamesForClaim(claim)}
                                    >
                                      <div className="rbadmin-comments">
                                        {getParticipantNamesForClaim(claim)}
                                      </div>
                                    </td>
                                    <td
                                      className="invoice-cell"
                                      title={claimInvDisplay}
                                    >
                                      {claimInvDisplay}
                                    </td>
                                    <td>
                                      {attachments[claim.id] &&
                                      attachments[claim.id].length > 0 ? (
                                        <button
                                          className="attachments-btn"
                                          onClick={() =>
                                            handleOpenAttachments(
                                              attachments[claim.id],
                                              claim,
                                            )
                                          }
                                        >
                                          <MdOutlineRemoveRedEye className="eye-icon" />{" "}
                                          View
                                        </button>
                                      ) : claim.line_attachments_map &&
                                        Object.keys(claim.line_attachments_map)
                                          .length > 0 ? (
                                        <button
                                          className="attachments-btn"
                                          onClick={() =>
                                            handleOpenAttachments(
                                              Object.values(
                                                claim.line_attachments_map,
                                              ).flat(),
                                              claim,
                                            )
                                          }
                                        >
                                          <MdOutlineRemoveRedEye className="eye-icon" />{" "}
                                          View Line Attachments
                                        </button>
                                      ) : (
                                        "No Attachments"
                                      )}
                                    </td>

                                    <td>
                                      {claim.status === "approved" ||
                                      claim.status === "rejected" ? (
                                        <span
                                          className={`status-label ${claim.status}`}
                                        >
                                          <span className="status-dot"></span>
                                          {claim.status
                                            .charAt(0)
                                            .toUpperCase() +
                                            claim.status.slice(1)}
                                        </span>
                                      ) : (
                                        <select
                                          className="rb-status-dropdown"
                                          value={
                                            statusUpdates[claim.id] ||
                                            claim.status ||
                                            ""
                                          }
                                          onChange={(e) =>
                                            !isHR &&
                                            handleStatusChange(
                                              claim.id,
                                              e.target.value,
                                            )
                                          }
                                          disabled={isHR}
                                        >
                                          <option value="">Pending</option>
                                          <option value="approved">
                                            Approve
                                          </option>
                                          <option value="rejected">
                                            Reject
                                          </option>
                                        </select>
                                      )}
                                    </td>

                                    <td>
                                      {claim.status === "approved" ||
                                      claim.status === "rejected" ? (
                                        <div className="rbadmin-comments">
                                          {projectSelections[claim.id] ||
                                            claim.project}
                                        </div>
                                      ) : (
                                        <select
                                          className="rb-status-dropdown"
                                          value={
                                            projectSelections[claim.id] || ""
                                          }
                                          onChange={(e) =>
                                            !isHR &&
                                            setProjectSelections((prev) => ({
                                              ...prev,
                                              [claim.id]: e.target.value,
                                            }))
                                          }
                                          disabled={isHR}
                                        >
                                          <option value="">Select</option>
                                          <option value="STS CLAIM">
                                            STS CLAIM
                                          </option>
                                          {projects.map((project, idx) => (
                                            <option key={idx} value={project}>
                                              {project}
                                            </option>
                                          ))}
                                        </select>
                                      )}
                                    </td>

                                    <td>
                                      {claim.status === "approved" ||
                                      claim.status === "rejected" ? (
                                        <div className="rbadmin-comments">
                                          {claim.approver_comments ||
                                            "No comments"}
                                        </div>
                                      ) : (
                                        <input
                                          type="text"
                                          placeholder={
                                            isHR
                                              ? "View only"
                                              : "Enter comments"
                                          }
                                          value={comments[claim.id] || ""}
                                          onChange={(e) =>
                                            !isHR &&
                                            setComments((prev) => ({
                                              ...prev,
                                              [claim.id]: e.target.value,
                                            }))
                                          }
                                          disabled={isHR}
                                        />
                                      )}
                                    </td>

                                    <td>
                                      {claim.status?.toLowerCase().trim() ===
                                      "approved" ? (
                                        !claim.payment_status ||
                                        claim.payment_status
                                          ?.toLowerCase()
                                          ?.trim() === "pending" ? (
                                          <button
                                            className={`pending-payment-btn ${
                                              isHR ? "disabled" : ""
                                            }`}
                                            onClick={() => {
                                              if (!isHR)
                                                openPaymentModal(claim);
                                            }}
                                            disabled={isHR}
                                            style={{
                                              pointerEvents: isHR
                                                ? "none"
                                                : "auto",
                                              opacity: isHR ? 0.4 : 1,
                                              cursor: isHR
                                                ? "not-allowed"
                                                : "pointer",
                                            }}
                                          >
                                            Pending
                                          </button>
                                        ) : (
                                          <span>
                                            {claim.payment_status
                                              ? claim.payment_status
                                                  .charAt(0)
                                                  .toUpperCase() +
                                                claim.payment_status.slice(1)
                                              : " "}
                                            {claim.paid_date
                                              ? ` (${formatDisplayDate(
                                                  claim.paid_date,
                                                )})`
                                              : ""}
                                          </span>
                                        )
                                      ) : (
                                        <span>
                                          {claim.payment_status || "-"}
                                        </span>
                                      )}
                                    </td>

                                    <td>
                                      <FaFileInvoice
                                        size={24}
                                        className={`update-btn ${
                                          isHR ? "disabled" : ""
                                        }`}
                                        onClick={() => {
                                          if (!isHR) updateStatus(claim.id);
                                        }}
                                        style={{
                                          pointerEvents: isHR ? "none" : "auto",
                                          opacity: isHR ? 0.4 : 1,
                                          cursor: isHR
                                            ? "not-allowed"
                                            : "pointer",
                                        }}
                                      />
                                      <FiDownload
                                        size={24}
                                        className="download-btn"
                                        onClick={() => handleDownloadPDF(claim)}
                                      />
                                    </td>
                                  </tr>

                                  {expandedClaims[claim.id] &&
                                    (lines.length
                                      ? lines
                                      : [{ id: null, payload: claim }]
                                    ).map((line, li) => {
                                      const payload = line.payload || {};
                                      const lineInvs = parseInvoicesFromClaim(
                                        payload.invoices ||
                                          payload.invoice ||
                                          [],
                                      );
                                      const lnInvDisplay =
                                        Array.isArray(lineInvs) &&
                                        lineInvs.length
                                          ? lineInvs.join(", ")
                                          : claimInvDisplay;
                                      // --- START REPLACEMENT: improved line-level attachments fallback ---
                                      const lineAttachMap =
                                        claim.line_attachments_map || {};

                                      // First try line-specific attachments (existing behaviour)
                                      let attachmentsForThis =
                                        (line &&
                                          (lineAttachMap[String(line.id)] ||
                                            lineAttachMap[line.id])) ||
                                        [];

                                      // Fallback: if none found at line level, use claim-level attachments (helps HR)
                                      if (
                                        (!attachmentsForThis ||
                                          attachmentsForThis.length === 0) &&
                                        attachments &&
                                        attachments[claim.id] &&
                                        attachments[claim.id].length
                                      ) {
                                        // try to match attachments by filename containing line id, otherwise use all claim attachments
                                        const lineIdStr =
                                          line &&
                                          line.id !== undefined &&
                                          line.id !== null
                                            ? String(line.id)
                                            : "";
                                        const matched = lineIdStr
                                          ? (
                                              attachments[claim.id] || []
                                            ).filter((a) => {
                                              const fname = String(
                                                a.file_name ||
                                                  a.filename ||
                                                  a.name ||
                                                  a.fileName ||
                                                  "",
                                              );
                                              return fname.includes(lineIdStr);
                                            })
                                          : [];
                                        attachmentsForThis = matched.length
                                          ? matched
                                          : attachments[claim.id];
                                      }
                                      // --- END REPLACEMENT ---

                                      const amount = line
                                        ? line.total_amount ||
                                          payload.total_amount ||
                                          0
                                        : 0;

                                      return (
                                        <tr
                                          key={`line-${claim.id}-${
                                            line.id ?? li
                                          }`}
                                          className="claim-line-row"
                                        >
                                          <td></td>
                                          <td></td>
                                          <td>
                                            {resolveDateDisplay(payload, claim)}
                                          </td>
                                          <td>
                                            {Number(amount || 0).toFixed(2)}
                                          </td>
                                          <td style={{ paddingLeft: 12 }}>
                                            {payload.purpose || "-"}
                                          </td>
                                          <td
                                            className="participants-cell-col"
                                            title={getParticipantNamesForClaim(
                                              claim,
                                            )}
                                          >
                                            <div className="rbadmin-comments">
                                              {getParticipantNamesForClaim(
                                                claim,
                                              )}
                                            </div>
                                          </td>
                                          <td
                                            className="invoice-cell"
                                            title={lnInvDisplay}
                                          >
                                            {lnInvDisplay}
                                          </td>
                                          <td>
                                            {attachmentsForThis &&
                                            attachmentsForThis.length > 0 ? (
                                              <button
                                                className="attachments-btn"
                                                onClick={() =>
                                                  handleOpenAttachments(
                                                    attachmentsForThis.map(
                                                      (a) => ({
                                                        filename:
                                                          a.file_name ||
                                                          a.filename ||
                                                          a.fileName,
                                                        file_name:
                                                          a.file_name ||
                                                          a.filename,
                                                      }),
                                                    ),
                                                    claim,
                                                  )
                                                }
                                              >
                                                <MdOutlineRemoveRedEye className="eye-icon" />{" "}
                                                View
                                              </button>
                                            ) : (
                                              "Not Attached"
                                            )}
                                          </td>
                                          <td></td>
                                          <td></td>
                                          <td></td>
                                          <td></td>
                                          <td></td>
                                        </tr>
                                      );
                                    })}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="total-row">
                              <td
                                colSpan="7"
                                style={{
                                  textAlign: "right",
                                  color: "#949494",
                                  fontWeight: "bold",
                                }}
                              >
                                Total Amount Claiming:{" "}
                                <span
                                  style={{ fontWeight: "bold", color: "black" }}
                                >
                                  Rs {totalAmount}
                                </span>
                              </td>
                              <td colSpan="6" style={{ textAlign: "right" }}>
                                Amount Approved: Rs{" "}
                                <span style={{ fontWeight: "bold" }}>
                                  {approvedAmount}
                                </span>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <Reimbursement />
      )}

      {isParticipantsModalOpen && (
        <Modal
          isVisible={isParticipantsModalOpen}
          onClose={() => setIsParticipantsModalOpen(false)}
          buttons={[
            {
              label: "Cancel",
              onClick: () => setIsParticipantsModalOpen(false),
            },
            {
              label: participantsSaving ? "Saving..." : "Save",
              onClick: saveParticipants,
              disabled: participantsSaving,
            },
          ]}
        >
          <h3>Manage Participants</h3>
          <p style={{ marginTop: 0 }}>
            Select employees to be saved as participants for this claim.
          </p>
          <ParticipantSelection
            departmentId={employeeData?.department_id || ""}
            selectionMode="group"
            onSelectionChange={handleParticipantSelectionChange}
            initialSelection={
              participantsForEdit && participantsForEdit.length
                ? employeeOptions.filter((eo) =>
                    participantsForEdit.includes(String(eo.employee_id)),
                  )
                : []
            }
            limit={500}
          />
          <div className="participants-modal-selected">
            <div className="selected-title">Selected:</div>
            <div className="selected-list">
              {participantsForEdit && participantsForEdit.length ? (
                participantsForEdit.map((pid) => {
                  const found = employeeOptions.find(
                    (e) => String(e.employee_id) === String(pid),
                  );
                  return (
                    <div key={pid} className="selected-item">
                      {found ? `${found.name} [${pid}]` : pid}
                    </div>
                  );
                })
              ) : (
                <div className="selected-none">No participants selected.</div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {isPaymentModalOpen && (
        <Modal
          isVisible={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          buttons={[]}
        >
          <div className="payment-modal-content">
            <div className="payment-header">
              <h3>Update Payment Status</h3>
              <button
                className="modal-cross-btn"
                onClick={() => setIsPaymentModalOpen(false)}
              >
                ✖
              </button>
            </div>
            <div className="payment-options">
              <label>
                <input
                  type="radio"
                  name="paymentOption"
                  value="rejected"
                  checked={selectedPaymentOption === "rejected"}
                  onChange={(e) => setSelectedPaymentOption(e.target.value)}
                />{" "}
                Reject
              </label>
              <label style={{ marginLeft: "20px" }}>
                <input
                  type="radio"
                  name="paymentOption"
                  value="pending"
                  checked={selectedPaymentOption === "pending"}
                  onChange={(e) => setSelectedPaymentOption(e.target.value)}
                />{" "}
                Pending
              </label>
              <label style={{ marginLeft: "20px" }}>
                <input
                  type="radio"
                  name="paymentOption"
                  value="paid"
                  checked={selectedPaymentOption === "paid"}
                  onChange={(e) => setSelectedPaymentOption(e.target.value)}
                />{" "}
                Payable
              </label>
            </div>
            <p>I'll make sure to process the payment today</p>
            <button
              className="submit-payment-btn"
              onClick={async () => {
                if (!selectedPaymentOption) {
                  showAlert("Please select an option.");
                  return;
                }
                if (!selectedPaymentClaim) {
                  showAlert("No claim selected.");
                  return;
                }
                try {
                  const url =
                    (backendBase ? `${backendBase}` : "") +
                    `/reimbursement/payment-status/${selectedPaymentClaim.id}`;
                  await axios.put(
                    url,
                    {
                      payment_status: selectedPaymentOption,
                      user_role: "admin",
                    },
                    { withCredentials: true, headers: buildHeaders() },
                  );
                  showAlert("Payment status updated successfully.");
                  setIsPaymentModalOpen(false);
                  fetchEmployees();
                } catch (error) {
                  console.error(
                    "Error updating payment status:",
                    error?.response?.data || error?.message || error,
                  );
                  showAlert(
                    "Could not update payment status. Please try again.",
                  );
                }
              }}
            >
              Submit
            </button>
          </div>
        </Modal>
      )}

      {isModalOpen && (
        <div className="att-modal-overlay">
          <div className="att-modal-content">
            <div className="att-header">
              <h2>Attachments</h2>
              <MdOutlineCancel
                className="att-close"
                onClick={() => setIsModalOpen(false)}
              />
            </div>
            <h4 className="att-files">
              {selectedClaim?.claim_type
                ? `${selectedClaim.claim_type} Bills`
                : "Bills"}
            </h4>
            {selectedFiles.length > 0 ? (
              selectedFiles.map((file, index) => (
                <div className="att-files" key={index}>
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    {file.name}
                  </a>
                </div>
              ))
            ) : (
              <p>No attachments available</p>
            )}
            <button
              className="att-close-btn"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <Modal
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        buttons={[{ label: "OK", onClick: closeAlert }]}
      >
        <p>{alertModal.message}</p>
      </Modal>
    </div>
  );
};

export default RbAdmin;
