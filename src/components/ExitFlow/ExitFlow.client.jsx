

"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider.client";
import "./ExitFlow.css";
import { createPortal } from "react-dom";
import Modal from "../Modal/Modal.client";

export default function ExitFlow() {
  const { user } = useAuth();
  const employeeId = user?.employeeId ?? user?.employee_id ?? user?.id ?? null;
  const orgId = user?.orgId ?? user?.org_id ?? null;
  const role = user?.role?.toLowerCase() ?? "employee";
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "");

  const [alertModal, setAlertModal] = useState({
  isVisible: false,
  title: "",
  message: "",
  type: "info", // "success" | "error" | "warning" | "info"
});
const showAlert = (message, title = "", type = "info") => {
  setAlertModal({ isVisible: true, title, message, type });

  // Auto-close success messages after ~2.2 seconds (optional but nice UX)
  if (type === "success") {
    setTimeout(() => {
      setAlertModal(prev => ({ ...prev, isVisible: false }));
    }, 2200);
  }
};

const closeAlert = () => {
  setAlertModal({ isVisible: false, title: "", message: "", type: "info" });
};
  const [selfRequest, setSelfRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState({
    reason: "",
    otherReason: "",
    proposedLwd: "",
    comment: "",
  });
  const [withdrawReason, setWithdrawReason] = useState("");
  const [pendingData, setPendingData] = useState({ normal: [], withdraw: [] });
  const [resignedClearance, setResignedClearance] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewComment, setReviewComment] = useState("");
  const [recommendedLwd, setRecommendedLwd] = useState("");
  const [finalLwd, setFinalLwd] = useState("");
  const [activeTab, setActiveTab] = useState("self");
  const [showAddKTModal, setShowAddKTModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);
  const [allTeamRequests, setAllTeamRequests] = useState([]);
  const [clearanceActiveTab, setClearanceActiveTab] = useState("kt");
  const [ktPlans, setKtPlans] = useState([]);
  const [assets, setAssets] = useState([]);
  const roleLower = role?.toLowerCase() || "";

const isAdmin = roleLower === "admin";
// const isHr    = roleLower === "hr" || roleLower === "human resource" || roleLower === "hr admin"; // adjust as needed
const isSupervisorLike = ["supervisor", "manager", "team lead"].includes(roleLower);
  const [newKtForm, setNewKtForm] = useState({
    topic: "",
    description: "",
    documents: [], // ← changed from string to array of File objects
    status: "pending",
    completedDate: "",
  });

  
  // ── NEW STATES FOR EDITING ───────────────────────────────────────
  const [editingKtId, setEditingKtId] = useState(null);
  const [editKtForm, setEditKtForm] = useState({
    topic: "",
    description: "",
    documents: [], // only NEW files
    filesToDelete: [], // paths we want to remove
    status: "pending",
    completedDate: "",
  });
  // ────────────────────────────────────────────────────────────────
  const [newAssetForm, setNewAssetForm] = useState({
    name: "",
    returnDate: "",
  });
  const [exitCompleted, setExitCompleted] = useState(false);
useEffect(() => {
  if (isAdmin && activeTab !== "all") {
    setActiveTab("all");
  }
}, [isAdmin, activeTab]);
  useEffect(() => {
    if (!employeeId || !orgId) {
      setErrorMessage("Session incomplete. Please login again.");
      setLoading(false);
      return;
    }
    const init = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        await fetchSelfRequest();
        await fetchAllTeamRequests();
        await fetchTeamMembers();
      } catch (err) {
        setErrorMessage("Failed to load exit information.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [employeeId, orgId]);

  const fetchSelfRequest = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/exit/my-active`, {
        headers: {
          "x-api-key": API_KEY,
          "x-employee-id": employeeId,
          "x-org-id": orgId,
        },
        withCredentials: true,
      });
      const data = res.data?.data || null;
      setSelfRequest(data);
      console.log("[SELF] Loaded:", data ? "yes" : "no");
      if (data?.final_outcome === "RESIGNED") {
        await fetchClearanceItems(data.id);
        setExitCompleted(!!data.clearance_completed_at);
      }
    } catch (err) {
      console.error("[SELF] Fetch failed:", err.message);
    }
  };

  const fetchClearanceItems = async (exitId) => {
    if (!exitId) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/api/clearance/${exitId}/items`, {
        headers: {
          "x-api-key": API_KEY,
          "x-employee-id": employeeId,
          "x-org-id": orgId,
        },
        withCredentials: true,
      });
      const items = res.data?.data || [];
      setKtPlans(items.filter(item => item.item_type === "KT"));
      setAssets(items.filter(item => item.item_type === "ASSET"));
      console.log("[CLEARANCE] Items loaded:", items.length);
    } catch (err) {
      console.error("[CLEARANCE] Fetch failed:", err.message);
      setErrorMessage("Failed to load clearance items");
    }
  };
const [showResignationForm, setShowResignationForm] = useState(false);
  const fetchTeamMembers = async () => {
    setLoadingTeamMembers(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/team/members`, {
        headers: {
          "x-api-key": API_KEY,
          "x-employee-id": employeeId,
          "x-org-id": orgId,
        },
        withCredentials: true,
      });
      const members = res.data.members || [];
      console.log("[TEAM MEMBERS] Raw response:", res.data);
      console.log("[TEAM MEMBERS] Count:", members.length);
      console.log("[TEAM MEMBERS] First few:", members.slice(0, 3));
      setTeamMembers(members);
    } catch (err) {
      console.error("[TEAM MEMBERS FETCH ERROR]", err.response?.data || err.message);
      setTeamMembers([]);
    } finally {
      setLoadingTeamMembers(false);
    }
  };

  const fetchAllTeamRequests = async () => {
    try {
const url =
  role === "hr" || role === "admin" || isAdmin
    ? `${BACKEND_URL}/api/exit/all`
    : `${BACKEND_URL}/api/exit/my-team/all`;      console.log("[TEAM REQUESTS] Fetching from:", url);
      console.log("[TEAM REQUESTS] Current role:", role);
      const res = await axios.get(url, {
        headers: {
          "x-api-key": API_KEY,
          "x-employee-id": employeeId,
          "x-org-id": orgId,
        },
        withCredentials: true,
      });
      const requests = res.data?.data || res.data || [];
      console.log("[TEAM REQUESTS] Raw response:", res.data);
      console.log("[TEAM REQUESTS] Total count:", requests.length);
      console.log("[TEAM REQUESTS] Pending normal:", requests.filter(r => r.supervisor_status === "PENDING" || r.hr_status === "PENDING").length);
      console.log("[TEAM REQUESTS] Pending withdraw:", requests.filter(r => r.withdrawal_requested_at && r.withdrawal_supervisor_status === "PENDING").length);
      console.log("[TEAM REQUESTS] Resigned:", requests.filter(r => r.final_outcome === "RESIGNED").length);
      setAllTeamRequests(requests);
      setPendingData({
        normal: requests.filter(r => r.supervisor_status === "PENDING" || r.hr_status === "PENDING"),
        withdraw: requests.filter(r => r.withdrawal_requested_at && r.withdrawal_supervisor_status === "PENDING"),
      });
      setResignedClearance(requests.filter(r => r.final_outcome === "RESIGNED"));
    } catch (err) {
      console.error("[TEAM REQUESTS FETCH ERROR]", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    if (selectedRequest?.type === "clearance" && selectedRequest?.id) {
      fetchClearanceItems(selectedRequest.id);
    }
  }, [selectedRequest]);

  const handleAddKt = async () => {
    console.log("[handleAddKt] START");
    if (!newKtForm.topic.trim() || !newKtForm.description.trim()) {
      setErrorMessage("Topic and description are required");
      return;
    }
    setLoading(true);
    setErrorMessage("");
    try {
      console.log("[handleAddKt] Building FormData");
      const formData = new FormData();
      formData.append("exitId", selfRequest.id);
      formData.append("itemType", "KT");
      formData.append("title", newKtForm.topic);
      formData.append("description", newKtForm.description || "");
      if (newKtForm.completedDate) formData.append("plannedDate", newKtForm.completedDate);
      formData.append("status", newKtForm.status || "pending");
      console.log("[handleAddKt] Files count:", newKtForm.documents.length);
      newKtForm.documents.forEach((file, i) => {
        console.log(`[handleAddKt] Appending file ${i+1}: ${file.name}`);
        formData.append("files", file);
      });
      console.log("[handleAddKt] Sending POST...");
      const res = await axios.post(
        `${BACKEND_URL}/api/clearance/item`,
        formData,
        {
          headers: {
            "x-api-key": API_KEY,
            "x-employee-id": employeeId,
            "x-org-id": orgId,
          },
          withCredentials: true,
        }
      );
      console.log("[handleAddKt] API RESPONSE:", res.data);
      // Reset form
      setNewKtForm({
        topic: "",
        description: "",
        documents: [],
        status: "pending",
        completedDate: "",
      });
      console.log("[handleAddKt] Refreshing clearance items...");
      await fetchClearanceItems(selfRequest.id);
      console.log("[handleAddKt] Closing modal");
      setShowAddKTModal(false);
      showAlert("KT plan added successfully!");
    } catch (err) {
      console.error("[handleAddKt] ERROR:", err);
      const msg = err.response?.data?.error || err.message || "Failed to add KT plan";
      setErrorMessage(msg);
      showAlert("Error: " + msg);
    } finally {
      console.log("[handleAddKt] FINALLY - loading = false");
      setLoading(false);
    }
  };

  const startEditKt = (kt) => {
    setEditingKtId(kt.id);
    setEditKtForm({
      topic: kt.title || "",
      description: kt.description || "",
      documents: [], // only new files
      filesToDelete: [],
      status: kt.status || "pending",
      completedDate: kt.actual_completed_date || kt.planned_date || "",
    });
    setShowAddKTModal(true);
  };

  const handleEditKt = async () => {
    if (!editKtForm.topic.trim() || !editKtForm.description.trim()) {
      setErrorMessage("Topic and description are required");
      return;
    }
    setLoading(true);
    setErrorMessage("");
    try {
      const formData = new FormData();
    
      // Now it's safe to log
      console.log("=== DEBUG: Preparing PUT request ===");
      console.log("URL:", `${BACKEND_URL}/api/clearance/item/${editingKtId}`);
      console.log("exitId being sent:", selfRequest?.id);
      console.log("Headers:", {
        "x-api-key": API_KEY || "[MISSING OR EMPTY]",
        "x-employee-id": employeeId || "[MISSING]",
        "x-org-id": orgId || "[MISSING]",
      });
      console.log("FormData keys:", [...formData.keys()]); // ← moved here, after creation
      formData.append("exitId", selfRequest?.id || ""); // ← make sure this is sent!
      formData.append("title", editKtForm.topic);
      formData.append("description", editKtForm.description);
      formData.append("status", editKtForm.status);
      if (editKtForm.completedDate) formData.append("completedDate", editKtForm.completedDate);
      // Files to delete
      editKtForm.filesToDelete.forEach(path => {
        formData.append("filesToDelete", path);
      });
      // New files to upload
      editKtForm.documents.forEach(file => {
        formData.append("files", file);
      });
      const res = await axios.put(
        `${BACKEND_URL}/api/clearance/item/${editingKtId}`,
        formData,
        {
          headers: {
            "x-api-key": API_KEY,
            "x-employee-id": employeeId,
            "x-org-id": orgId,
          },
          withCredentials: true,
        }
      );
      console.log("PUT success:", res.data);
      await fetchClearanceItems(selfRequest.id);
      setShowAddKTModal(false);
      setEditingKtId(null);
      setEditKtForm({
        topic: "",
        description: "",
        documents: [],
        filesToDelete: [],
        status: "pending",
        completedDate: "",
      });
      showAlert("KT plan updated successfully!");
    } catch (err) {
      console.error("[handleEditKt] Full error:", err);
      console.error("Response data:", err.response?.data);
      console.error("Response status:", err.response?.status);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to update KT plan";
      setErrorMessage(msg);
      showAlert("Error: " + msg);
    } finally {
      setLoading(false);
    }
  };

  const normalizeFilePath = (file) => {
    if (!file) return null;
    if (file.startsWith('http://') || file.startsWith('https://')) {
      try {
        const url = new URL(file);
        return url.pathname.replace(/^\//, '');
      } catch (e) {
        console.warn("Invalid full URL in attached_files:", file);
        return file;
      }
    }
    if (!file.includes('/')) {
      return `exitflowuploads/${file}`;
    }
    return file;
  };

  const getFileUrl = (rawPath) => {
    if (!rawPath) return null;
    let cleanPath = rawPath
      .replace(/\\/g, '/')
      .replace(/^exitflowuploads[\/\\]?/, '')
      .replace(/^\//, '');
    return `${BACKEND_URL}/exitflowuploads/${cleanPath}`;
  };

  const viewFile = (rawFile) => {
    const cleanPath = rawFile.replace(/\\/g, '/').replace(/^\/+/, '');
    const fullUrl = `${BACKEND_URL}/exitflowuploads/${cleanPath.split('/').pop()}`;
    window.open(fullUrl, "_blank");
  };

  const downloadFile = (rawFile) => {
    const filename = rawFile.split("/").pop();
    const url = `${BACKEND_URL}/api/exit/download/${filename}`;
    window.location.href = url;
  };

  const handleApproveItem = async (itemId, approved, itemType) => {
    if (loading) return;
    const approvalField = role === "hr" ? "hr_approved" : "supervisor_approved";
    // Optimistic UI update
    if (itemType === "KT") {
      setKtPlans(prev =>
        prev.map(k =>
          k.id === itemId ? { ...k, [approvalField]: approved } : k
        )
      );
    } else if (itemType === "ASSET") {
      setAssets(prev =>
        prev.map(a =>
          a.id === itemId ? { ...a, [approvalField]: approved } : a
        )
      );
    }
    setLoading(true);
    setErrorMessage("");
    try {
      let approvalAs = "supervisor";
      if (activeTab === "all") {
        approvalAs = "hr";
      } else if (activeTab === "team" && role === "hr") {
        approvalAs = "supervisor";
      } else if (["supervisor", "manager"].includes(role)) {
        approvalAs = "supervisor";
      } else if (role === "hr") {
        approvalAs = "hr";
      }
      console.log("[Frontend] Approving as:", approvalAs, { itemId, approved, itemType });
      await axios.put(
        `${BACKEND_URL}/api/clearance/item/${itemId}/approve`,
        {
          approved,
          approvalAs,
        },
        {
          headers: {
            "x-api-key": API_KEY,
            "x-employee-id": employeeId,
            "x-org-id": orgId,
          },
          withCredentials: true,
        }
      );
      if (selectedRequest?.id) {
        await fetchClearanceItems(selectedRequest.id);
      }
    } catch (err) {
      console.error("[Frontend] Approval failed:", err);
      setErrorMessage(err.response?.data?.error || "Failed to update approval");
      if (itemType === "KT") {
        setKtPlans(prev =>
          prev.map(k =>
            k.id === itemId ? { ...k, [approvalField]: !approved } : k
          )
        );
      } else if (itemType === "ASSET") {
        setAssets(prev =>
          prev.map(a =>
            a.id === itemId ? { ...a, [approvalField]: !approved } : a
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsset = async () => {
    if (!newAssetForm.name.trim() || !newAssetForm.returnDate) {
      return setErrorMessage("Asset name and return date are required");
    }
    setLoading(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/clearance/item`,
        {
          exitId: selfRequest.id,
          itemType: "ASSET",
          title: newAssetForm.name,
          plannedDate: newAssetForm.returnDate,
        },
        {
          headers: {
            "x-api-key": API_KEY,
            "x-employee-id": employeeId,
            "x-org-id": orgId,
          },
          withCredentials: true,
        }
      );
      setNewAssetForm({ name: "", returnDate: "" });
      await fetchClearanceItems(selfRequest.id);
      console.log("[ADD ASSET] Success");
    } catch (err) {
      setErrorMessage(err.response?.data?.error || "Failed to add asset");
      console.error("[ADD ASSET] Failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeExit = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const exitId = selectedRequest?.id || selfRequest?.id;
      if (!exitId) throw new Error("No exit request selected");
      const res = await axios.post(
        `${BACKEND_URL}/api/clearance/finalize`,
        { exitId },
        {
          headers: {
            "x-api-key": API_KEY,
            "x-employee-id": employeeId,
            "x-org-id": orgId,
          },
          withCredentials: true,
        }
      );
      if (res.data?.success) {
        showAlert("Exit finalized successfully!");
        setSelectedRequest(null);
        await fetchSelfRequest();
        await fetchAllTeamRequests();
      } else {
        throw new Error(res.data?.error || "Finalize failed - no success response");
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.message || "Failed to finalize exit");
      showAlert("Finalize failed: " + (err.response?.data?.error || "Check console"));
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setErrorMessage("");
    if (!form.reason) return setErrorMessage("Please select a reason");
    if (form.reason === "Other" && !form.otherReason.trim()) {
      return setErrorMessage("Please specify the other reason");
    }
    if (!form.proposedLwd) return setErrorMessage("Please select proposed Last Working Day");
    setLoading(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/exit/apply`,
        {
          reason: form.reason,
          otherReason: form.reason === "Other" ? form.otherReason : null,
          proposedLwd: form.proposedLwd,
          comment: form.comment,
        },
        {
          headers: {
            "x-api-key": API_KEY,
            "x-employee-id": employeeId,
            "x-org-id": orgId,
          },
          withCredentials: true,
        }
      );
      showAlert("Resignation request submitted successfully");
      fetchSelfRequest();
      setForm({ reason: "", otherReason: "", proposedLwd: "", comment: "" });
    } catch (err) {
      setErrorMessage(err.response?.data?.error || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setErrorMessage("");
    if (!withdrawReason.trim()) return setErrorMessage("Please enter withdrawal reason");
    setLoading(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/exit/withdraw`,
        { exitId: selfRequest.id, reason: withdrawReason },
        {
          headers: {
            "x-api-key": API_KEY,
            "x-employee-id": employeeId,
            "x-org-id": orgId,
          },
          withCredentials: true,
        }
      );
      showAlert("Withdrawal request submitted successfully");
      fetchSelfRequest();
      setWithdrawReason("");
    } catch (err) {
      setErrorMessage(err.response?.data?.error || "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (reviewType, action) => {
    if (!selectedRequest) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const payload = {
        exitId: selectedRequest.id,
        comment: reviewComment || null,
      };
      let endpoint = "";
      let methodPayload = payload;
      const effectiveRole = role?.toLowerCase() === "manager" ? "supervisor" : role?.toLowerCase();
      if (reviewType === "normal") {
       if (effectiveRole === "hr" || effectiveRole === "admin") {
  if (action === "APPROVED") {
    if (!finalLwd) {
      setErrorMessage("Final Last Working Day is required to approve resignation");
      setLoading(false);
      return;
    }
    endpoint = `${BACKEND_URL}/api/exit/hr/final-approve`;  // keep same endpoint
    methodPayload = { ...payload, finalLwd };
  } else if (action === "REJECTED") {
    endpoint = `${BACKEND_URL}/api/exit/hr/action`;
    methodPayload = { ...payload, status: "REJECTED" };
  }
}
        else if (effectiveRole === "supervisor") {
          endpoint = `${BACKEND_URL}/api/exit/supervisor/action`;
          methodPayload = {
            ...payload,
            status: action,
            recommendedLwd: recommendedLwd || null,
          };
        }
        else {
          throw new Error(`Unauthorized role for normal resignation review`);
        }
      }
      else if (reviewType === "withdrawal") {
        if (effectiveRole === "hr") {
          endpoint = `${BACKEND_URL}/api/exit/hr/withdraw/final`;
          methodPayload = { ...payload, status: action };
        }
        else if (effectiveRole === "supervisor") {
          endpoint = `${BACKEND_URL}/api/exit/supervisor/withdraw`;
          methodPayload = { ...payload, status: action };
        }
        else {
          throw new Error(`Unauthorized role for withdrawal review`);
        }
      }
      else {
        throw new Error(`Unknown review type: ${reviewType}`);
      }
      const res = await axios.post(endpoint, methodPayload, {
        headers: {
          "x-api-key": API_KEY,
          "x-employee-id": employeeId,
          "x-org-id": orgId,
        },
        withCredentials: true,
      });
      if (res.data?.success) {
        showAlert("Action completed successfully");
        setSelectedRequest(null);
        setReviewComment("");
        setRecommendedLwd("");
        setFinalLwd("");
        await fetchAllTeamRequests();
        await fetchSelfRequest();
      } else {
        throw new Error(res.data?.error || "Backend did not confirm success");
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.error ||
        err.message ||
        "Failed to process review"
      );
    } finally {
      setLoading(false);
    }
  };

  const hasTeam = teamMembers.length > 0;
  // const isHr = role === "hr";
  const isHrOrAdmin = role === "hr" || role === "admin" || isAdmin;

  return (
    <>
      <div className="exf-container">
        {errorMessage && <div className="exf-error-banner">{errorMessage}</div>}
       {/* <div className="exf-tabs-wrapper">
  <div className="exf-tabs" role="tablist">
    <button
      type="button"
      role="tab"
      aria-selected={activeTab === "self"}
      aria-controls="tabpanel-self"
      id="tab-self"
      className={`exf-tab ${activeTab === "self" ? "exf-tab--active" : ""}`}
      onClick={() => setActiveTab("self")}
    >
      My Status
    </button>

    {hasTeam && (
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "team"}
        aria-controls="tabpanel-team"
        id="tab-team"
        className={`exf-tab ${activeTab === "team" ? "exf-tab--active" : ""}`}
        onClick={() => setActiveTab("team")}
      >
        My Team
      </button>
    )}

    {isHr && (
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "all"}
        aria-controls="tabpanel-all"
        id="tab-all"
        className={`exf-tab ${activeTab === "all" ? "exf-tab--active" : ""}`}
        onClick={() => setActiveTab("all")}
      >
        All Employees
      </button>
    )}
  </div>
</div> */}<div className="exf-tabs-wrapper">
  <div className="exf-tabs" role="tablist">

    {/* My Status – shown to everyone EXCEPT pure Admin */}
    {!isAdmin && (
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "self"}
        className={`exf-tab ${activeTab === "self" ? "exf-tab--active" : ""}`}
        onClick={() => setActiveTab("self")}
      >
        My Status
      </button>
    )}

    {/* My Team – shown to HR (only if they have team) + Supervisors/Managers (if they have team) */}
    {hasTeam && !isAdmin && (
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "team"}
        className={`exf-tab ${activeTab === "team" ? "exf-tab--active" : ""}`}
        onClick={() => setActiveTab("team")}
      >
        My Team
      </button>
    )}

    {/* All Employees – shown to HR and Admin */}
    {(isHrOrAdmin) && (
  <button
    type="button"
    role="tab"
    aria-selected={activeTab === "all"}
    className={`exf-tab ${activeTab === "all" ? "exf-tab--active" : ""}`}
    onClick={() => setActiveTab("all")}
  >
    All Employees
  </button>
)}

  </div>
</div>
        {(role === "employee" || activeTab === "self") && (
          <div className="exf-card exf-self-view">
            {selfRequest && selfRequest.is_active === 1 ? (
              <div className="exf-section">
                <h2 className="exf-title">My Resignation Status</h2>
                <div className="exf-status-grid">
                  <div className="exf-status-item">
                    <span className="exf-status-label">Reason</span>
                    <span className="exf-status-value">
                      {selfRequest.reason}
                      {selfRequest.other_reason && ` (${selfRequest.other_reason})`}
                    </span>
                  </div>
                  <div className="exf-status-item">
                    <span className="exf-status-label">Proposed LWD</span>
                    <span className="exf-status-value">
                      {selfRequest.proposed_lwd
                        ? new Date(selfRequest.proposed_lwd).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                  <div className="exf-status-item">
                    <span className="exf-status-label">Supervisor</span>
                    <span className={`badge badge-${(selfRequest.supervisor_status || "pending").toLowerCase()}`}>
                      {selfRequest.supervisor_status || "Pending"}
                    </span>
                  </div>
                  {selfRequest.supervisor_comment && (
                    <div className="exf-status-item exf-full-width">
                      <span className="exf-status-label">Supervisor Comment</span>
                      <div className="exf-comment-box">{selfRequest.supervisor_comment}</div>
                    </div>
                  )}
                  <div className="exf-status-item">
                    <span className="exf-status-label">HR</span>
                    <span className={`badge badge-${(selfRequest.hr_status || "pending").toLowerCase()}`}>
                      {selfRequest.hr_status || "Pending"}
                    </span>
                  </div>
                  {selfRequest.withdrawal_requested_at && (
                    <div className="exf-status-item exf-full-width exf-withdrawal-status">
                      <h3>Withdrawal Request</h3>
                      <p><strong>Status:</strong> {selfRequest.withdrawal_supervisor_status || "Pending"}</p>
                      {selfRequest.withdrawal_supervisor_status === "APPROVED" && (
                        <p className="exf-awaiting">Awaiting HR decision</p>
                      )}
                      {selfRequest.withdrawal_reason && (
                        <p><strong>Reason:</strong> {selfRequest.withdrawal_reason}</p>
                      )}
                    </div>
                  )}
                </div>
                {!selfRequest.withdrawal_requested_at && !selfRequest.final_outcome && (
                  <div className="exf-withdraw-section mt-6">
                    <h3>Request to Withdraw Resignation</h3>
                    <p className="exf-help-text">
                      You can still cancel this resignation before final approval.
                    </p>
                    {/* <div className="exf-divider" > */}
                    <textarea className="exf-divider" 
                    
                      placeholder="Reason for withdrawal..."
                      value={withdrawReason}
                      onChange={(e) => setWithdrawReason(e.target.value)}
                    />
                    {/* </div> */}

                    <button
                      className="btn btn-warning exf-full-width mt-4"
                      onClick={handleWithdraw}
                      disabled={loading}
                    >
                      {loading ? "Submitting..." : "Request Withdrawal"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="exf-section">
               {selfRequest && selfRequest.final_outcome ? (
  <div
    className={`exf-outcome-box exf-outcome--${selfRequest.final_outcome.toLowerCase()}`}
    style={{ marginBottom: "2rem" }}
  >
    <div className="exf-outcome-icon">
      {selfRequest.final_outcome === "RESIGNED" && "✓"}
      {selfRequest.final_outcome === "REJECTED" && "✗"}
      {selfRequest.final_outcome === "WITHDRAWN" && "↩"}
    </div>
    <h2 className="exf-outcome-title">
      {selfRequest.final_outcome === "RESIGNED" && "Resignation Approved"}
      {selfRequest.final_outcome === "REJECTED" && "Resignation Not Approved"}
      {selfRequest.final_outcome === "WITHDRAWN" && "Resignation Withdrawn"}
    </h2>

    {selfRequest.final_outcome === "RESIGNED" && (
      <>
        <p className="exf-outcome-message">
          Your resignation is final. Contact HR if needed.
          <br />
          <strong>Last Working Day:</strong>{" "}
          {selfRequest.final_lwd
            ? new Date(selfRequest.final_lwd).toLocaleDateString()
            : selfRequest.proposed_lwd
            ? new Date(selfRequest.proposed_lwd).toLocaleDateString()
            : "To be confirmed"}
        </p>
        <div className="mt-6 pt-5 border-t border-gray-200">
          <h3 className="text-base font-semibold mb-4">Exit Clearance</h3>
          {exitCompleted ? (
            <div className="bg-green-50 p-6 rounded-lg text-center">
              <h4 className="text-lg font-semibold text-green-800 mb-2">
                Your Exit Flow is Completed!
              </h4>
              <p className="text-sm text-green-700">
                All the best for your future endeavors!
              </p>
            </div>
          ) : (
            <>
              <div className="exf-tabs-wrapper mb-4">
                <div className="exf-tabs">
                  <button
                    className={`exf-tab ${clearanceActiveTab === "kt" ? "exf-tab--active" : ""}`}
                    onClick={() => setClearanceActiveTab("kt")}
                  >
                    KT Plan
                  </button>
                  <button
                    className={`exf-tab ${clearanceActiveTab === "assets" ? "exf-tab--active" : ""}`}
                    onClick={() => setClearanceActiveTab("assets")}
                  >
                    Assets
                  </button>
                </div>
              </div>
              {clearanceActiveTab === "kt" && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Knowledge Transfer Clearance
                    </h3>
                    <button
                      onClick={() => setShowAddKTModal(true)}
                      className="btn btn-primary px-5 py-2 text-sm"
                    >
                      + Add KT Plan
                    </button>
                  </div>
                  {ktPlans.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                      <p className="text-gray-500 mb-3">No KT plans added yet.</p>
                      <p className="text-sm text-gray-600">
                        Add your handover topics and upload related documents.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ktPlans.map((kt) => (
                        <div
                          key={kt.id}
                          className="border rounded-lg p-4 bg-white shadow-sm relative"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{kt.title}</p>
                              <p className="text-sm text-gray-600 mt-1">{kt.description}</p>
                              {kt.attached_files && kt.attached_files.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  <p className="text-xs font-medium text-gray-700">Uploaded files:</p>
                                  {kt.attached_files.map((file, idx) => {
                                    const fileName = file.split("/").pop();
                                    return (
                                      <div key={idx} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                                        <span className="text-sm text-gray-700 truncate">{fileName}</span>
                                        <div className="flex gap-2">
                                          <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => viewFile(file)}
                                          >
                                            View
                                          </button>
                                          <button
                                            className="btn btn-outline btn-sm"
                                            onClick={() => downloadFile(file, fileName)}
                                          >
                                            Download
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              <p className="text-sm mt-2">
                                <strong>Status:</strong> {kt.status || "Pending"}
                              </p>
                            </div>
                            <div className="ml-4 text-right flex flex-col gap-2">
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => startEditKt(kt)}
                                disabled={loading}
                              >
                                Edit
                              </button>
                              <div className="space-y-2 text-sm">
                                <label className="flex items-center justify-end">
                                  <input
                                    type="checkbox"
                                    checked={kt.supervisor_approved || false}
                                    onChange={(e) =>
                                      handleApproveItem(kt.id, e.target.checked, "KT")
                                    }
                                    disabled={!["supervisor", "manager"].includes(role)}
                                    className="h-4 w-4"
                                  />
                                  <span className="ml-2">Supervisor Approved</span>
                                </label>
                                <label className="flex items-center justify-end">
                                  <input
                                    type="checkbox"
                                    checked={kt.hr_approved || false}
                                    onChange={(e) =>
                                      handleApproveItem(kt.id, e.target.checked, "KT")
                                    }
                                    disabled={role !== "hr"}
                                    className="h-4 w-4"
                                  />
                                  <span className="ml-2">HR Approved</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {clearanceActiveTab === "assets" && (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-lg border border-gray-200">
                    <h4 className="font-medium mb-4">Add New Asset</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <input
                        type="text"
                        placeholder="Asset Name (e.g. Laptop Dell XYZ - SN123)"
                        value={newAssetForm.name}
                        onChange={(e) =>
                          setNewAssetForm({ ...newAssetForm, name: e.target.value })
                        }
                        className="p-2 border rounded"
                      />
                      <input
                        type="date"
                        placeholder="Return Date"
                        value={newAssetForm.returnDate}
                        onChange={(e) =>
                          setNewAssetForm({ ...newAssetForm, returnDate: e.target.value })
                        }
                        className="p-2 border rounded"
                      />
                      <button
                        className="btn btn-primary"
                        onClick={handleAddAsset}
                        disabled={loading}
                      >
                        Add Asset
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {assets.map((asset) => (
                      <div
                        key={asset.id}
                        className="bg-gray-50 p-4 rounded border"
                      >
                        <h5 className="font-medium">{asset.title}</h5>
                        <p>
                          Return Date:{" "}
                          {asset.planned_date
                            ? new Date(asset.planned_date).toLocaleDateString()
                            : "—"}
                        </p>
                        <div className="mt-2 text-sm">
                          Supervisor Approved: {asset.supervisor_approved ? "Yes" : "No"}
                          <br />
                          HR Approved: {asset.hr_approved ? "Yes" : "No"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </>
    )}

    {selfRequest.final_outcome === "REJECTED" && (
      <p className="exf-outcome-message text-sm mt-4">
        Previous resignation was rejected.
      </p>
    )}
    {selfRequest.final_outcome === "WITHDRAWN" && (
      <p className="exf-outcome-message text-sm mt-4">
        Resignation withdrawn. You are active again.
      </p>
    )}

    <div className="text-xs text-gray-500 mt-3">
      Finalized:{" "}
      {selfRequest.hr_action_at
        ? new Date(selfRequest.hr_action_at).toLocaleString()
        : "—"}
    </div>
  </div>
) : null}

{/* Show resignation apply area when there is no request or the previous one was withdrawn/rejected */}
{(!selfRequest ||
  (selfRequest &&
    selfRequest.final_outcome &&
    ["WITHDRAWN", "REJECTED"].includes(selfRequest.final_outcome))) && (
  <div className="exf-resignation-wrapper">
    {!showResignationForm ? (
      <div className="exf-resignation-apply-area">
        <h2 className="exf-section-title">Submit Resignation Request</h2>
        <p className="exf-resignation-info">
          {selfRequest?.final_outcome === "WITHDRAWN"
            ? "Your previous resignation was withdrawn. You may submit a new request."
            : selfRequest?.final_outcome === "REJECTED"
            ? "Your previous resignation was not approved. You may apply again."
            : "Ready to resign? Click the button below to start the process. Your request will be reviewed by your supervisor and HR."}
        </p>
        <button
          type="button"
          className="exf-btn exf-btn--primary exf-resignation-apply-btn"
          onClick={() => setShowResignationForm(true)}
          disabled={loading}
        >
          Apply for Resignation
        </button>
      </div>
    ) : (
      <div className="exf-resignation-form-container">
        <div className="exf-resignation-form-header">
          <h3 className="exf-resignation-form-title">Resignation Details</h3>
          <button
            type="button"
            className="exf-resignation-close-btn"
            onClick={() => setShowResignationForm(false)}
            aria-label="Close resignation form"
          >
            ×
          </button>
        </div>
        <form className="exf-resignation-form">
          <div className="exf-form-grid">
            <div className="exf-form-group exf-form-group--full">
              <label className="exf-form-label exf-form-label--required">
                Reason for leaving
              </label>
              <select
                className="exf-form-select"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                required
              >
                <option value="">-- Select Reason --</option>
                <option value="Career Growth">Career Growth</option>
                <option value="Higher Studies">Higher Studies</option>
                <option value="Personal Reasons">Personal Reasons</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {form.reason === "Other" && (
              <div className="exf-form-group exf-form-group--full">
                <label className="exf-form-label exf-form-label--required">
                  Please specify
                </label>
                <textarea
                  className="exf-form-textarea"
                  placeholder="Enter your specific reason..."
                  value={form.otherReason}
                  onChange={(e) => setForm({ ...form, otherReason: e.target.value })}
                  rows={3}
                  required
                />
              </div>
            )}
            <div className="exf-form-group">
              <label className="exf-form-label exf-form-label--required">
                Proposed Last Working Day
              </label>
              <input
                type="date"
                className="exf-form-input"
                value={form.proposedLwd}
                onChange={(e) => setForm({ ...form, proposedLwd: e.target.value })}
                required
              />
            </div>
            <div className="exf-form-group exf-form-group--full">
              <label className="exf-form-label">Additional Comments (optional)</label>
              <textarea
                className="exf-form-textarea"
                placeholder="Any remarks or additional information..."
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <div className="exf-resignation-actions">
            <button
              type="button"
              className="exf-btn exf-btn--secondary"
              onClick={() => setShowResignationForm(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="exf-btn exf-btn--primary"
              onClick={handleApply}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Resignation"}
            </button>
          </div>
        </form>
      </div>
    )}
  </div>
)}
                {/* {(!selfRequest ||
                  !selfRequest.final_outcome ||
                  selfRequest.final_outcome !== "RESIGNED") && (
                  <>
                    <h2 className="exf-title">Submit Resignation Request</h2>
                    <form className="exf-form">
                      <div className="exf-form-group">
                        <label>Reason for leaving</label>
                        <select
                          value={form.reason}
                          onChange={(e) => setForm({ ...form, reason: e.target.value })}
                        >
                          <option value="">-- Select Reason --</option>
                          <option value="Career Growth">Career Growth</option>
                          <option value="Higher Studies">Higher Studies</option>
                          <option value="Personal Reasons">Personal Reasons</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      {form.reason === "Other" && (
                        <div className="exf-form-group">
                          <label>Please specify</label>
                          <textarea
                            placeholder="Enter your specific reason..."
                            value={form.otherReason}
                            onChange={(e) => setForm({ ...form, otherReason: e.target.value })}
                          />
                        </div>
                      )}
                      <div className="exf-form-group">
                        <label>Proposed Last Working Day</label>
                        <input
                          type="date"
                          value={form.proposedLwd}
                          onChange={(e) => setForm({ ...form, proposedLwd: e.target.value })}
                        />
                      </div>
                      <div className="exf-form-group">
                        <label>Additional Comments (optional)</label>
                        <textarea
                          placeholder="Any remarks or additional information..."
                          value={form.comment}
                          onChange={(e) => setForm({ ...form, comment: e.target.value })}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary exf-full-width"
                        onClick={handleApply}
                        disabled={loading}
                      >
                        {loading ? "Submitting..." : "Submit Resignation"}
                      </button>
                    </form>
                  </>
                )} */}
              </div>
            )}
          </div>
        )}

        {activeTab === "team" && hasTeam && (
          <div className="exf-team-view space-y-8">
            {loadingTeamMembers ? (
              <div className="text-center py-10">
                <div className="spinner"></div>
                <p>Loading your team members...</p>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm bg-gray-50 rounded-lg border border-gray-200">
                No team members found under you.
              </div>
            ) : (
              <>
                {/* <div className="exf-team-panel">
                  <h2 className="exf-panel-title mb-3">
                    Exit Requests from My Team ({teamMembers.length} members)
                  </h2>
                  {allTeamRequests.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 text-sm bg-gray-50 rounded-lg border border-gray-200">
                      No exit requests submitted by your team members yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Emp ID</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reason</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Proposed LWD</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Supervisor</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">HR</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Outcome</th>
                            <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {allTeamRequests.map((req) => (
                            <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.employee_id}</td>
                              <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">{req.employee_name || "—"}</td>
                              <td className="px-5 py-4 text-sm text-gray-700 max-w-xs truncate">{req.reason}</td>
                              <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                                {req.proposed_lwd ? new Date(req.proposed_lwd).toLocaleDateString() : "—"}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                                <span className={`badge badge-${(req.supervisor_status || "pending").toLowerCase()}`}>
                                  {req.supervisor_status || "Pending"}
                                </span>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                                <span className={`badge badge-${(req.hr_status || "pending").toLowerCase()}`}>
                                  {req.hr_status || "Pending"}
                                </span>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                                {req.final_outcome || "Active"}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-center">
                                <button
                                  className="btn btn-review px-4 py-1.5 text-sm"
                                  onClick={() => setSelectedRequest({ ...req, type: req.final_outcome === "RESIGNED" ? "clearance" : "normal" })}
                                >
                                  Review
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="exf-team-panel">
                  <h2 className="exf-panel-title mb-3">Pending Resignations (My Team)</h2>
                  {pendingData.normal.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 text-sm bg-gray-50 rounded-lg border border-gray-200">
                      No pending resignation requests
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Emp ID</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reason</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Proposed LWD</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Applied On</th>
                            <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {pendingData.normal.map((req) => (
                            <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.employee_id}</td>
                              <td className="px-5 py-4 text-sm text-gray-700 max-w-xs truncate">{req.reason}</td>
                              <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                                {req.proposed_lwd ? new Date(req.proposed_lwd).toLocaleDateString() : "—"}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(req.applied_at).toLocaleDateString()}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-center">
                                <button
                                  className="btn btn-review px-4 py-1.5 text-sm"
                                  onClick={() => setSelectedRequest({ ...req, type: req.final_outcome === "RESIGNED" ? "clearance" : "normal" })}
                                >
                                  Review
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="exf-team-panel">
                  <h2 className="exf-panel-title mb-3">Pending Withdrawal Requests (My Team)</h2>
                  {pendingData.withdraw.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 text-sm bg-gray-50 rounded-lg border border-gray-200">
                      No pending withdrawal requests
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Emp ID</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reason</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Requested On</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Supervisor</th>
                            <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {pendingData.withdraw.map((req) => (
                            <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.employee_id}</td>
                              <td className="px-5 py-4 text-sm text-gray-700 max-w-xs truncate">{req.withdrawal_reason || "—"}</td>
                              <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                                {req.withdrawal_requested_at ? new Date(req.withdrawal_requested_at).toLocaleString() : "—"}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                                {req.withdrawal_supervisor_status || "Pending"}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-center">
                                <button
                                  className="btn btn-review px-4 py-1.5 text-sm"
                                  onClick={() => setSelectedRequest({ ...req, type: "withdrawal" })}
                                >
                                  Review
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div> */}
                {/* Exit Requests from My Team */}
<div className="exf-team-panel">
  <h2 className="exf-panel-title mb-4">
    Exit Requests from My Team <span className="exf-count">({teamMembers.length} members)</span>
  </h2>

  {allTeamRequests.length === 0 ? (
    <div className="exf-empty-state">
      No exit requests submitted by your team members yet.
    </div>
  ) : (
    <div className="exf-table-container">
      <table className="exf-table">
        <thead>
          <tr>
            <th>Emp ID</th>
            <th>Name</th>
            <th>Reason</th>
            <th>Proposed LWD</th>
            <th>Supervisor</th>
            <th>HR</th>
            <th>Outcome</th>
            <th className="text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {allTeamRequests.map((req) => (
            <tr key={req.id}>
              <td className="font-medium">{req.employee_id}</td>
              <td>{req.employee_name || "—"}</td>
              <td className="max-w-xs truncate">{req.reason}</td>
              <td>
                {req.proposed_lwd
                  ? new Date(req.proposed_lwd).toLocaleDateString()
                  : "—"}
              </td>
              <td>
                <span className={`exf-badge exf-badge-${(req.supervisor_status || "pending").toLowerCase()}`}>
                  {req.supervisor_status || "Pending"}
                </span>
              </td>
              <td>
                <span className={`exf-badge exf-badge-${(req.hr_status || "pending").toLowerCase()}`}>
                  {req.hr_status || "Pending"}
                </span>
              </td>
              <td>{req.final_outcome || "Active"}</td>
              <td className="text-center">
                <button
                  className="exf-btn-review"
                  onClick={() => setSelectedRequest({ ...req, type: req.final_outcome === "RESIGNED" ? "clearance" : "normal" })}
                >
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

{/* Pending Resignations (My Team) */}
<div className="exf-team-panel">
  <h2 className="exf-panel-title mb-4">Pending Resignations (My Team)</h2>

  {pendingData.normal.length === 0 ? (
    <div className="exf-empty-state">
      No pending resignation requests
    </div>
  ) : (
    <div className="exf-table-container">
      <table className="exf-table">
        <thead>
          <tr>
            <th>Emp ID</th>
            <th>Reason</th>
            <th>Proposed LWD</th>
            <th>Applied On</th>
            <th className="text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {pendingData.normal.map((req) => (
            <tr key={req.id}>
              <td className="font-medium">{req.employee_id}</td>
              <td className="max-w-xs truncate">{req.reason}</td>
              <td>
                {req.proposed_lwd
                  ? new Date(req.proposed_lwd).toLocaleDateString()
                  : "—"}
              </td>
              <td>{new Date(req.applied_at).toLocaleDateString()}</td>
              <td className="text-center">
                <button
                  className="exf-btn-review"
                  onClick={() => setSelectedRequest({ ...req, type: req.final_outcome === "RESIGNED" ? "clearance" : "normal" })}
                >
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

{/* Pending Withdrawal Requests (My Team) */}
<div className="exf-team-panel">
  <h2 className="exf-panel-title mb-4">Pending Withdrawal Requests (My Team)</h2>

  {pendingData.withdraw.length === 0 ? (
    <div className="exf-empty-state">
      No pending withdrawal requests
    </div>
  ) : (
    <div className="exf-table-container">
      <table className="exf-table">
        <thead>
          <tr>
            <th>Emp ID</th>
            <th>Reason</th>
            <th>Requested On</th>
            <th>Supervisor</th>
            <th className="text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {pendingData.withdraw.map((req) => (
            <tr key={req.id}>
              <td className="font-medium">{req.employee_id}</td>
              <td className="max-w-xs truncate">{req.withdrawal_reason || "—"}</td>
              <td>
                {req.withdrawal_requested_at
                  ? new Date(req.withdrawal_requested_at).toLocaleString()
                  : "—"}
              </td>
              <td>
                <span className={`exf-badge exf-badge-${(req.withdrawal_supervisor_status || "pending").toLowerCase()}`}>
                  {req.withdrawal_supervisor_status || "Pending"}
                </span>
              </td>
              <td className="text-center">
                <button
                  className="exf-btn-review"
                  onClick={() => setSelectedRequest({ ...req, type: "withdrawal" })}
                >
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
                {["hr", "supervisor", "manager"].includes(role) && (
                  // <div className="exf-team-panel mt-8 border-t pt-6">
                  //   <h2 className="exf-panel-title mb-3">
                  //     Resigned Employees & Clearance Status
                  //   </h2>
                  //   {resignedClearance.length === 0 ? (
                  //     <div className="text-center py-10 text-gray-500 text-sm bg-gray-50 rounded-lg border border-gray-200">
                  //       No resigned employees to review
                  //     </div>
                  //   ) : (
                  //     <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                  //       <table className="min-w-full divide-y divide-gray-200">
                  //         <thead className="bg-gray-50">
                  //           <tr>
                  //             <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Emp ID</th>
                  //             <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Final LWD</th>
                  //             <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Prop. KT</th>
                  //             <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Prop. Assets</th>
                  //             <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Final KT</th>
                  //             <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Final Assets</th>
                  //             <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  //             <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                  //           </tr>
                  //         </thead>
                  //         <tbody className="divide-y divide-gray-100 bg-white">
                  //           {resignedClearance.map((req) => (
                  //             <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                  //               <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{req.employee_id}</td>
                  //               <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  //                 {req.final_lwd ? new Date(req.final_lwd).toLocaleDateString() : "—"}
                  //               </td>
                  //               <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  //                 {req.kt_proposed_date ? new Date(req.kt_proposed_date).toLocaleDateString() : "—"}
                  //               </td>
                  //               <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  //                 {req.assets_proposed_date ? new Date(req.assets_proposed_date).toLocaleDateString() : "—"}
                  //               </td>
                  //               <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  //                 {req.kt_planned_date ? new Date(req.kt_planned_date).toLocaleDateString() : "—"}
                  //               </td>
                  //               <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  //                 {req.assets_return_planned_date ? new Date(req.assets_return_planned_date).toLocaleDateString() : "—"}
                  //               </td>
                  //               <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                  //                 <span
                  //                   className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  //                     req.kt_completed && req.assets_returned
                  //                       ? "bg-green-100 text-green-800"
                  //                       : "bg-amber-100 text-amber-800"
                  //                   }`}
                  //                 >
                  //                   {req.kt_completed && req.assets_returned ? "Cleared" : "Pending"}
                  //                 </span>
                  //               </td>
                  //               <td className="px-4 py-3 whitespace-nowrap text-center">
                  //                 <button
                  //                   className="btn btn-review px-4 py-1.5 text-xs"
                  //                   onClick={() => setSelectedRequest({ ...req, type: "clearance" })}
                  //                 >
                  //                   Review
                  //                 </button>
                  //               </td>
                  //             </tr>
                  //           ))}
                  //         </tbody>
                  //       </table>
                  //     </div>
                  //   )}
                  // </div>
//                   <div className="exf-team-panel mt-8 border-t pt-6">
//   <h2 className="exf-panel-title mb-4">
//     Resigned Employees & Clearance Status
//     <span className="exf-count-badge">({resignedClearance.length})</span>
//   </h2>

//   {resignedClearance.length === 0 ? (
//     <div className="exf-empty-state">
//       No resigned employees to review
//     </div>
//   ) : (
//     <div className="exf-table-container">
//       <table className="exf-clearance-table">
//         <thead>
//           <tr>
//             <th>Emp ID</th>
//             <th>Final LWD</th>
//             <th>Prop. KT</th>
//             <th>Prop. Assets</th>
//             <th>Final KT</th>
//             <th>Final Assets</th>
//             <th className="text-center">Status</th>
//             <th className="text-center">Action</th>
//           </tr>
//         </thead>
//         <tbody>
//           {resignedClearance.map((req) => (
//             <tr key={req.id}>
//               <td className="font-medium">{req.employee_id}</td>
//               <td>
//                 {req.final_lwd
//                   ? new Date(req.final_lwd).toLocaleDateString()
//                   : "—"}
//               </td>
//               <td>
//                 {req.kt_proposed_date
//                   ? new Date(req.kt_proposed_date).toLocaleDateString()
//                   : "—"}
//               </td>
//               <td>
//                 {req.assets_proposed_date
//                   ? new Date(req.assets_proposed_date).toLocaleDateString()
//                   : "—"}
//               </td>
//               <td>
//                 {req.kt_planned_date
//                   ? new Date(req.kt_planned_date).toLocaleDateString()
//                   : "—"}
//               </td>
//               <td>
//                 {req.assets_return_planned_date
//                   ? new Date(req.assets_return_planned_date).toLocaleDateString()
//                   : "—"}
//               </td>
//               <td className="text-center">
//                 <span
//                   className={`exf-status-badge ${
//                     req.kt_completed && req.assets_returned
//                       ? "exf-badge-cleared"
//                       : "exf-badge-pending"
//                   }`}
//                 >
//                   {req.kt_completed && req.assets_returned ? "Cleared" : "Pending"}
//                 </span>
//               </td>
//               <td className="text-center">
//                 <button
//                   className="exf-btn-review"
//                   onClick={() => setSelectedRequest({ ...req, type: "clearance" })}
//                 >
//                   Review
//                 </button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   )}
// </div>
//                <div className="exf-team-panel mt-8 border-t border-gray-200 pt-6">
//   <h2 className="exf-panel-title mb-4">
//     Resigned Employees & Clearance Status ({resignedClearance.length})
//   </h2>

//   {resignedClearance.length === 0 ? (
//     <div className="exf-empty-state">
//       No resigned employees requiring clearance in the organization
//     </div>
//   ) : (
//     <div className="exf-table-wrapper">
//       <table className="exf-data-table">
//         <thead>
//           <tr>
//             <th>Emp ID</th>
//             <th>Final LWD</th>
//             <th>KT Clearance</th>
//             <th>Assets Clearance</th>
//             <th className="text-center">Overall Status</th>
//             <th className="text-center">Action</th>
//           </tr>
//         </thead>

//         <tbody>
//           {resignedClearance.map((req) => {
//             // You can adjust logic based on your actual data structure
//             const ktFullyApproved = req.kt_supervisor_approved && req.kt_hr_approved;
//             const assetsFullyApproved = req.assets_supervisor_approved && req.assets_hr_approved;

//             const ktStatusClass = ktFullyApproved
//               ? "exf-badge-success"
//               : "exf-badge-pending";
//             const assetsStatusClass = assetsFullyApproved
//               ? "exf-badge-success"
//               : "exf-badge-pending";

//             const overallCleared = ktFullyApproved && assetsFullyApproved;

//             return (
//               <tr key={req.id} className="exf-table-row">
//                 <td className="exf-table-cell font-medium text-gray-900">
//                   {req.employee_id}
//                 </td>
//                 <td className="exf-table-cell whitespace-nowrap text-gray-600">
//                   {req.final_lwd
//                     ? new Date(req.final_lwd).toLocaleDateString("en-GB", {
//                         day: "2-digit",
//                         month: "short",
//                         year: "numeric",
//                       })
//                     : "—"}
//                 </td>

//                 {/* KT Clearance */}
//                 <td className="exf-table-cell text-center">
//                   <span className={`exf-badge ${ktStatusClass}`}>
//                     {ktFullyApproved ? "Approved" : "Pending"}
//                   </span>
//                 </td>

//                 {/* Assets Clearance */}
//                 <td className="exf-table-cell text-center">
//                   <span className={`exf-badge ${assetsStatusClass}`}>
//                     {assetsFullyApproved ? "Approved" : "Pending"}
//                   </span>
//                 </td>

//                 {/* Overall */}
//                 <td className="exf-table-cell text-center">
//                   <span
//                     className={`exf-badge ${
//                       overallCleared ? "exf-badge-success" : "exf-badge-pending"
//                     }`}
//                   >
//                     {overallCleared ? "Cleared" : "Pending"}
//                   </span>
//                 </td>

//                 <td className="exf-table-cell text-center">
//                   <button
//                     className="exf-btn exf-btn-primary exf-btn-sm"
//                     onClick={() => setSelectedRequest({ ...req, type: "clearance" })}
//                   >
//                     Review
//                   </button>
//                 </td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>
//   )}
// </div>

<div className="exf-team-panel mt-8 border-t border-gray-200 pt-6">
  <h2 className="exf-panel-title mb-4">
    Resigned Employees & Clearance Status ({resignedClearance.length})
  </h2>

  {resignedClearance.length === 0 ? (
    <div className="exf-empty-state">
      No resigned employees requiring clearance in the organization
    </div>
  ) : (
    <div className="exf-table-wrapper">
      <table className="exf-data-table">
        <thead>
          <tr>
            <th>Emp ID</th>
            <th>Final LWD</th>
            <th className="text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {resignedClearance.map((req) => (
            <tr key={req.id} className="exf-table-row">
              <td className="exf-table-cell font-medium text-gray-900">
                {req.employee_id}
              </td>
              <td className="exf-table-cell whitespace-nowrap text-gray-600">
                {req.final_lwd
                  ? new Date(req.final_lwd).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </td>
              <td className="exf-table-cell text-center">
                <button
                  className="exf-btn exf-btn-primary exf-btn-sm"
                  onClick={() => setSelectedRequest({ ...req, type: "clearance" })}
                >
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
               )}
              </>
            )}
          </div>
        )}

{(role === "hr" || role === "admin" || isAdmin) && activeTab === "all" && (          <div className="exf-team-view space-y-8">
            {/* <div className="exf-team-panel">
              <h2 className="exf-panel-title mb-3">
                All Organization Exit Requests ({allTeamRequests.length})
              </h2>
              {allTeamRequests.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm bg-gray-50 rounded-lg border border-gray-200">
                  No exit requests found across the organization
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Emp ID</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reason</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Proposed LWD</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Supervisor</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">HR</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Outcome</th>
                        <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {allTeamRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.employee_id}</td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">{req.employee_name || "—"}</td>
                          <td className="px-5 py-4 text-sm text-gray-700 max-w-xs truncate">{req.reason}</td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                            {req.proposed_lwd ? new Date(req.proposed_lwd).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                            <span className={`badge badge-${(req.supervisor_status || "pending").toLowerCase()}`}>
                              {req.supervisor_status || "Pending"}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                            <span className={`badge badge-${(req.hr_status || "pending").toLowerCase()}`}>
                              {req.hr_status || "Pending"}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                            {req.final_outcome || "Active"}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-center">
                            <button
                              className="btn btn-review px-4 py-1.5 text-sm"
                              onClick={() => setSelectedRequest({ ...req, type: req.final_outcome === "RESIGNED" ? "clearance" : "normal" })}
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div> */}

            <div className="exf-team-panel">
  <h2 className="exf-panel-title">
    All Organization Exit Requests ({allTeamRequests.length})
  </h2>

  {allTeamRequests.length === 0 ? (
    <div className="exf-empty-state">
      No exit requests found across the organization.
    </div>
  ) : (
    <div className="exf-table-wrapper">
      <table className="exf-data-table">
        <thead>
          <tr>
            <th>Emp ID</th>
            <th>Name</th>
            <th>Reason</th>
            <th>Proposed LWD</th>
            <th>Supervisor</th>
            <th>HR</th>
            <th>Outcome</th>
            <th className="text-center">Action</th>
          </tr>
        </thead>

        <tbody>
          {allTeamRequests.map((req) => (
            <tr key={req.id} className="exf-table-row">
              <td className="exf-table-cell font-medium text-gray-900">
                {req.employee_id}
              </td>
              <td className="exf-table-cell text-gray-700">
                {req.employee_name || "—"}
              </td>
              <td className="exf-table-cell text-gray-700 max-w-md truncate">
                {req.reason || "—"}
              </td>
              <td className="exf-table-cell whitespace-nowrap text-gray-600">
                {req.proposed_lwd
                  ? new Date(req.proposed_lwd).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </td>
              <td className="exf-table-cell">
                <span
                  className={`exf-badge exf-badge-${(req.supervisor_status || "pending").toLowerCase()}`}
                >
                  {req.supervisor_status || "Pending"}
                </span>
              </td>
              <td className="exf-table-cell">
                <span
                  className={`exf-badge exf-badge-${(req.hr_status || "pending").toLowerCase()}`}
                >
                  {req.hr_status || "Pending"}
                </span>
              </td>
              <td className="exf-table-cell text-gray-700">
                {req.final_outcome || "Active"}
              </td>
              <td className="exf-table-cell text-center">
                <button
                  className="exf-btn exf-btn-primary exf-btn-sm"
                  onClick={() =>
                    setSelectedRequest({
                      ...req,
                      type: req.final_outcome === "RESIGNED" ? "clearance" : "normal",
                    })
                  }
                >
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

            {/* NEW: Withdrawal Requests for HR (shows only what HR needs to act on) */}
            <div className="exf-team-panel mt-8 border-t pt-6">
              <h2 className="exf-panel-title mb-3">
                Withdrawal Requests Awaiting HR Decision (All Employees)
              </h2>
              {(() => {
                // Filter: Requested + Supervisor approved + HR still pending
                const hrPendingWithdrawals = allTeamRequests.filter(
                  r =>
                    r.withdrawal_requested_at && // withdrawal was requested
                    r.withdrawal_supervisor_status === "APPROVED" && // supervisor approved
                    (r.withdrawal_hr_status === "PENDING" || !r.withdrawal_hr_status) // HR not yet acted
                );
                if (hrPendingWithdrawals.length === 0) {
                  return (
                    <div className="text-center py-10 text-gray-500 text-sm bg-gray-50 rounded-lg border border-gray-200">
                      No withdrawal requests awaiting HR decision
                    </div>
                  );
                }
                return (
                  <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Emp ID</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Withdrawal Reason</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Requested On</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Supervisor Status</th>
                          <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {hrPendingWithdrawals.map((req) => (
                          <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.employee_id}</td>
                            <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">{req.employee_name || "—"}</td>
                            <td className="px-5 py-4 text-sm text-gray-700 max-w-xs truncate">{req.withdrawal_reason || "—"}</td>
                            <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                              {req.withdrawal_requested_at ? new Date(req.withdrawal_requested_at).toLocaleString() : "—"}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                              Supervisor: {req.withdrawal_supervisor_status || "Pending"}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-center">
                              <button
                                className="btn btn-review px-4 py-1.5 text-sm"
                                onClick={() => setSelectedRequest({ ...req, type: "withdrawal" })}
                              >
                                Review (HR)
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Resigned & Clearance (HR only) */}
            {/* <div className="exf-team-panel mt-8 border-t pt-6">
              <h2 className="exf-panel-title mb-3">
                Resigned Employees & Clearance Status ({resignedClearance.length})
              </h2>
              {resignedClearance.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm bg-gray-50 rounded-lg border border-gray-200">
                  No resigned employees in the organization
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Emp ID</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Final LWD</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Prop. KT</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Prop. Assets</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Final KT</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Final Assets</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {resignedClearance.map((req) => (
                        <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{req.employee_id}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {req.final_lwd ? new Date(req.final_lwd).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {req.kt_proposed_date ? new Date(req.kt_proposed_date).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {req.assets_proposed_date ? new Date(req.assets_proposed_date).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {req.kt_planned_date ? new Date(req.kt_planned_date).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {req.assets_return_planned_date ? new Date(req.assets_return_planned_date).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                req.kt_completed && req.assets_returned
                                  ? "bg-green-100 text-green-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {req.kt_completed && req.assets_returned ? "Cleared" : "Pending"}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <button
                              className="btn btn-review px-4 py-1.5 text-xs"
                              onClick={() => setSelectedRequest({ ...req, type: "clearance" })}
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div> */}

            {/* <div className="exf-team-panel mt-8 border-t border-gray-200 pt-6">
  <h2 className="exf-panel-title mb-4">
    Resigned Employees & Clearance Status ({resignedClearance.length})
  </h2>

  {resignedClearance.length === 0 ? (
    <div className="exf-empty-state">
      No resigned employees requiring clearance in the organization
    </div>
  ) : (
    <div className="exf-table-wrapper">
      <table className="exf-data-table">
        <thead>
          <tr>
            <th>Emp ID</th>
            <th>Final LWD</th>
            <th>Proposed KT</th>
            <th>Proposed Assets</th>
            <th>Final KT</th>
            <th>Final Assets</th>
            <th className="text-center">Clearance Status</th>
            <th className="text-center">Action</th>
          </tr>
        </thead>

        <tbody>
          {resignedClearance.map((req) => (
            <tr key={req.id} className="exf-table-row">
              <td className="exf-table-cell font-medium text-gray-900">
                {req.employee_id}
              </td>
              <td className="exf-table-cell whitespace-nowrap text-gray-600">
                {req.final_lwd
                  ? new Date(req.final_lwd).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </td>
              <td className="exf-table-cell whitespace-nowrap text-gray-600">
                {req.kt_proposed_date
                  ? new Date(req.kt_proposed_date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </td>
              <td className="exf-table-cell whitespace-nowrap text-gray-600">
                {req.assets_proposed_date
                  ? new Date(req.assets_proposed_date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </td>
              <td className="exf-table-cell whitespace-nowrap text-gray-600">
                {req.kt_planned_date
                  ? new Date(req.kt_planned_date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </td>
              <td className="exf-table-cell whitespace-nowrap text-gray-600">
                {req.assets_return_planned_date
                  ? new Date(req.assets_return_planned_date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </td>
              <td className="exf-table-cell text-center">
                <span
                  className={`exf-badge ${
                    req.kt_completed && req.assets_returned
                      ? "exf-badge-success"
                      : "exf-badge-pending"
                  }`}
                >
                  {req.kt_completed && req.assets_returned ? "Cleared" : "Pending"}
                </span>
              </td>
              <td className="exf-table-cell text-center">
                <button
                  className="exf-btn exf-btn-primary exf-btn-sm"
                  onClick={() => setSelectedRequest({ ...req, type: "clearance" })}
                >
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div> */}
<div className="exf-team-panel mt-8 border-t border-gray-200 pt-6">
  <h2 className="exf-panel-title mb-4">
    Resigned Employees & Clearance Status ({resignedClearance.length})
  </h2>

  {resignedClearance.length === 0 ? (
    <div className="exf-empty-state">
      No resigned employees requiring clearance in the organization
    </div>
  ) : (
    <div className="exf-table-wrapper">
      <table className="exf-data-table">
        <thead>
          <tr>
            <th>Emp ID</th>
            <th>Final LWD</th>
            <th className="text-center">Clearance Status</th>
            <th className="text-center">Action</th>
          </tr>
        </thead>

        <tbody>
          {resignedClearance.map((req) => (
            <tr key={req.id} className="exf-table-row">
              <td className="exf-table-cell font-medium text-gray-900">
                {req.employee_id}
              </td>

              <td className="exf-table-cell whitespace-nowrap text-gray-600">
                {req.final_lwd
                  ? new Date(req.final_lwd).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </td>

              <td className="exf-table-cell text-center">
                <span
                  className={`exf-badge ${
                    req.kt_completed && req.assets_returned
                      ? "exf-badge-success"
                      : "exf-badge-pending"
                  }`}
                >
                  {req.kt_completed && req.assets_returned ? "Cleared" : "Pending"}
                </span>
              </td>

              <td className="exf-table-cell text-center">
                <button
                  className="exf-btn exf-btn-primary exf-btn-sm"
                  onClick={() => setSelectedRequest({ ...req, type: "clearance" })}
                >
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
          </div>
        )}

        {/* Review Modal */}
        {selectedRequest && (
          <div className="exf-modal-backdrop">
           <div className="exf-modal-content">
  <h3 className="exf-modal-title">
    {selectedRequest.type === "normal" ? "Resignation Review" :
     selectedRequest.type === "withdrawal" ? "Withdrawal Review" :
     "Clearance Review"}
  </h3>

 <div className="exf-info-grid">
    <div className="exf-info-row">
      <span className="exf-label">Employee</span>
      <span className="exf-value">{selectedRequest.employee_id}</span>
    </div>
    {/* ── Final LWD field – shown ONLY when HR is reviewing a normal resignation ── */}
{selectedRequest?.type === "normal" && role === "hr" && (
  <div className="mt-6 p-5 bg-gray-50 rounded-lg border border-gray-200">
    <label className="block text-base font-semibold text-gray-800 mb-3">
      Set Final Last Working Day <span className="text-red-600 text-lg">*</span>
    </label>
    
    <input
      type="date"
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
      value={finalLwd}
      onChange={(e) => setFinalLwd(e.target.value)}
      min={new Date().toISOString().split('T')[0]} // Optional: prevent past dates
      required
    />
    
    <p className="mt-3 text-sm text-gray-600">
      This will become the employee's official last working day upon final approval.
    </p>
  </div>
)}

    {selectedRequest.type !== "clearance" && (
      <>
        <div className="exf-info-row">
          <span className="exf-label">Reason</span>
          <span className="exf-value">{selectedRequest.reason}</span>
        </div>
        <div className="exf-info-row">
          <span className="exf-label">Proposed LWD</span>
          <span className="exf-value">{selectedRequest?.proposed_lwd ? (
  new Date(selectedRequest.proposed_lwd).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
) : (
  "—"
)}</span>
        </div>
      </>
    )}

    {selectedRequest.type === "withdrawal" && (
      <div className="exf-info-row exf-full-width">
        <span className="exf-label">Withdrawal Reason</span>
        <span className="exf-value">{selectedRequest.withdrawal_reason}</span>
      </div>
    )}
  </div>

  {selectedRequest.type === "clearance" && (
    <div className="exf-clearance-section mt-6 space-y-8">
      {/* KT Plans */}
      <div>
        <h4 className="exf-section-title">Knowledge Transfer Plans</h4>

        {ktPlans.length === 0 ? (
          <p className="exf-empty-text">No KT plans added yet.</p>
        ) : (
          <div className="space-y-4">
            {ktPlans.map((kt) => (
              <div key={kt.id} className="exf-card relative">
                <h5 className="exf-card-title">{kt.title}</h5>
                <p className="exf-card-detail mt-1">{kt.description}</p>

                {kt.attached_files && kt.attached_files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-700">Uploaded files:</p>
                    {kt.attached_files.map((file, idx) => {
                      const fileName = file.split("/").pop();
                      return (
                        <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-700 truncate">{fileName}</span>
                          <div className="flex gap-2">
                            <button
                              className="exf-btn exf-btn-sm"
                              onClick={() => viewFile(file)}
                            >
                              View
                            </button>
                            <button
                              className="exf-btn exf-btn-sm"
                              onClick={() => downloadFile(file, fileName)}
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <p className="text-sm mt-2">
                  <strong>Status:</strong> {kt.status || "Pending"}
                </p>

                <div className="exf-approvals mt-4 flex flex-col gap-3">
                  {["supervisor", "manager"].includes(role) && (
                    <label className="exf-checkbox-label">
                      <input
                        type="checkbox"
                        checked={kt.supervisor_approved || false}
                        onChange={(e) => handleApproveItem(kt.id, e.target.checked, "KT", kt)}
                        disabled={loading}
                        className="exf-checkbox"
                      />
                      <span>Supervisor Approved</span>
                    </label>
                  )}

                  {isHrOrAdmin && (
                    <label className="exf-checkbox-label">
                      <input
                        type="checkbox"
                        checked={kt.hr_approved || false}
                        onChange={(e) => handleApproveItem(kt.id, e.target.checked, "KT", kt)}
                        disabled={loading}
                        className="exf-checkbox"
                      />
                      <span>HR/Admin Approved</span>
                    </label>
                  )}
                </div>

                {loading && (
                  <div className="exf-loading-overlay">
                    Saving...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assets */}
<div>
  <h4 className="exf-section-title">Assets</h4>

  {assets.length === 0 ? (
    <p className="exf-empty-text">No assets added yet.</p>
  ) : (
    assets.map((asset) => (
      <div key={asset.id} className="exf-card relative">
        <h5 className="exf-card-title">{asset.title}</h5>
        <p className="exf-card-detail mt-1">
          Planned Return: {asset.planned_date ? new Date(asset.planned_date).toLocaleDateString() : "—"}
        </p>

        <div className="exf-approvals mt-4 flex flex-col gap-3">
          {["supervisor", "manager"].includes(role) && (
            <label className="exf-checkbox-label">
              <input
                type="checkbox"
                checked={asset.supervisor_approved || false}
                onChange={(e) => handleApproveItem(asset.id, e.target.checked, "ASSET", asset)}
                disabled={loading}
                className="exf-checkbox"
              />
              <span>Supervisor Approved</span>
            </label>
          )}

          {isHrOrAdmin && (
            <label className="exf-checkbox-label">
              <input
                type="checkbox"
                checked={asset.hr_approved || false}
                onChange={(e) => handleApproveItem(asset.id, e.target.checked, "ASSET", asset)}
                disabled={loading}
                className="exf-checkbox"
              />
              <span>HR/Admin Approved</span>
            </label>
          )}
        </div>

        {loading && (
          <div className="exf-loading-overlay">
            Saving...
          </div>
        )}
      </div>
    ))
  )}
</div>

      {/* HR Finalize button */}
     {isHrOrAdmin && (
  <button
    className="exf-btn exf-btn-primary w-full mt-6 py-3 text-base"
    onClick={handleFinalizeExit}
    disabled={loading || ktPlans.some(kt => !kt.hr_approved) || assets.some(a => !a.hr_approved)}
  >
    {loading ? "Processing..." : "Finalize Exit & Clearance"}
  </button>
)}
    </div>
  )}

  {/* Action buttons — Discuss is still here */}
  <div className="exf-modal-actions">
    <button
      className="exf-btn exf-btn-secondary"
      onClick={() => setSelectedRequest(null)}
    >
      Cancel
    </button>

    {selectedRequest.type === "normal" ? (
      <>
        <button
          className="exf-btn exf-btn-success"
          onClick={() => handleReviewAction("normal", "APPROVED")}
        >
          {role === "hr" ? "Final Approve" : "Approve"}
        </button>

        <button
          className="exf-btn exf-btn-danger"
          onClick={() => handleReviewAction("normal", "REJECTED")}
        >
          Reject
        </button>

        {role === "supervisor" && (
          <button
            className="exf-btn exf-btn-info"
            onClick={() => handleReviewAction("normal", "DISCUSS")}
          >
            Discuss
          </button>
        )}
      </>
    ) : selectedRequest.type === "withdrawal" ? (
      <>
        <button
          className="exf-btn exf-btn-success"
          onClick={() => handleReviewAction("withdrawal", "APPROVED")}
        >
          Approve Withdrawal
        </button>

        <button
          className="exf-btn exf-btn-danger"
          onClick={() => handleReviewAction("withdrawal", "REJECTED")}
        >
          Reject Withdrawal
        </button>
      </>
    ) : null}
  </div>
</div>
          </div>
        )}

        {showAddKTModal && createPortal(
          <div className="exf-modal-backdrop">
            <div className="exf-modal-content" style={{ maxWidth: '520px' }}>
              <div className="exf-kt-modal-header">
                <h3 className="exf-kt-modal-title">
                  {editingKtId ? "Edit Knowledge Transfer Plan" : "Add Knowledge Transfer Plan"}
                </h3>
                <button
                  onClick={() => {
                    setShowAddKTModal(false);
                    setEditingKtId(null);
                  }}
                  className="exf-kt-modal-close"
                >
                  ×
                </button>
              </div>
              <div className="exf-kt-modal-body">
                <div className="exf-kt-form-group">
                  <label className="exf-kt-form-label">
                    Topic <span className="exf-kt-required">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingKtId ? editKtForm.topic : newKtForm.topic}
                    onChange={(e) =>
                      editingKtId
                        ? setEditKtForm({ ...editKtForm, topic: e.target.value })
                        : setNewKtForm({ ...newKtForm, topic: e.target.value })
                    }
                    className="exf-kt-form-input"
                    placeholder="e.g. CRM Dashboard Training"
                  />
                </div>
                <div className="exf-kt-form-group">
                  <label className="exf-kt-form-label">
                    Description <span className="exf-kt-required">*</span>
                  </label>
                  <textarea
                    value={editingKtId ? editKtForm.description : newKtForm.description}
                    onChange={(e) =>
                      editingKtId
                        ? setEditKtForm({ ...editKtForm, description: e.target.value })
                        : setNewKtForm({ ...newKtForm, description: e.target.value })
                    }
                    rows={5}
                    className="exf-kt-form-textarea"
                    placeholder="Detailed notes about what needs to be handed over..."
                  />
                </div>
                <div className="exf-kt-form-group">
                  <label className="exf-kt-form-label">Upload Documents (multiple allowed)</label>
                  <div className="exf-kt-file-upload-container">
                    <label className="exf-kt-file-upload-btn">
                      Choose files
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                        onChange={(e) => {
                          const selected = Array.from(e.target.files || []);
                          if (editingKtId) {
                            setEditKtForm({ ...editKtForm, documents: selected });
                          } else {
                            setNewKtForm({ ...newKtForm, documents: selected });
                          }
                        }}
                        className="exf-kt-file-input-hidden"
                      />
                    </label>
                    <span className="exf-kt-file-selected">
                      {(editingKtId ? editKtForm.documents : newKtForm.documents).length > 0
                        ? `Selected: ${(editingKtId ? editKtForm.documents : newKtForm.documents)
                            .map(f => f.name)
                            .join(", ")}`
                        : "No file chosen"}
                    </span>
                  </div>
                  {/* ── SHOW EXISTING FILES + REMOVE OPTION (only in edit mode) ── */}
                  {editingKtId && ktPlans.find(k => k.id === editingKtId)?.attached_files?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700">Current files:</p>
                      {ktPlans.find(k => k.id === editingKtId).attached_files.map((rawPath, idx) => {
                        const fileName = normalizeFilePath(rawPath).split('/').pop() || 'file';
                        const isMarkedDelete = editKtForm.filesToDelete.includes(rawPath);
                        return (
                          <div
                            key={idx}
                            className={`flex justify-between items-center p-2 mt-1 rounded ${
                              isMarkedDelete ? 'bg-red-50' : 'bg-gray-100'
                            }`}
                          >
                            <span className={`text-sm ${isMarkedDelete ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                              {fileName}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditKtForm(prev => ({
                                  ...prev,
                                  filesToDelete: prev.filesToDelete.includes(rawPath)
                                    ? prev.filesToDelete.filter(p => p !== rawPath)
                                    : [...prev.filesToDelete, rawPath]
                                }));
                              }}
                              className={`text-sm font-medium ${
                                isMarkedDelete ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'
                              }`}
                            >
                              {isMarkedDelete ? "Keep" : "Remove"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="exf-kt-form-row">
                  <div className="exf-kt-form-group exf-kt-form-group-half">
                    <label className="exf-kt-form-label">Status</label>
                    <select
                      value={editingKtId ? editKtForm.status : newKtForm.status}
                      onChange={(e) =>
                        editingKtId
                          ? setEditKtForm({ ...editKtForm, status: e.target.value })
                          : setNewKtForm({ ...newKtForm, status: e.target.value })
                      }
                      className="exf-kt-form-select"
                    >
                      <option value="">Select status</option>
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="exf-kt-form-group exf-kt-form-group-half">
                    <label className="exf-kt-form-label">Completed Date</label>
                    <input
                      type="date"
                      value={editingKtId ? editKtForm.completedDate : newKtForm.completedDate}
                      onChange={(e) =>
                        editingKtId
                          ? setEditKtForm({ ...editKtForm, completedDate: e.target.value })
                          : setNewKtForm({ ...newKtForm, completedDate: e.target.value })
                      }
                      className="exf-kt-form-input"
                    />
                  </div>
                </div>
              </div>
              <div className="exf-kt-modal-footer">
                <button
                  onClick={() => {
                    setShowAddKTModal(false);
                    setEditingKtId(null);
                  }}
                  className="exf-kt-btn exf-kt-btn--cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={editingKtId ? handleEditKt : handleAddKt}
                  disabled={
                    loading ||
                    !(editingKtId ? editKtForm.topic.trim() && editKtForm.description.trim() : newKtForm.topic.trim() && newKtForm.description.trim())
                  }
                  className="exf-kt-btn exf-kt-btn--primary"
                >
                  {loading
                    ? "Saving..."
                    : editingKtId
                    ? "Update KT Plan"
                    : "Add KT Plan"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
        <Modal
                isVisible={alertModal.isVisible}
                onClose={closeAlert}
                buttons={[{ label: "OK", onClick: closeAlert }]}
              >
                <p>{alertModal.message}</p>
              </Modal>
      </div>
    </>
  );
}