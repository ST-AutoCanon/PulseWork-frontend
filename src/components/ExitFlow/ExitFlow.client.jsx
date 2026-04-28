

"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider.client";
import "./ExitFlow.css";
import { createPortal } from "react-dom";
import Modal from "../Modal/Modal.client";
import ClearanceModal from "./ClearanceModal.jsx";
import { FaRegStar, FaStar } from "react-icons/fa";

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
  const [leavePolicy, setLeavePolicy] = useState(""); // NEW: "all" | "sick_only" | "none"
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
  const [searchTerm, setSearchTerm] = useState("");
  const isHr = roleLower === "hr" || roleLower === "human resource" || roleLower === "hr admin";
  // HR users who are not also admins should have extra checks before finalizing
  const isHrOnly = isHr && !isAdmin;
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
  const [showClearanceModal, setShowClearanceModal] = useState(false);
  const [hrRatings, setHrRatings] = useState({
  kt_rating: "",
  asset_rating: "",
  overall_rating: "",
});
const [hrRating, setHrRating] = useState("");
const [hrEvaluationComments, setHrEvaluationComments] = useState("");
  useEffect(() => {
    if (isAdmin && activeTab !== "all") {
      setActiveTab("all");
    }
  }, [isAdmin, activeTab]);
// Keep your existing useEffect for initial load (but without fetchAllTeamRequests)
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
      await fetchTeamMembers();
    } catch (err) {
      setErrorMessage("Failed to load exit information.");
    } finally {
      setLoading(false);
    }
  };
  init();
}, [employeeId, orgId]);

// NEW: Fetch team/all requests when relevant tab is active
useEffect(() => {
  if (activeTab === "team" || activeTab === "all") {
    fetchAllTeamRequests();
  }
}, [activeTab, employeeId, orgId]); // dependencies: re-run when tab or auth changes
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
      console.log("[CLEARANCE] Fetching items for exit:", exitId);
      const res = await axios.get(`${BACKEND_URL}/api/clearance/${exitId}/items`, {
        headers: {
          "x-api-key": API_KEY,
          "x-employee-id": employeeId,
          "x-org-id": orgId,
        },
        withCredentials: true,
      });
      const items = res.data?.data || [];
      console.log("[CLEARANCE] Raw items from API:", JSON.stringify(items, null, 2));
      // Parse attached_files if it's a string
      items.forEach(item => {
        if (item.attached_files && typeof item.attached_files === 'string') {
          try {
            item.attached_files = JSON.parse(item.attached_files);
          } catch (e) {
            console.warn("[CLEARANCE] Failed to parse attached_files:", e);
            item.attached_files = [];
          }
        } else if (!item.attached_files) {
          item.attached_files = [];
        }
      });
      const ktItems = items.filter(item => item.item_type === "KT");
      const assetItems = items.filter(item => item.item_type === "ASSET");
      console.log("[CLEARANCE] KT items:", ktItems.length, ktItems);
      console.log("[CLEARANCE] Asset items:", assetItems.length, assetItems);
      setKtPlans(ktItems);
      setAssets(assetItems);
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
    let url;
    if (activeTab === "all") {
      url = `${BACKEND_URL}/api/exit/all`;
    } else if (activeTab === "team") {
      url = `${BACKEND_URL}/api/exit/my-team/all`;
    } else {
      return; // not a team/all tab → skip
    }
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
    console.log("[TEAM REQUESTS] All statuses:", requests.map(r => ({ id: r.id, emp_id: r.employee_id, supervisor_status: r.supervisor_status, hr_status: r.hr_status, withdrawal_supervisor_status: r.withdrawal_supervisor_status, withdrawal_hr_status: r.withdrawal_hr_status })));
    setAllTeamRequests(requests);
    // Filter pending data based on role
    const effectiveRole = role?.toLowerCase() === "manager" ? "supervisor" : role?.toLowerCase();
    let filteredPendingNormal = [];
    let filteredPendingWithdraw = [];

    if (isHr || isAdmin) {
      // HR/Admin sees requests where HR still needs to act
      filteredPendingNormal = requests.filter(r =>
        !r.final_outcome &&
        !r.withdrawal_requested_at &&
        (r.hr_status === "PENDING" || !r.hr_status)
      );
    } else {
      // Supervisor / others see only their own pending
      filteredPendingNormal = requests.filter(r =>
        !r.final_outcome &&
        !r.withdrawal_requested_at &&
        !["APPROVED", "REJECTED"].includes(r.supervisor_status || "") &&
        !["APPROVED", "REJECTED"].includes(r.hr_status || "")
      );
    }

    // Show withdrawals that are not finally resolved
    filteredPendingWithdraw = requests.filter(r =>
      r.withdrawal_requested_at &&
      !["APPROVED", "REJECTED"].includes(r.withdrawal_supervisor_status || "") &&
      !["APPROVED", "REJECTED"].includes(r.withdrawal_hr_status || "")
    );
    console.log("[TEAM REQUESTS] Effective role:", effectiveRole);
    console.log("[TEAM REQUESTS] Filtered pending normal:", filteredPendingNormal.length, "items");
    console.log("[TEAM REQUESTS] Filtered pending withdraw:", filteredPendingWithdraw.length, "items");
    console.log("[TEAM REQUESTS] Effective role:", effectiveRole);
    console.log("[TEAM REQUESTS] Filtered pending normal:", filteredPendingNormal.length, "items");
    console.log("[TEAM REQUESTS] Filtered pending withdraw:", filteredPendingWithdraw.length, "items");
    if (filteredPendingNormal.length > 0) {
      console.log("[TEAM REQUESTS] First pending normal:", filteredPendingNormal[0]);
    }
    setPendingData({
      normal: filteredPendingNormal,
      withdraw: filteredPendingWithdraw,
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
  const handleFinalizeClearance = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      if (!selfRequest?.id) throw new Error("No exit request found");
      const res = await axios.post(
        `${BACKEND_URL}/api/clearance/finalize`,
        { exitId: selfRequest.id },
        {
          headers: {
            "x-api-key": API_KEY,
            "x-employee-id": employeeId,
            "x-org-id": orgId,
          },
          withCredentials: true,
        }
      );
      setExitCompleted(true);
      showAlert("Clearance process finalized successfully!", "Success", "success");
      setShowClearanceModal(false);
    } catch (err) {
      setErrorMessage(err.response?.data?.error || "Failed to finalize clearance");
      console.error("[FINALIZE CLEARANCE] Failed:", err);
    } finally {
      setLoading(false);
    }
  };
// ✅ Replace ALL previous selectedRequest useEffects with this one (only one should remain)
// ✅ FINAL FIXED useEffect - Put this as the only selectedRequest useEffect
useEffect(() => {
  if (!selectedRequest) {
    setFinalLwd("");
    setHrRating("");
    setHrEvaluationComments("");
    setRecommendedLwd("");
    setLeavePolicy("");
    return;
  }

  console.log("[CLEARANCE DEBUG] selectedRequest received:", {
    id: selectedRequest.id,
    type: selectedRequest.type,
    final_outcome: selectedRequest.final_outcome,
    final_lwd: selectedRequest.final_lwd,
    hr_final_lwd: selectedRequest.hr_final_lwd,
    proposed_lwd: selectedRequest.proposed_lwd,
    hr_rating: selectedRequest.hr_rating,
    hr_evaluation_comments: selectedRequest.hr_evaluation_comments
  });

  if (selectedRequest.type === "clearance" || selectedRequest.final_outcome === "RESIGNED") {
    
    // FIXED: Extract only YYYY-MM-DD part for date input
    let finalLwdValue = "";
    if (selectedRequest.final_lwd) {
      finalLwdValue = selectedRequest.final_lwd.split('T')[0];           // remove time if present
    } else if (selectedRequest.hr_final_lwd) {
      finalLwdValue = selectedRequest.hr_final_lwd.split('T')[0];
    } else if (selectedRequest.proposed_lwd) {
      finalLwdValue = selectedRequest.proposed_lwd.split('T')[0];
    }

    const ratingValue = selectedRequest.hr_rating || "";
    const commentsValue = selectedRequest.hr_evaluation_comments || selectedRequest.hr_comments || "";

    console.log("[CLEARANCE DEBUG] Final values being set:", { 
      finalLwd: finalLwdValue, 
      rating: ratingValue, 
      comments: commentsValue 
    });

    setTimeout(() => {
      setFinalLwd(finalLwdValue);
      setHrRating(ratingValue);
      setHrEvaluationComments(commentsValue);
    }, 100);
  } else {
    setFinalLwd("");
    setHrRating("");
    setHrEvaluationComments("");
    setRecommendedLwd("");
    setLeavePolicy("");
  }
}, [selectedRequest]);   // Important: only depend on selectedRequest
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
  // ── Reset previous global error (optional)
  setErrorMessage("");
  if (!form.reason) {
    showAlert("Please select a reason for leaving", "Missing Information", "warning");
    return;
  }
  if (form.reason === "Other" && !form.otherReason.trim()) {
    showAlert("Please specify the other reason", "Missing Information", "warning");
    return;
  }
  if (!form.proposedLwd) {
    showAlert("Please select your proposed Last Working Day", "Missing Date", "warning");
    return;
  }
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
    showAlert("Resignation request submitted successfully", "Success", "success");
    fetchSelfRequest();
    setForm({ reason: "", otherReason: "", proposedLwd: "", comment: "" });
    setShowResignationForm(false); // ← nice UX: close form after success
  } catch (err) {
    const msg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      "Failed to submit resignation request";
    showAlert(msg, "Submission Failed", "error");
  } finally {
    setLoading(false);
  }
};
  const handleWithdraw = async () => {
  if (!withdrawReason.trim()) {
    showAlert("Please enter a reason for withdrawal", "Missing Reason", "warning");
    return;
  }
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
    showAlert("Withdrawal request submitted successfully", "Success", "success");
    fetchSelfRequest();
    setWithdrawReason("");
  } catch (err) {
    const msg = err.response?.data?.error || "Failed to submit withdrawal";
    showAlert(msg, "Error", "error");
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
    // ── NEW: Decide approval level based on ACTIVE TAB, not role ───────────────────────
    const isTeamTab = activeTab === "team";
    if (reviewType === "normal") {
      if (isTeamTab) {
        // In "My Team" tab → always treat as supervisor action
        endpoint = `${BACKEND_URL}/api/exit/supervisor/action`;
        methodPayload = {
          ...payload,
          status: action, // "APPROVED" or "REJECTED"
          recommendedLwd: recommendedLwd || null,
        };
      } else {
        // "all" tab (organization-wide view) → use real role
        const effectiveRole = role?.toLowerCase() === "manager" ? "supervisor" : role?.toLowerCase();
        if (effectiveRole === "hr" || effectiveRole === "admin") {
          if (action === "APPROVED") {
            if (!finalLwd) {
              setErrorMessage("Final Last Working Day is required to approve");
              setLoading(false);
              return;
            }
            if (!leavePolicy) {
              setErrorMessage("Please select leave policy");
              setLoading(false);
              return;
            }
            endpoint = `${BACKEND_URL}/api/exit/hr/final-approve`;
            methodPayload = { ...payload, finalLwd, leavePolicy };
          } else {
            endpoint = `${BACKEND_URL}/api/exit/hr/action`;
            methodPayload = { ...payload, status: "REJECTED" };
          }
        } else if (effectiveRole === "supervisor") {
          endpoint = `${BACKEND_URL}/api/exit/supervisor/action`;
          methodPayload = {
            ...payload,
            status: action,
            recommendedLwd: recommendedLwd || null,
          };
        }
      }
    } else if (reviewType === "withdrawal") {
      if (isTeamTab) {
        // In team tab → always supervisor withdrawal action
        endpoint = `${BACKEND_URL}/api/exit/supervisor/withdraw`;
        methodPayload = { ...payload, status: action };
      } else {
        // all tab → use real role
        const effectiveRole = role?.toLowerCase() === "manager" ? "supervisor" : role?.toLowerCase();
        if (effectiveRole === "hr") {
          endpoint = `${BACKEND_URL}/api/exit/hr/withdraw/final`;
        } else if (effectiveRole === "supervisor") {
          endpoint = `${BACKEND_URL}/api/exit/supervisor/withdraw`;
        }
        methodPayload = { ...payload, status: action };
      }
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
      showAlert("Action completed successfully", "Success", "success");
      setSelectedRequest(null);
      setReviewComment("");
      setRecommendedLwd("");
      setFinalLwd("");
      setLeavePolicy("");
      await fetchAllTeamRequests();
      await fetchSelfRequest();
    }
  } catch (err) {
    const msg = err.response?.data?.error || err.message || "Failed to process review";
    setErrorMessage(msg);
    showAlert(msg, "Error", "error");
  } finally {
    setLoading(false);
  }
};

const handleSaveFinalEvaluation = async () => {
  try {
    setLoading(true);

    await axios.put(
      `${BACKEND_URL}/api/exit/hr-final-evaluation/${selectedRequest.id}`,
      {
        final_lwd: finalLwd,
  hr_rating: hrRating,
        hr_evaluation_comments: hrEvaluationComments,
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

    showAlert("Final HR evaluation saved successfully");

    setSelectedRequest(null);
    setFinalLwd("");
    setHrRating("");
    setHrEvaluationComments("");
    setReviewComment("");

    await fetchAllTeamRequests();
    await fetchSelfRequest();

  } catch (error) {
    console.error(error);
    showAlert(
      error.response?.data?.message || "Failed to save HR evaluation"
    );
  } finally {
    setLoading(false);
  }
};
  const hasTeam = teamMembers.length > 0;
  const isHrOrAdmin = role === "hr" || role === "admin" || isAdmin;

  // Add this before return
const filteredAllTeamRequests = allTeamRequests.filter((req) => {
  if (!searchTerm.trim()) return true;

  const term = searchTerm.toLowerCase().trim();

  return (
    (req.employee_name || "").toLowerCase().includes(term) ||
    (req.employee_id || "").toLowerCase().includes(term) ||
    (req.reason || "").toLowerCase().includes(term) ||
    (req.withdrawal_reason || "").toLowerCase().includes(term) ||
    (req.supervisor_status || "").toLowerCase().includes(term) ||
    (req.hr_status || "").toLowerCase().includes(term) ||
    (req.final_outcome || "").toLowerCase().includes(term) ||
    (req.withdrawal_supervisor_status || "").toLowerCase().includes(term)
  );
});
  return (
    <>
          <div className="exf-container">
        {errorMessage && <div className="exf-error-banner">{errorMessage}</div>}
        <div className="exf-tabs-wrapper">
          <div className="exf-tabs" role="tablist">
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
        {/* ── Main tab content ── only one tab renders at a time ── */}
        <div className="exf-main-content mt-6">
          {activeTab === "self" && (
            <div className="exf-card exf-self-view">
              {selfRequest && selfRequest.is_active === 1 ? (
                <div className="exf-section">
                  {selfRequest.withdrawal_requested_at ? (
                    // ── WITHDRAWAL IN PROGRESS ────────────────────────────────
                    <>
                      <h2 className="exf-title">Withdrawal Request In Progress</h2>
                      <div className="withdrawal-focused-card bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Reason for Withdrawal</p>
                            <p className="mt-1 text-gray-900">
                              {selfRequest.withdrawal_reason || "Not provided"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Requested On</p>
                            <p className="mt-1 text-gray-900">
                              {selfRequest.withdrawal_requested_at
                                ? new Date(selfRequest.withdrawal_requested_at).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Supervisor Status</p>
                            <span
                              className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium badge badge-${(
                                selfRequest.withdrawal_supervisor_status || "pending"
                              ).toLowerCase()}`}
                            >
                              {selfRequest.withdrawal_supervisor_status || "Pending"}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-medium">HR Status</p>
                            <span
                              className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium badge badge-${(
                                selfRequest.withdrawal_hr_status || "pending"
                              ).toLowerCase()}`}
                            >
                              {selfRequest.withdrawal_hr_status || "Pending"}
                            </span>
                          </div>
                        </div>
                        {selfRequest.withdrawal_supervisor_comment && (
                          <div className="mt-6">
                            <p className="text-sm text-gray-600 font-medium">Supervisor Comment</p>
                            <div className="mt-1 p-3 bg-gray-50 rounded border border-gray-200">
                              {selfRequest.withdrawal_supervisor_comment}
                            </div>
                          </div>
                        )}
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>You have requested to withdraw your resignation.</strong>
                          </p>
                          <p className="mt-2 text-sm text-gray-700">
                            {selfRequest.withdrawal_supervisor_status === "PENDING" &&
                              "Awaiting review from your supervisor."}
                            {selfRequest.withdrawal_supervisor_status === "APPROVED" &&
                              "Supervisor approved — awaiting final decision from HR."}
                            {selfRequest.withdrawal_supervisor_status === "REJECTED" &&
                              "Supervisor rejected the withdrawal request."}
                          </p>
                        </div>
                      </div>
                      {/* Hide withdraw form when withdrawal is already requested */}
                    </>
                  ) : (
                    // ── NORMAL RESIGNATION STATUS ─────────────────────────────
                    <>
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
                        {selfRequest?.employee_comment && (
                          <div className="exf-status-item">
                            <span className="exf-status-label">Additional Comments</span>
                            <div className="exf-comment-box">{selfRequest.employee_comment}</div>
                          </div>
                        )}
                      </div>
                      {/* Show withdraw option only when no withdrawal is pending */}
                      {!selfRequest.final_outcome && (
                        <div className="exf-withdraw-section mt-6">
                          <h3>Request to Withdraw Resignation</h3>
                          <p className="exf-help-text">
                            You can still cancel this resignation before final approval.
                          </p>
                          <textarea
                            className="exf-divider"
                            placeholder="Reason for withdrawal..."
                            value={withdrawReason}
                            onChange={(e) => setWithdrawReason(e.target.value)}
                          />
                          <button
                            className="btn btn-warning exf-full-width mt-4"
                            onClick={handleWithdraw}
                            disabled={loading}
                          >
                            {loading ? "Submitting..." : "Request Withdrawal"}
                          </button>
                        </div>
                      )}
                    </>
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
                          {selfRequest.leave_policy && (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <h4 className="text-sm font-semibold text-blue-800 mb-2">
                                Your Exit Leave Policy
                              </h4>
                              {selfRequest.leave_policy === "all" && (
                                <p className="text-sm text-blue-700">
                                  You are allowed to encash/adjust <strong>all eligible leaves</strong>
                                  (including earned/privilege leaves) as per company policy.
                                </p>
                              )}
                              {selfRequest.leave_policy === "sick_only" && (
                                <p className="text-sm text-blue-700">
                                  Only <strong>sick and casual leaves</strong> will be considered for adjustment.
                                  No encashment of earned/privilege leaves is allowed.
                                </p>
                              )}
                              {selfRequest.leave_policy === "none" && (
                                <p className="text-sm text-red-700">
                                  <strong>No leaves</strong> will be encashed or adjusted during your exit process.
                                </p>
                              )}
                              <p className="text-xs text-gray-600 mt-2 italic">
                                This policy was finalized by HR during approval.
                              </p>
                            </div>
                          )}
                          {!selfRequest.leave_policy && selfRequest.final_lwd && (
                            <p className="mt-4 text-sm text-gray-600">
                              Leave policy details will be communicated by HR shortly.
                            </p>
                          )}
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
                              <button
                                onClick={async () => {
                                  console.log("[EMPLOYEE] Opening clearance modal, fetching data...");
                                  setShowClearanceModal(true);
                                  if (selfRequest?.id) {
                                    console.log("[EMPLOYEE] Fetching items for exit ID:", selfRequest.id);
                                    await fetchClearanceItems(selfRequest.id);
                                    console.log("[EMPLOYEE] Items fetched successfully");
                                  } else {
                                    console.error("[EMPLOYEE] selfRequest.id not available!");
                                  }
                                }}
                                className="btn btn-primary px-6 py-3 text-base"
                              >
                                📋 Open Exit Clearance
                              </button>
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
                          ? new Date(selfRequest.hr_action_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </div>
                    </div>
                  ) : null}
                  {(!selfRequest ||
                    (selfRequest &&
                      selfRequest.final_outcome &&
                      ["WITHDRAWN", "REJECTED"].includes(selfRequest.final_outcome))) && (
                    <div className="exf-resignation-wrapper-1">
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
  className="resign-apply-btn-gradient"
  onClick={() => setShowResignationForm(true)}
  disabled={loading}
>
  {loading ? "Processing..." : "Apply for Resignation"}
</button>
                        </div>
                      ) : (
                        <div className="exf-resignation-form-container">
                          <div className="exf-resignation-form-header-1">
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
                            <div className="exf-form-grid-1">
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
                 <div className="exf-team-panel">
  <div className="flex justify-between items-center mb-4">
    <h2 className="exf-panel-title">Exit & Withdrawal Requests from My Team</h2>
    
    <div className="relative w-72">
      <input
        type="text"
        placeholder="Search by Name, Emp ID or Status..."
        className="exf-search-input"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
     
    </div>
  </div>
                    {allTeamRequests.length === 0 ? (
                      <div className="exf-empty-state">
                        No exit or withdrawal requests submitted by your team members yet.
                      </div>
                    ) : (
                      <div className="exf-table-container">
                        <table className="exf-table">
                          <thead>
                            <tr>
                              <th>Emp ID</th>
                              <th>Name</th>
                              <th>Reason</th>
                              <th>Date</th>
                              <th>Supervisor</th>
                              <th>HR</th>
                              <th>Status</th>
                              <th className="text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredAllTeamRequests.map((req) => {
                              const isWithdrawal = !!req.withdrawal_requested_at;
                              const isFullyWithdrawn =
                                isWithdrawal &&
                                req.withdrawal_supervisor_status === "APPROVED" &&
                                req.withdrawal_hr_status === "APPROVED";
                              return (
                                <tr
                                  key={req.id}
                                  className={isFullyWithdrawn ? "exf-row-frozen opacity-65 bg-gray-50" : ""}
                                >
                                  <td className="font-medium">{req.employee_id}</td>
                                  <td>{req.employee_name || "—"}</td>
                                  <td className="max-w-xs">
                                    <div className="reason-tooltip-wrapper">
                                      <span className="reason-truncated">
                                        {isWithdrawal ? (
                                          req.withdrawal_reason || "—"
                                        ) : (
                                          <>
                                            {req.reason}
                                            {req.reason === "Other" && req.other_reason && ` (${req.other_reason})`}
                                          </>
                                        )}
                                      </span>
                                      <div className="reason-tooltip">
                                        {isWithdrawal ? (
                                          <>
                                            <strong>Withdrawal Reason:</strong><br />
                                            {req.withdrawal_reason || "Not specified"}
                                            {req.comment && (
                                              <>
                                                <br /><br />
                                                <strong>Comment:</strong><br />
                                                {req.comment}
                                              </>
                                            )}
                                          </>
                                        ) : (
                                          <>
                                            <strong>Resignation Reason:</strong><br />
                                            {req.reason || "Not specified"}
                                            {req.reason === "Other" && req.other_reason && (
                                              <>
                                                <br />
                                                <strong>Other Details:</strong> {req.other_reason}
                                              </>
                                            )}
                                            {req.comment && (
                                              <>
                                                <br /><br />
                                                <strong>Employee Comment:</strong><br />
                                                {req.comment}
                                              </>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    {isWithdrawal
                                      ? req.withdrawal_requested_at
                                        ? new Date(req.withdrawal_requested_at).toLocaleDateString("en-GB")
                                        : "—"
                                      : req.proposed_lwd
                                        ? new Date(req.proposed_lwd).toLocaleDateString("en-GB")
                                        : "—"}
                                  </td>
                                  <td>
                                    <span
                                      className={`exf-badge exf-badge-${
                                        (isWithdrawal
                                          ? req.withdrawal_supervisor_status
                                          : req.supervisor_status
                                        )?.toLowerCase() ?? "pending"
                                      }`}
                                    >
                                      {isWithdrawal
                                        ? req.withdrawal_supervisor_status || "Pending"
                                        : req.supervisor_status || "Pending"}
                                    </span>
                                  </td>
                                  <td>
                                    <span
                                      className={`exf-badge exf-badge-${
                                        (isWithdrawal
                                          ? req.withdrawal_hr_status
                                          : req.hr_status
                                        )?.toLowerCase() ?? "pending"
                                      }`}
                                    >
                                      {isWithdrawal
                                        ? req.withdrawal_hr_status || "Pending"
                                        : req.hr_status || "Pending"}
                                    </span>
                                  </td>
                                  <td>
                                    {isFullyWithdrawn
                                      ? "Withdrawn ✓"
                                      : isWithdrawal
                                        ? "Withdrawal Requested"
                                        : req.final_outcome || "Active"}
                                  </td>
                                  <td className="text-center">
                                    {isFullyWithdrawn ? (
                                      <span className="text-green-600 font-medium">Approved</span>
                                    ) : (
                                      <button
                                        className="exf-btn-review"
                                        onClick={() =>
                                          setSelectedRequest({
                                            ...req,
                                            type: isWithdrawal ? "withdrawal" :
                                                 req.final_outcome === "RESIGNED" ? "clearance" : "normal"
                                          })
                                        }
                                        disabled={loading}
                                      >
                                        Review
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
             
                  {/* <div className="exf-team-panel">
                    <h2 className="exf-panel-title mb-4">Pending Withdrawal Requests </h2>
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
                              <th>Name</th>
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
                                <td>{req.employee_name || "—"}</td>
                                <td className="max-w-xs">
                                  <div className="reason-tooltip-wrapper">
                                    <span className="reason-truncated">
                                      {req.withdrawal_reason || "—"}
                                    </span>
                                    <div className="reason-tooltip">
                                      <strong>Withdrawal Reason:</strong><br />
                                      {req.withdrawal_reason || "Not specified"}
                                      {req.comment && (
                                        <>
                                          <br /><br />
                                          <strong>Comment:</strong><br />
                                          {req.comment}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  {req.withdrawal_requested_at
                                    ? new Date(req.withdrawal_requested_at).toLocaleDateString('en-GB')
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
                  </div> */}
                </>
              )}
            </div>
          )}
          {activeTab === "all" && (role === "hr" || role === "admin" || isAdmin) && (
            <div className="exf-team-view space-y-8">
              <div className="exf-team-panel">
  <div className="flex justify-between items-center mb-4">
    <h2 className="exf-panel-title">
      Employees Exit & Withdrawal Requests
    </h2>
    
    <div className="relative w-72">
      <input
        type="text"
        placeholder="Search by Name, Emp ID or Status..."
        className="exf-search-input"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    
    </div>
  </div>
                {allTeamRequests.length === 0 ? (
                  <div className="exf-empty-state">
                    No exit or withdrawal requests found across the organization.
                  </div>
                ) : (
                  <div className="exf-table-container overflow-x-auto">
                    <table className="exf-table min-w-full">
                      <thead>
                        <tr>
                          <th>Emp ID</th>
                          <th>Name</th>
                          <th>Reason</th>
                          <th>Date</th>
                          <th>Supervisor</th>
                          <th>HR</th>
                          <th>Outcome</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAllTeamRequests.map((req) => {
                          const isWithdrawal = !!req.withdrawal_requested_at;
                          const isFullyWithdrawn =
                            isWithdrawal &&
                            req.withdrawal_supervisor_status === "APPROVED" &&
                            req.withdrawal_hr_status === "APPROVED";
                          return (
                            <tr
                              key={req.id}
                              className={
                                isFullyWithdrawn
                                  ? "exf-row-frozen opacity-65 bg-gray-50"
                                  : !isWithdrawal && req.supervisor_status === "PENDING"
                                  ? "bg-yellow-50/40"
                                  : ""
                              }
                            >
                              <td className="font-medium">{req.employee_id}</td>
                              <td>{req.employee_name || "—"}</td>
                              <td className="max-w-xs">
                                <div className="reason-tooltip-wrapper">
                                  <span className="reason-truncated">
                                    {isWithdrawal ? (
                                      req.withdrawal_reason || "—"
                                    ) : (
                                      <>
                                        {req.reason}
                                        {req.reason === "Other" && req.other_reason && ` (${req.other_reason})`}
                                      </>
                                    )}
                                  </span>
                                  <div className="reason-tooltip">
                                    {isWithdrawal ? (
                                      <>
                                        <strong>Withdrawal Reason:</strong><br />
                                        {req.withdrawal_reason || "Not specified"}
                                        {req.comment && (
                                          <>
                                            <br /><br />
                                            <strong>Comment:</strong><br />
                                            {req.comment}
                                          </>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        <strong>Resignation Reason:</strong><br />
                                        {req.reason || "Not specified"}
                                        {req.reason === "Other" && req.other_reason && (
                                          <>
                                            <br />
                                            <strong>Other Details:</strong> {req.other_reason}
                                          </>
                                        )}
                                        {req.comment && (
                                          <>
                                            <br /><br />
                                            <strong>Employee Comment:</strong><br />
                                            {req.comment}
                                          </>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td>
                                {isWithdrawal
                                  ? req.withdrawal_requested_at
                                    ? new Date(req.withdrawal_requested_at).toLocaleDateString("en-GB")
                                    : "—"
                                  : req.proposed_lwd
                                    ? new Date(req.proposed_lwd).toLocaleDateString("en-GB")
                                    : "—"}
                              </td>
                              <td>
                                <span
                                  className={`exf-badge exf-badge-${
                                    (isWithdrawal
                                      ? req.withdrawal_supervisor_status
                                      : req.supervisor_status
                                    )?.toLowerCase() ?? "pending"
                                  }`}
                                >
                                  {isWithdrawal
                                    ? req.withdrawal_supervisor_status || "Pending"
                                    : req.supervisor_status || "Pending"}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`exf-badge exf-badge-${
                                    (isWithdrawal
                                      ? req.withdrawal_hr_status
                                      : req.hr_status
                                    )?.toLowerCase() ?? "pending"
                                  }`}
                                >
                                  {isWithdrawal
                                    ? req.withdrawal_hr_status || "Pending"
                                    : req.hr_status || "Pending"}
                                </span>
                              </td>
                              <td>
                                {isFullyWithdrawn
                                  ? "Withdrawn ✓"
                                  : isWithdrawal
                                  ? req.withdrawal_supervisor_status === "REJECTED"
                                    ? "Withdrawal Rejected"
                                    : "Withdrawal Requested"
                                  : req.final_outcome || "Active"}
                              </td>
                              <td className="text-center">
                                {isFullyWithdrawn ? (
                                  <span className="text-green-600 font-medium">Completed</span>
                                ) : !isWithdrawal && req.supervisor_status === "PENDING" && !isAdmin ? (
                                  <span className="text-yellow-600 text-sm font-medium">
                                    Awaiting Supervisor
                                  </span>
                                ) : (
      <button
  className="exf-btn exf-btn-primary exf-btn-sm"
onClick={() => {
  const isWithdrawal = !!req.withdrawal_requested_at;
  const isResigned = req.final_outcome === "RESIGNED";

  let requestType = "normal";
  if (isWithdrawal) requestType = "withdrawal";
  else if (isResigned) requestType = "clearance";

  const newSelected = { ...req, type: requestType };

  setSelectedRequest(newSelected);

  // Immediate set for clearance (helps with timing)
  if (isResigned) {
  const finalLwdValue = req.final_lwd || req.hr_final_lwd || req.proposed_lwd || "";
  const ratingValue = req.hr_rating || "";
  const commentsValue = req.hr_evaluation_comments || req.hr_comments || "";

  console.log("[REVIEW BUTTON] Directly setting:", { finalLwdValue, ratingValue, commentsValue });

  setFinalLwd(finalLwdValue);
  setHrRating(ratingValue);
  setHrEvaluationComments(commentsValue);
  } else {
    setFinalLwd("");
    setHrRating("");
    setHrEvaluationComments("");
    setRecommendedLwd("");
    setLeavePolicy("");
  }

  setReviewComment("");
}}
>
  Review
</button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {/* <div className="exf-team-panel mt-8">
                <h2 className="exf-panel-title mb-4">Pending Resignations Requests</h2>
                {pendingData.normal.length === 0 ? (
                  <div className="exf-empty-state">
                    No pending resignation requests in the organization
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
                          <th>Applied On</th>
                          <th className="text-center">Status / Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingData.normal.map((req) => {
                          const isPendingSupervisor = req.supervisor_status === "PENDING";
                          const canReview = isAdmin || !isPendingSupervisor;
                          return (
                            <tr key={req.id}>
                              <td className="font-medium">{req.employee_id}</td>
                              <td>{req.employee_name || "—"}</td>
                              <td className="max-w-xs">
                                <div className="reason-tooltip-wrapper">
                                  <span className="reason-truncated">
                                    {req.reason}
                                    {req.reason === "Other" && req.other_reason && ` (${req.other_reason})`}
                                  </span>
                                  <div className="reason-tooltip">
                                    <strong>Reason:</strong><br />
                                    {req.reason || "Not specified"}
                                    {req.reason === "Other" && req.other_reason && (
                                      <>
                                        <br />
                                        <strong>Other:</strong> {req.other_reason}
                                      </>
                                    )}
                                    {req.comment && (
                                      <>
                                        <br /><br />
                                        <strong>Comment:</strong><br />
                                        {req.comment}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td>
                                {req.proposed_lwd
                                  ? new Date(req.proposed_lwd).toLocaleDateString()
                                  : "—"}
                              </td>
                              <td>{new Date(req.applied_at).toLocaleDateString()}</td>
                              <td className="text-center">
                                {isPendingSupervisor && !isAdmin ? (
                                  <span className="text-yellow-600 text-sm font-medium flex items-center justify-center gap-1">
                                    <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>
                                    Awaiting Supervisor
                                  </span>
                                ) : (
                                  <button
                                    className="exf-btn-review"
                                    onClick={() =>
                                      setSelectedRequest({
                                        ...req,
                                        type: req.final_outcome === "RESIGNED" ? "clearance" : "normal",
                                      })
                                    }
                                    disabled={loading}
                                  >
                                    Review
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div> */}
              {/* <div className="exf-team-panel mt-8 border-t pt-6">
                <h2 className="exf-panel-title mb-3">
                  Withdrawal Requests
                </h2>
                {(() => {
                  console.log("[DEBUG] Withdrawal candidates:",
                    allTeamRequests
                      .filter(r => r.withdrawal_requested_at)
                      .map(r => ({
                        id: r.id,
                        sup: r.withdrawal_supervisor_status,
                        hr: r.withdrawal_hr_status,
                        requestedAt: r.withdrawal_requested_at
                      }))
                  );
                  const hrPendingWithdrawals = allTeamRequests.filter(
                    r =>
                      r.withdrawal_requested_at &&
                      (r.withdrawal_hr_status === "PENDING" ||
                       !r.withdrawal_hr_status) &&
                      r.withdrawal_supervisor_status !== "REJECTED"
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
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Supervisor</th>
                            <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {hrPendingWithdrawals.map((req) => (
                            <tr
                              key={req.id}
                              className={req.withdrawal_supervisor_status === "PENDING" ? "bg-yellow-50/30" : ""}
                            >
                              <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.employee_id}</td>
                              <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">{req.employee_name || "—"}</td>
                              <td className="px-5 py-4 text-sm text-gray-700 max-w-xs">
                                <div className="reason-tooltip-wrapper">
                                  <span className="reason-truncated">
                                    {req.withdrawal_reason || "—"}
                                  </span>
                                  <div className="reason-tooltip">
                                    <strong>Withdrawal Reason:</strong><br />
                                    {req.withdrawal_reason || "Not specified"}
                                    {req.comment && (
                                      <>
                                        <br /><br />
                                        <strong>Comment:</strong><br />
                                        {req.comment}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                                {req.withdrawal_requested_at
                                  ? new Date(req.withdrawal_requested_at).toLocaleDateString("en-GB")
                                  : "—"}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                                {req.withdrawal_supervisor_status === "PENDING"
                                  ? <span className="text-yellow-600 font-medium">Awaiting Supervisor</span>
                                  : req.withdrawal_supervisor_status || "—"}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-center">
                                <button
                                  className="exf-btn-review px-4 py-1.5 text-sm"
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
                  );
                })()}
              </div> */}
            </div>
          )}
        </div>
        {/* Review Modal */}
               {/* ==================== FIXED REVIEW MODAL ==================== */}
        {selectedRequest && (
          <div className="exf-modal-backdrop">
            <div className="exf-modal-content">
              {/* Header */}
              <div className="modal-header">
                <h3 className="modal-title">
                  {selectedRequest.type === "normal"
                    ? "Resignation Review"
                    : selectedRequest.type === "withdrawal"
                    ? "Withdrawal Review"
                    : "Clearance Review"}
                </h3>
                <button 
                  className="modal-close-btn"
                  onClick={() => {
                    setSelectedRequest(null);
                    setReviewComment("");
                    setRecommendedLwd("");
                    setFinalLwd("");
                    setLeavePolicy("");
                    setHrRating("");
                    setHrEvaluationComments("");
                  }}
                >
                  ×
                </button>
              </div>

              {/* Supervisor Pending Warning */}
              {selectedRequest.type === "normal" &&
                selectedRequest.supervisor_status === "PENDING" &&
                activeTab === "all" && !isAdmin && (
                  <div className="pending-warning">
                    <p className="warning-text">
                      <strong>Supervisor Status:</strong> Pending
                    </p>
                    <p className="warning-subtext">
                      This request is awaiting supervisor action.
                    </p>
                  </div>
                )}

              <div className="modal-body">
                {/* Employee Info */}
                <div className="info-card employee-info">
                  <div className="info-label">Employee</div>
                  <div className="info-value">
                    {selectedRequest.employee_name || selectedRequest.employee_id || "—"}
                  </div>
                </div>

                {/* NORMAL RESIGNATION REVIEW */}
                {selectedRequest.type === "normal" && (
                  <>
                    {/* Reason + Comments + Proposed LWD */}
                    <div className="reason-section">
                      <div className="info-card reason-card">
                        <div className="info-label">Resignation Reason</div>
                        <div className="reason-content">
                          {selectedRequest.reason || "—"}
                          {selectedRequest.reason === "Other" && selectedRequest.other_reason && 
                            ` (${selectedRequest.other_reason})`}
                        </div>
                      </div>

                      {selectedRequest.employee_comment && (
                        <div className="info-card comment-card">
                          <div className="info-label">Additional Comments</div>
                          <div className="comment-content whitespace-pre-wrap">
                            {selectedRequest.employee_comment}
                          </div>
                        </div>
                      )}

                      <div className="info-card small-info">
                        <div className="info-label">Proposed LWD</div>
                        <div className="info-value">
                          {selectedRequest.proposed_lwd 
                            ? new Date(selectedRequest.proposed_lwd).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }) 
                            : "—"}
                        </div>
                      </div>
                    </div>

                    {/* Decision Section - Date Field Now Shows Correctly in Team Tab */}
                 <div className="hr-decision-section">

  {/* Final Last Working Day - Visible only when NOT in Team tab */}
  {(isSupervisorLike || isHr || isAdmin) && activeTab !== "team" && (
    <div className="info-card decision-card">
      <label className="decision-label">
        Final Last Working Day
        <span className="required">*</span>
      </label>
      <input
        type="date"
        className="date-input"
        value={finalLwd}
        onChange={(e) => setFinalLwd(e.target.value)}
        min={new Date().toISOString().split("T")[0]}
      />
      <p className="helper-text">
        This will become the official last working day
      </p>
    </div>
  )}

  {/* Leave Policy - Only visible in All Employees tab for HR/Admin */}
  {(isHr || isAdmin) && activeTab === "all" && (
    <div className="info-card decision-card">
      <label className="decision-label">
        Leave Encashment / Adjustment Policy <span className="required">*</span>
      </label>
      <div className="radio-group">
        <label className="radio-label">
          <input
            type="radio"
            name="leavePolicy"
            value="all"
            checked={leavePolicy === "all"}
            onChange={(e) => setLeavePolicy(e.target.value)}
          />
          <span>Allow all eligible leaves</span>
        </label>
        <label className="radio-label">
          <input
            type="radio"
            name="leavePolicy"
            value="sick_only"
            checked={leavePolicy === "sick_only"}
            onChange={(e) => setLeavePolicy(e.target.value)}
          />
          <span>Allow only sick &amp; casual leaves</span>
        </label>
        <label className="radio-label">
          <input
            type="radio"
            name="leavePolicy"
            value="none"
            checked={leavePolicy === "none"}
            onChange={(e) => setLeavePolicy(e.target.value)}
          />
          <span>No leaves allowed</span>
        </label>
      </div>
      <p className="helper-text italic">
        This setting will be used for final leave settlement calculation.
      </p>
    </div>
  )}

</div>
                  </>
                )}

                {/* WITHDRAWAL REVIEW */}
                {selectedRequest.type === "withdrawal" && (
                  <div className="reason-section">
                    <div className="info-card reason-card">
                      <div className="info-label">Withdrawal Reason</div>
                      <div className="reason-content">
                        {selectedRequest.withdrawal_reason || "Not provided"}
                      </div>
                    </div>
                  </div>
                )}

                {/* CLEARANCE REVIEW - Only for HR/Admin */}
               {/* ==================== CLEARANCE REVIEW - FIXED FOR TEAM + ALL TABS ==================== */}
{/* ==================== CLEARANCE REVIEW - FIXED FOR TEAM TAB (Supervisor) vs ALL TAB (HR) ==================== */}
{selectedRequest.type === "clearance" && (
  <div className="clearance-section">

    {/* KT Plans */}
    <div className="section-block">
      <div className="flex justify-between items-center mb-4">
        <h4 className="section-title">Knowledge Transfer Plans</h4>
        
        {/* Add KT Button - ONLY visible to the employee themselves (not for supervisor review) */}
        {selectedRequest.employee_id === employeeId && (
          <button
            onClick={() => setShowAddKTModal(true)}
            className="btn btn-primary text-sm px-4 py-1"
          >
            + Add KT Plan
          </button>
        )}
      </div>

      {ktPlans.length === 0 ? (
        <p className="empty-text text-gray-500">No KT plans added yet.</p>
      ) : (
        <div className="cards-grid">
          {ktPlans.map((kt) => (
            <div key={kt.id} className="clearance-card p-4 border rounded-lg">
              <h5 className="card-title font-semibold">{kt.title}</h5>
              <p className="card-description text-gray-600 mt-1">{kt.description}</p>

              {kt.attached_files?.length > 0 && (
                <div className="files-list mt-3">
                  <div className="text-sm font-medium mb-1">Attached Files:</div>
                  {kt.attached_files.map((file, idx) => {
                    const fileName = file.split("/").pop() || file;
                    return (
                      <div key={idx} className="exit-clearance-attachment-row flex justify-between items-center py-1">
                        <span className="text-sm">{fileName}</span>
                      <div className="exf-clearance-file-actions">
  <button
    className="exf-clearance-file-btn exf-clearance-file-btn--view"
    onClick={() => window.open(getFileUrl(file), "_blank")}
  >
    View
  </button>

  <button
    className="exf-clearance-file-btn exf-clearance-file-btn--download"
    onClick={() => downloadFile(file)}
  >
    Download
  </button>
</div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="status-row mt-3">
                <span className="status-label">Status:</span>
                <span className="status-value font-medium">{kt.status || "Pending"}</span>
              </div>

              {/* Approval Checkboxes */}
              <div className="approval-group mt-4 flex flex-col gap-3">
                {/* Supervisor Approval - Always visible in review (editable by supervisor in Team tab) */}
                <label className="checkbox-label flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!kt.supervisor_approved}
                    onChange={(e) => handleApproveItem(kt.id, e.target.checked, "KT")}
                    disabled={loading || activeTab !== "team"}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">Supervisor Approved</span>
                </label>

                {/* HR Approval - Only for HR in All tab */}
                {(isHr || isAdmin) && activeTab === "all" && (
                  <label className="checkbox-label flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!kt.hr_approved}
                      onChange={(e) => handleApproveItem(kt.id, e.target.checked, "KT")}
                      disabled={loading || (isHrOnly && !kt.supervisor_approved)}
                      className="w-4 h-4"
                    />
                    <span className="font-medium">HR Approved</span>
                  </label>
                )}
              </div>

              {/* Edit KT Button - ONLY for the employee themselves */}
              {selectedRequest.employee_id === employeeId && (
                <button
                  onClick={() => startEditKt(kt)}
                  className="text-blue-600 hover:text-blue-800 text-sm mt-3 underline"
                >
                  ✏️ Edit KT Plan
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Assets Section */}
    <div className="section-block mt-8">
      <h4 className="section-title">Assets</h4>
      {assets.length === 0 ? (
        <p className="empty-text text-gray-500">No assets added yet.</p>
      ) : (
        <div className="cards-grid">
          {assets.map((asset) => (
            <div key={asset.id} className="clearance-card p-4 border rounded-lg">
              <h5 className="card-title font-semibold">{asset.title}</h5>
              <p className="card-description mt-1">
                Planned Return: {asset.planned_date ? new Date(asset.planned_date).toLocaleDateString("en-IN") : "—"}
              </p>

              <div className="approval-group mt-4 flex flex-col gap-3">
                <label className="checkbox-label flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!asset.supervisor_approved}
                    onChange={(e) => handleApproveItem(asset.id, e.target.checked, "ASSET")}
                    disabled={loading || activeTab !== "team"}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">Supervisor Approved</span>
                </label>

                {(isHr || isAdmin) && activeTab === "all" && (
                  <label className="checkbox-label flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!asset.hr_approved}
                      onChange={(e) => handleApproveItem(asset.id, e.target.checked, "ASSET")}
                      disabled={loading || (isHrOnly && !asset.supervisor_approved)}
                      className="w-4 h-4"
                    />
                    <span className="font-medium">HR Approved</span>
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* HR Final Evaluation + Finalize - ONLY visible to HR/Admin in All Employees tab */}
    {(isHr || isAdmin) && activeTab === "all" && (
      <>
        <div className="final-evaluation-section mt-10 pt-6 border-t border-gray-200">
          <h4 className="section-title">HR Final Evaluation</h4>

          <div className="info-card decision-card">
            <label className="decision-label">Final Last Working Day <span className="required">*</span></label>
            <input
              type="date"
              className="date-input"
              value={finalLwd || ""}
              onChange={(e) => setFinalLwd(e.target.value)}
            />
          </div>

          {/* 5 Star Rating */}
       <div className="info-card decision-card">
  <label className="decision-label">
    Employee Exit Rating <span className="required">*</span>
  </label>

  <div
    style={{
      display: "flex",
      gap: "6px",
      marginTop: "10px",
      alignItems: "center",
    }}
  >
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        onClick={() => setHrRating(star.toString())}
        style={{
          cursor: "pointer",
          fontSize: "24px",
          lineHeight: "1",
          display: "flex",
          alignItems: "center",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {Number(hrRating) >= star ? (
          <FaStar
            style={{
              color: "#fbbf24",
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.08))",
            }}
          />
        ) : (
          <FaRegStar
            style={{
              color: "#d1d5db",
            }}
          />
        )}
      </span>
    ))}
  </div>

  {hrRating && (
    <p
      style={{
        fontSize: "13px",
        color: "#6b7280",
        marginTop: "10px",
        fontWeight: "500",
      }}
    >
      Selected: {hrRating} star{parseInt(hrRating) > 1 ? "s" : ""}
    </p>
  )}

  {!hrRating && (
    <p
      style={{
        fontSize: "12px",
        color: "#9ca3af",
        marginTop: "8px",
      }}
    >
      Click to rate (1 = Poor, 5 = Excellent)
    </p>
  )}
</div>

          <div className="info-card decision-card">
            <label className="decision-label">HR Final Comments</label>
            <textarea
              className="review-textarea"
              rows={5}
              placeholder="Add final remarks about the exit process..."
              value={hrEvaluationComments || ""}
              onChange={(e) => setHrEvaluationComments(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary mt-4"
            onClick={handleSaveFinalEvaluation}
            disabled={loading || !finalLwd || !hrRating}
          >
            {loading ? "Saving..." : "Save Final Evaluation"}
          </button>
        </div>

        <div className="finalize-wrapper mt-6">
          {selectedRequest.clearance_completed_at ? (
            <div className="success-banner p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-green-700 font-semibold">✓ Exit Flow Completed</div>
            </div>
          ) : (
            <button
              className="finalize-btn btn btn-success w-full"
              onClick={handleFinalizeExit}
              disabled={loading}
            >
              {loading ? "Finalizing..." : "Finalize Exit & Clearance"}
            </button>
          )}
        </div>
      </>
    )}
  </div>
)}
              </div>

              {/* Action Buttons */}
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedRequest(null);
                    setReviewComment("");
                    setRecommendedLwd("");
                    setFinalLwd("");
                    setLeavePolicy("");
                    setHrRating("");
                    setHrEvaluationComments("");
                  }}
                >
                  Cancel
                </button>

                {selectedRequest.type === "normal" && (
                  <div className="action-buttons">
                    {(activeTab === "team" ||
                      isAdmin ||
                      (isHrOrAdmin && selectedRequest.supervisor_status !== "PENDING") ||
                      isSupervisorLike) && (
                      <>
                        <button
                          className="btn btn-success"
                          onClick={() => handleReviewAction("normal", "APPROVED")}
                          disabled={loading ||
                            ((isHr || isAdmin) && activeTab === "all" && (!finalLwd || !leavePolicy))
                          }
                        >
                          {activeTab === "team" ? "Approve" : "Final Approve"}
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleReviewAction("normal", "REJECTED")}
                          disabled={loading}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                )}

                {selectedRequest.type === "withdrawal" && (
                  <div className="action-buttons">
                    <button
                      className="btn btn-success"
                      onClick={() => handleReviewAction("withdrawal", "APPROVED")}
                      disabled={loading}
                    >
                      Approve Withdrawal
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleReviewAction("withdrawal", "REJECTED")}
                      disabled={loading}
                    >
                      Reject Withdrawal
                    </button>
                  </div>
                )}
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
                    editingKtId
                      ? !editKtForm.topic.trim() || !editKtForm.description.trim()
                      : !newKtForm.topic.trim() || !newKtForm.description.trim()
                  }
                  className="exf-kt-btn exf-kt-btn--primary"
                >
                  {editingKtId ? "Update KT Plan" : "Add KT Plan"}
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
        {/* Clearance Modal for Employees */}
        <ClearanceModal
          isOpen={showClearanceModal}
          onClose={() => setShowClearanceModal(false)}
          ktPlans={ktPlans}
          assets={assets}
          onAddKT={handleAddKt}
          onAddAsset={handleAddAsset}
          onFinalize={handleFinalizeClearance}
          loading={loading}
          exitCompleted={exitCompleted}
          newKtForm={newKtForm}
          setNewKtForm={setNewKtForm}
          newAssetForm={newAssetForm}
          setNewAssetForm={setNewAssetForm}
          isHr={isHr || isAdmin}
          viewFile={viewFile}
          startEditKt={startEditKt}
          downloadFile={downloadFile}
          onRefresh={() => fetchClearanceItems(selfRequest?.id)}
        />
      </div>
    </>
  );
}