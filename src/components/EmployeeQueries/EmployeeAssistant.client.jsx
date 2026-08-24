"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { io } from "socket.io-client";

import {
  FiArrowLeft,
  FiBell,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiFileText,
  FiHelpCircle,
  FiMapPin,
  FiMonitor,
  FiMoreVertical,
  FiPaperclip,
  FiSend,
  FiUploadCloud,
  FiUser,
  FiX,
  FiXCircle,
  FiDollarSign,
} from "react-icons/fi";

import { useAuth } from "../../context/AuthProvider.client";
import EmployeeRequestForm from "./EmployeeRequestForm.client";
import EmployeeQuery from "./EmployeeQuery.client";
import AdminQuery from "./AdminQuery.client";
import "./EmployeeAssistant.css";

const REQUEST_TYPES = [
  {
    key: "TRAVEL_BOOKING",
    title: "Travel Booking",
    description: "Request travel tickets for official trips.",
    icon: FiMapPin,
    tone: "purple",
  },
  {
    key: "SALARY_ADVANCE",
    title: "Salary Advance",
    description: "Request advance on your salary.",
    icon: FiDollarSign,
    tone: "green",
  },
  {
    key: "SUPPORTING_DOCUMENT",
    title: "Supporting Documents",
    description: "Request or submit supporting documents.",
    icon: FiFileText,
    tone: "orange",
  },
  {
    key: "ASSET_REQUEST",
    title: "Laptop / Device / Software",
    description: "Request new device, accessory or software.",
    icon: FiMonitor,
    tone: "blue",
  },
  {
    key: "OTHER_QUERY",
    title: "Other Query",
    description: "Ask any other questions.",
    icon: FiHelpCircle,
    tone: "indigo",
  },
];

const statusMap = {
  PENDING_APPROVAL: {
    label: "PENDING SUPERVISOR APPROVAL",
    className: "pending",
  },
  PENDING_ADMIN_ACTION: {
    label: "ADMIN ACTION REQUIRED",
    className: "admin-action",
  },
  BOOKED: {
    label: "TICKET BOOKED",
    className: "booked",
  },
  COMPLETED: {
    label: "COMPLETED",
    className: "completed",
  },
  REJECTED: {
    label: "REJECTED",
    className: "rejected",
  },
};

const stageLabels = {
  SUPERVISOR_APPROVAL: "Supervisor Approval",
  ADMIN_ACTION: "Admin Action",
  EMPLOYEE_CONFIRMATION: "Employee Confirmation",
  COMPLETED: "Completed",
};

const eventLabels = {
  SUBMITTED: "Request Submitted",
  SUPERVISOR_APPROVED: "Approved by Supervisor",
  SUPERVISOR_REJECTED: "Rejected by Supervisor",
  ADMIN_ACTION_REQUIRED: "Admin Action Required",
  BOOKING_CONFIRMED: "Tickets Booked by Admin",
  TRIP_COMPLETED: "Trip Completed",
  REQUEST_REJECTED: "Request Rejected",
};

function normalizeDetails(details) {
  if (!details) return {};

  if (typeof details === "string") {
    try {
      return JSON.parse(details || "{}");
    } catch {
      return {};
    }
  }

  return details;
}

function formatEvent(eventType) {
  return (
    eventLabels[eventType] ||
    String(eventType || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return value;
  }
}

function formatShortDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function getStatus(status) {
  return (
    statusMap[status] || {
      label: String(status || "").replace(/_/g, " "),
      className: "default",
    }
  );
}

function getRequestIcon(type) {
  const found = REQUEST_TYPES.find((item) => item.key === type);
  return found?.icon || FiHelpCircle;
}

function isEmployeeRole(role) {
  return String(role || "").toLowerCase() === "employee";
}

function isAdminRole(role) {
  return String(role || "").toLowerCase() === "admin";
}

const EmployeeAssistant = () => {
  const { user } = useAuth();

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const employeeId = user?.employeeId ?? user?.id ?? null;

  const employeeName = user?.name ?? user?.fullName ?? user?.displayName ?? "";

  const userRole = user?.role ?? user?.userRole ?? "Employee";

  const orgId =
    user?.orgId ??
    user?.raw?.org_id ??
    user?.organization_id ??
    user?.org_id ??
    null;

  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [showForm, setShowForm] = useState(null);

  const [showOtherQuery, setShowOtherQuery] = useState(false);

  const [loading, setLoading] = useState(true);

  const [loadingDetail, setLoadingDetail] = useState(false);

  const [actionComment, setActionComment] = useState("");

  const [requestMessage, setRequestMessage] = useState("");

  const [sendingMessage, setSendingMessage] = useState(false);

  const [bookingForm, setBookingForm] = useState({
    airline: "",
    pnr: "",
    departureTime: "",
    returnTime: "",
    message: "",
    ticket: null,
  });

  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  const [socket, setSocket] = useState(null);

  const [otherQueryKey, setOtherQueryKey] = useState(0);

  const socketRef = useRef(null);
  const selectedRequestRef = useRef(null);

  const headers = useMemo(
    () => ({
      "x-api-key": API_KEY,
      ...(employeeId ? { "x-employee-id": employeeId } : {}),
      ...(orgId ? { "x-org-id": orgId } : {}),
    }),
    [API_KEY, employeeId, orgId],
  );

  const isEmployee = isEmployeeRole(userRole);

  const isAdmin = isAdminRole(userRole);

  const fetchRequests = useCallback(async () => {
    if (!employeeId || !orgId || !BACKEND_URL) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const endpoint = isEmployee
        ? `${BACKEND_URL}/requests/mine`
        : `${BACKEND_URL}/requests/pending`;

      const response = await axios.get(endpoint, {
        headers,
        withCredentials: true,
      });

      const list = response.data?.data || [];

      setRequests(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("[EmployeeAssistant] fetchRequests:", error);

      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL, employeeId, orgId, headers, isEmployee]);

  const loadRequest = useCallback(
    async (requestId) => {
      if (!requestId || !BACKEND_URL) return;

      try {
        setLoadingDetail(true);

        const response = await axios.get(
          `${BACKEND_URL}/requests/${requestId}`,
          {
            headers,
            withCredentials: true,
          },
        );

        const data = response.data?.data || null;

        setSelectedRequest(data);
        selectedRequestRef.current = data;
      } catch (error) {
        console.error("[EmployeeAssistant] loadRequest:", error);
      } finally {
        setLoadingDetail(false);
      }
    },
    [BACKEND_URL, headers],
  );

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (!employeeId || !BACKEND_URL) {
      return undefined;
    }

    const socketUrl = BACKEND_URL.replace(/\/api\/?$/, "");

    const s = io(socketUrl, {
      transports: ["websocket", "polling"],
      path: "/api/socket.io",

      auth: {
        apiKey: API_KEY,
        userId: employeeId,
        ...(orgId ? { orgId } : {}),
      },

      query: {
        userId: employeeId,
        ...(orgId ? { orgId } : {}),
      },
    });

    socketRef.current = s;
    setSocket(s);

    const onRequestUpdate = async (payload) => {
      await fetchRequests();

      const current = selectedRequestRef.current;

      if (
        current?.id &&
        (!payload?.requestId ||
          String(payload.requestId) === String(current.id))
      ) {
        await loadRequest(current.id);
      }
    };

    const onNewMessage = (msg) => {
      const current = selectedRequestRef.current;

      if (
        !current?.thread_id ||
        String(msg?.thread_id) !== String(current.thread_id)
      ) {
        return;
      }

      setSelectedRequest((prev) => {
        if (!prev) return prev;

        const existing = prev.messages || [];

        const exists = existing.some(
          (item) => String(item.id) === String(msg.id),
        );

        if (exists) {
          return prev;
        }

        return {
          ...prev,
          messages: [...existing, msg],
        };
      });
    };

    s.on("employeeRequestUpdated", onRequestUpdate);

    s.on("newMessage", onNewMessage);

    return () => {
      s.off("employeeRequestUpdated", onRequestUpdate);

      s.off("newMessage", onNewMessage);

      s.disconnect();

      socketRef.current = null;
    };
  }, [API_KEY, BACKEND_URL, employeeId, orgId, fetchRequests, loadRequest]);

  useEffect(() => {
    selectedRequestRef.current = selectedRequest;
  }, [selectedRequest]);

  useEffect(() => {
    if (socketRef.current?.connected && selectedRequest?.thread_id) {
      socketRef.current.emit("joinThread", selectedRequest.thread_id);
    }
  }, [selectedRequest?.thread_id]);

  const resetBookingForm = () => {
    setBookingForm({
      airline: "",
      pnr: "",
      departureTime: "",
      returnTime: "",
      message: "",
      ticket: null,
    });
  };

  const submitRequest = async ({ requestType, title, details, file }) => {
    if (!employeeId || !orgId) {
      throw new Error("Employee or organization information is missing.");
    }

    const response = await axios.post(
      `${BACKEND_URL}/requests`,
      {
        requestType,
        title,
        details,
      },
      {
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      },
    );

    const created = response.data?.data;

    /*
      The current backend createRequest endpoint
      accepts JSON only. We keep the selected
      supporting file in the form UI for now.

      Travel booking's e-ticket is uploaded later
      by Admin through /requests/:requestId/book.
    */

    if (file) {
      console.info("[EmployeeAssistant] selected file:", file.name);
    }

    await fetchRequests();

    if (created?.id) {
      await loadRequest(created.id);
    }

    return created;
  };

  const approveRequest = async () => {
    if (!selectedRequest) return;

    try {
      await axios.post(
        `${BACKEND_URL}/requests/${selectedRequest.id}/approve`,
        {
          comment: actionComment.trim(),
        },
        {
          headers,
          withCredentials: true,
        },
      );

      setActionComment("");

      await fetchRequests();

      await loadRequest(selectedRequest.id);
    } catch (error) {
      console.error("[EmployeeAssistant] approve:", error);

      alert(error.response?.data?.message || "Approval failed.");
    }
  };

  const rejectRequest = async () => {
    if (!selectedRequest) return;

    try {
      await axios.post(
        `${BACKEND_URL}/requests/${selectedRequest.id}/reject`,
        {
          comment: actionComment.trim(),
        },
        {
          headers,
          withCredentials: true,
        },
      );

      setActionComment("");

      await fetchRequests();

      await loadRequest(selectedRequest.id);
    } catch (error) {
      console.error("[EmployeeAssistant] reject:", error);

      alert(error.response?.data?.message || "Rejection failed.");
    }
  };

  const submitTravelBooking = async () => {
    if (!selectedRequest) return;

    if (!bookingForm.airline.trim() || !bookingForm.pnr.trim()) {
      alert("Airline and PNR are required.");
      return;
    }

    if (!bookingForm.ticket) {
      alert("Please upload the e-ticket PDF.");
      return;
    }

    try {
      setBookingSubmitting(true);

      const formData = new FormData();

      formData.append("airline", bookingForm.airline);

      formData.append("pnr", bookingForm.pnr);

      formData.append("departureTime", bookingForm.departureTime);

      formData.append("returnTime", bookingForm.returnTime);

      formData.append("message", bookingForm.message);

      formData.append("e_ticket", bookingForm.ticket);

      await axios.post(
        `${BACKEND_URL}/requests/${selectedRequest.id}/book`,
        formData,
        {
          headers: {
            ...headers,
          },
          withCredentials: true,
        },
      );

      resetBookingForm();

      await fetchRequests();

      await loadRequest(selectedRequest.id);
    } catch (error) {
      console.error("[EmployeeAssistant] bookTravel:", error);

      alert(error.response?.data?.message || "Unable to complete booking.");
    } finally {
      setBookingSubmitting(false);
    }
  };

  const completeTrip = async () => {
    if (!selectedRequest) return;

    try {
      await axios.post(
        `${BACKEND_URL}/requests/${selectedRequest.id}/complete`,
        {
          comment: "Employee confirmed trip completion.",
        },
        {
          headers,
          withCredentials: true,
        },
      );

      await fetchRequests();

      await loadRequest(selectedRequest.id);
    } catch (error) {
      console.error("[EmployeeAssistant] complete:", error);

      alert(error.response?.data?.message || "Unable to complete request.");
    }
  };

  const sendRequestMessage = async () => {
    if (!selectedRequest?.thread_id) {
      return;
    }

    if (!requestMessage.trim()) {
      return;
    }

    const recipientId =
      String(selectedRequest.employee_id) === String(employeeId)
        ? selectedRequest.current_assignee_id
        : selectedRequest.employee_id;

    if (!recipientId) {
      alert("Recipient could not be determined.");
      return;
    }

    const payload = {
      thread_id: selectedRequest.thread_id,
      sender_id: employeeId,
      sender_role: userRole,
      recipient_id: recipientId,
      sender_name: employeeName,
      message: requestMessage.trim(),
    };

    try {
      setSendingMessage(true);

      if (socketRef.current?.connected) {
        await new Promise((resolve, reject) => {
          socketRef.current.emit("sendQueryMessage", payload, (response) => {
            if (response?.success) {
              resolve(response);
            } else {
              reject(new Error(response?.error || "Socket message failed"));
            }
          });
        });
      } else {
        await axios.post(
          `${BACKEND_URL}/threads/${selectedRequest.thread_id}/messages`,
          payload,
          {
            headers,
            withCredentials: true,
          },
        );
      }

      setRequestMessage("");

      await loadRequest(selectedRequest.id);
    } catch (error) {
      console.error("[EmployeeAssistant] sendRequestMessage:", error);

      alert("Unable to send message.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleOtherQuery = () => {
    setShowOtherQuery(true);
    setOtherQueryKey((value) => value + 1);
  };

  const backToAssistant = () => {
    setShowOtherQuery(false);
    setSelectedRequest(null);
    fetchRequests();
  };

  if (showOtherQuery) {
    return (
      <div className="assistant-other-query-wrapper">
        <div className="assistant-other-query-topbar">
          <button
            type="button"
            className="assistant-back-button"
            onClick={backToAssistant}
          >
            <FiArrowLeft />
            <span>Back to AI Assistant</span>
          </button>
        </div>

        {isAdmin ? (
          <AdminQuery key={otherQueryKey} />
        ) : (
          <EmployeeQuery key={otherQueryKey} />
        )}
      </div>
    );
  }

  return (
    <div className="employee-assistant">
      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="assistant-header">
        <div className="assistant-brand">
          <div className="assistant-logo">✦</div>

          <div>
            <h1>AI Assistant</h1>

            <div className="assistant-online">
              <span />
              Online
            </div>
          </div>
        </div>

        <div className="assistant-actions">
          <FiClock />
          <FiBell />
          <FiMoreVertical />
        </div>
      </header>

      {/* ==================================================
          MAIN
      ================================================== */}

      <main className="assistant-body">
        {!selectedRequest ? (
          <>
            {/* Welcome */}

            <div className="assistant-welcome">
              <div className="assistant-avatar">✦</div>

              <div className="assistant-message">
                <strong>
                  AI Assistant
                  <small>{formatDate(new Date())}</small>
                </strong>

                <span>Hello! I'm your AI Assistant.</span>

                <span>How can I help you today?</span>
              </div>
            </div>

            {/* Main topic area */}

            <div className="assistant-topic-title">
              <h2>How can I help you today?</h2>

              <p>
                Select an option below or type your query in the chat to ask
                anything.
              </p>
            </div>

            <div className="assistant-category-grid">
              {REQUEST_TYPES.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`assistant-category-card ${item.tone}`}
                    onClick={() => {
                      if (item.key === "OTHER_QUERY") {
                        handleOtherQuery();
                        return;
                      }

                      setShowForm(item.key);
                    }}
                  >
                    <div className="category-icon">
                      <Icon />
                    </div>

                    <h3>{item.title}</h3>

                    <p>{item.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Requests */}

            {requests.length > 0 && (
              <section className="assistant-request-history">
                <div className="history-heading">
                  <div>
                    <h2>
                      {isEmployee ? "My Requests" : "Requests Awaiting You"}
                    </h2>

                    <p>
                      {isEmployee
                        ? "Track your submitted requests."
                        : "Requests currently assigned to you."}
                    </p>
                  </div>

                  <span className="history-count">{requests.length}</span>
                </div>

                <div className="history-list">
                  {requests.map((request) => (
                    <button
                      type="button"
                      key={request.id}
                      className="history-item"
                      onClick={() => loadRequest(request.id)}
                    >
                      <div className="history-icon">
                        {(() => {
                          const Icon = getRequestIcon(request.request_type);

                          return <Icon />;
                        })()}
                      </div>

                      <div className="history-content">
                        <strong>{request.title}</strong>

                        <span>{request.request_code}</span>

                        <small>{request.employee_name}</small>
                      </div>

                      <span
                        className={`history-status ${
                          getStatus(request.current_status).className
                        }`}
                      >
                        {getStatus(request.current_status).label}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {!isEmployee && requests.length === 0 && !loading && (
              <div className="empty-request-state">
                <FiCheckCircle />
                <h3>No requests are waiting for you</h3>

                <p>New approval and processing requests will appear here.</p>
              </div>
            )}
          </>
        ) : (
          <RequestConversation
            request={selectedRequest}
            loading={loadingDetail}
            employeeId={employeeId}
            userRole={userRole}
            isAdmin={isAdmin}
            actionComment={actionComment}
            setActionComment={setActionComment}
            approveRequest={approveRequest}
            rejectRequest={rejectRequest}
            bookingForm={bookingForm}
            setBookingForm={setBookingForm}
            bookingSubmitting={bookingSubmitting}
            submitTravelBooking={submitTravelBooking}
            completeTrip={completeTrip}
            requestMessage={requestMessage}
            setRequestMessage={setRequestMessage}
            sendRequestMessage={sendRequestMessage}
            sendingMessage={sendingMessage}
            onBack={() => setSelectedRequest(null)}
          />
        )}
      </main>

      {/* ==================================================
          INPUT
      ================================================== */}

      {!selectedRequest && (
        <div className="assistant-input">
          <div className="assistant-input-box">
            <input
              disabled
              placeholder="Select a topic above or choose Other Query"
            />

            <div className="assistant-input-actions">
              <FiPaperclip />
            </div>
          </div>

          <button
            type="button"
            className="assistant-send"
            onClick={handleOtherQuery}
          >
            <FiSend />
          </button>
        </div>
      )}

      {selectedRequest && (
        <div className="assistant-input request-chat-input">
          <div className="assistant-input-box">
            <input
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendRequestMessage();
                }
              }}
              placeholder="Type your message..."
              disabled={sendingMessage}
            />

            <div className="assistant-input-actions">
              <FiPaperclip />
            </div>
          </div>

          <button
            type="button"
            className="assistant-send"
            onClick={sendRequestMessage}
            disabled={sendingMessage || !requestMessage.trim()}
          >
            <FiSend />
          </button>
        </div>
      )}

      {showForm && (
        <EmployeeRequestForm
          type={showForm}
          onClose={() => setShowForm(null)}
          onSubmit={submitRequest}
        />
      )}
    </div>
  );
};

/* ==========================================================
   REQUEST CONVERSATION
========================================================== */

function RequestConversation({
  request,
  loading,
  employeeId,
  userRole,
  isAdmin,
  actionComment,
  setActionComment,
  approveRequest,
  rejectRequest,
  bookingForm,
  setBookingForm,
  bookingSubmitting,
  submitTravelBooking,
  completeTrip,
  onBack,
}) {
  const details = normalizeDetails(request?.details_json);

  const isRequester = String(request.employee_id) === String(employeeId);

  const isCurrentAssignee =
    String(request.current_assignee_id) === String(employeeId);

  const canApprove =
    isCurrentAssignee && request.current_status === "PENDING_APPROVAL";

  const canBookTravel =
    isAdmin &&
    isCurrentAssignee &&
    request.current_status === "PENDING_ADMIN_ACTION" &&
    request.request_type === "TRAVEL_BOOKING";

  const canComplete =
    isRequester &&
    request.current_status === "BOOKED" &&
    request.request_type === "TRAVEL_BOOKING";

  const status = getStatus(request.current_status);

  const RequestIcon = getRequestIcon(request.request_type);

  return (
    <div className="request-conversation">
      <div className="request-conversation-top">
        <button type="button" className="assistant-back" onClick={onBack}>
          <FiArrowLeft />
          <span>Back</span>
        </button>

        <div className="request-stage-text">
          {stageLabels[request.current_stage] || request.current_stage}
        </div>
      </div>

      {loading ? (
        <div className="request-loading">Loading request...</div>
      ) : (
        <>
          <div className="assistant-request-message">
            <div className="assistant-avatar">✦</div>

            <div className="assistant-message">
              <strong>AI Assistant</strong>

              <span>
                {request.current_status === "PENDING_APPROVAL"
                  ? "Your request is pending approval."
                  : request.current_status === "PENDING_ADMIN_ACTION"
                    ? "Your request is being processed by Admin."
                    : request.current_status === "BOOKED"
                      ? "Your travel tickets have been booked."
                      : request.current_status === "COMPLETED"
                        ? "Your request has been completed."
                        : request.current_status === "REJECTED"
                          ? "Your request was rejected."
                          : "Here is the current status of your request."}
              </span>
            </div>
          </div>

          {/* Request card */}

          <section className="request-detail-card">
            <div className="request-detail-header">
              <div className="request-detail-icon">
                <RequestIcon />
              </div>

              <div className="request-detail-heading">
                <h2>{request.title}</h2>

                <span>{request.request_code}</span>
              </div>

              <span className={`request-status ${status.className}`}>
                {status.label}
              </span>
            </div>

            <div className="request-meta-grid">
              <div>
                <span>Request ID</span>

                <strong>{request.request_code}</strong>
              </div>

              <div>
                <span>Requested by</span>

                <strong>{request.employee_name || request.employee_id}</strong>
              </div>

              <div>
                <span>Submitted on</span>

                <strong>{formatDate(request.created_at)}</strong>
              </div>

              <div>
                <span>Current stage</span>

                <strong>
                  {stageLabels[request.current_stage] || request.current_stage}
                </strong>
              </div>
            </div>

            <RequestSummary request={request} />

            {/* Supervisor approval */}

            {canApprove && (
              <div className="workflow-action-card supervisor-action">
                <div className="workflow-action-heading">
                  <div>
                    <span>Supervisor Approval</span>

                    <h3>Please review the request and take action.</h3>
                  </div>

                  <span className="action-pill warning">Pending Approval</span>
                </div>

                <textarea
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  placeholder="Enter your comments... (optional)"
                  maxLength={500}
                />

                <div className="approval-actions">
                  <button
                    type="button"
                    className="reject-action"
                    onClick={rejectRequest}
                  >
                    <FiXCircle />
                    Reject
                  </button>

                  <button
                    type="button"
                    className="approve-action"
                    onClick={approveRequest}
                  >
                    <FiCheckCircle />
                    Approve
                  </button>
                </div>
              </div>
            )}

            {/* Admin travel booking */}

            {canBookTravel && (
              <div className="workflow-action-card booking-action">
                <div className="workflow-action-heading">
                  <div>
                    <span>Admin Booking</span>

                    <h3>Book the ticket and share the e-ticket.</h3>
                  </div>

                  <span className="action-pill info">Action Required</span>
                </div>

                <div className="booking-form-grid">
                  <div className="assistant-field">
                    <label>Airline</label>

                    <input
                      value={bookingForm.airline}
                      onChange={(e) =>
                        setBookingForm((prev) => ({
                          ...prev,
                          airline: e.target.value,
                        }))
                      }
                      placeholder="IndiGo"
                    />
                  </div>

                  <div className="assistant-field">
                    <label>PNR</label>

                    <input
                      value={bookingForm.pnr}
                      onChange={(e) =>
                        setBookingForm((prev) => ({
                          ...prev,
                          pnr: e.target.value,
                        }))
                      }
                      placeholder="6F2X7B"
                    />
                  </div>

                  <div className="assistant-field">
                    <label>Departure</label>

                    <input
                      type="datetime-local"
                      value={bookingForm.departureTime}
                      onChange={(e) =>
                        setBookingForm((prev) => ({
                          ...prev,
                          departureTime: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="assistant-field">
                    <label>Return</label>

                    <input
                      type="datetime-local"
                      value={bookingForm.returnTime}
                      onChange={(e) =>
                        setBookingForm((prev) => ({
                          ...prev,
                          returnTime: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="assistant-field full">
                    <label>E-Ticket</label>

                    <label className="assistant-upload-box">
                      <FiUploadCloud />

                      <span>
                        {bookingForm.ticket
                          ? bookingForm.ticket.name
                          : "Upload e-ticket PDF"}
                      </span>

                      <input
                        type="file"
                        hidden
                        accept=".pdf,application/pdf"
                        onChange={(e) =>
                          setBookingForm((prev) => ({
                            ...prev,
                            ticket: e.target.files?.[0] || null,
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div className="assistant-field full">
                    <label>Message to Employee</label>

                    <textarea
                      value={bookingForm.message}
                      onChange={(e) =>
                        setBookingForm((prev) => ({
                          ...prev,
                          message: e.target.value,
                        }))
                      }
                      placeholder="Enter message to user..."
                      maxLength={500}
                    />
                  </div>
                </div>

                <div className="booking-actions">
                  <button
                    type="button"
                    className="save-draft-button"
                    disabled={bookingSubmitting}
                  >
                    Save as Draft
                  </button>

                  <button
                    type="button"
                    className="upload-notify-button"
                    onClick={submitTravelBooking}
                    disabled={bookingSubmitting}
                  >
                    <FiUploadCloud />

                    {bookingSubmitting
                      ? "Processing..."
                      : "Upload & Notify User"}
                  </button>
                </div>
              </div>
            )}

            {/* Non-travel admin action */}

            {isAdmin &&
              isCurrentAssignee &&
              request.current_status === "PENDING_ADMIN_ACTION" &&
              request.request_type !== "TRAVEL_BOOKING" && (
                <div className="workflow-info-card">
                  <FiClock />

                  <div>
                    <strong>Admin action required</strong>

                    <p>
                      This request has been approved and is waiting for the
                      corresponding admin processing flow.
                    </p>
                  </div>
                </div>
              )}

            {/* Booking details */}

            {request.current_status === "BOOKED" &&
              request.request_type === "TRAVEL_BOOKING" && (
                <BookingDetails details={details} request={request} />
              )}

            {/* Final employee confirmation */}

            {canComplete && (
              <div className="workflow-action-card completion-action">
                <div className="workflow-action-heading">
                  <div>
                    <span>Employee Confirmation</span>

                    <h3>Have you completed your trip?</h3>
                  </div>

                  <span className="action-pill success">Ticket Confirmed</span>
                </div>

                <p>
                  Your travel booking has been completed. After your trip, mark
                  this request as completed.
                </p>

                <button
                  type="button"
                  className="complete-trip-button"
                  onClick={completeTrip}
                >
                  <FiCheck />I have completed my trip
                </button>
              </div>
            )}

            {/* Completed */}

            {request.current_status === "COMPLETED" && (
              <div className="workflow-success-card">
                <FiCheckCircle />

                <div>
                  <strong>Trip Completed</strong>

                  <p>We hope you had a productive trip.</p>
                </div>
              </div>
            )}

            {/* Rejected */}

            {request.current_status === "REJECTED" && (
              <div className="workflow-rejected-card">
                <FiXCircle />

                <div>
                  <strong>Request Rejected</strong>

                  <p>
                    {getLatestEventMessage(request) ||
                      "This request was rejected."}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Timeline */}

          <RequestTimeline events={request.events || []} />

          {/* Messages */}

          <RequestMessages
            messages={request.messages || []}
            employeeId={employeeId}
          />
        </>
      )}
    </div>
  );
}

/* ==========================================================
   REQUEST SUMMARY
========================================================== */

function RequestSummary({ request }) {
  const details = normalizeDetails(request.details_json);

  if (request.request_type === "TRAVEL_BOOKING") {
    return (
      <div className="request-summary-card">
        <div className="summary-heading">
          <h3>Request Summary</h3>
        </div>

        <div className="request-summary-grid">
          <SummaryField label="From" value={details.from} />

          <SummaryField label="To" value={details.to} />

          <SummaryField
            label="Travel Date"
            value={formatShortDate(details.travelDate)}
          />

          <SummaryField
            label="Return Date"
            value={formatShortDate(details.returnDate)}
          />

          <SummaryField label="Class" value={details.travelClass} />

          <SummaryField label="Trip Type" value={details.tripType} />

          <SummaryField label="Purpose" value={details.purpose} full />

          <SummaryField
            label="Travelers"
            value={
              Array.isArray(details.travelers)
                ? details.travelers.join(", ")
                : details.travelers
            }
            full
          />

          {details.additionalInfo && (
            <SummaryField
              label="Additional Information"
              value={details.additionalInfo}
              full
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="request-summary-card">
      <div className="summary-heading">
        <h3>Request Summary</h3>
      </div>

      <div className="request-summary-grid">
        {Object.entries(details).map(([key, value]) => (
          <SummaryField
            key={key}
            label={formatKey(key)}
            value={
              Array.isArray(value)
                ? value.join(", ")
                : typeof value === "object" && value !== null
                  ? JSON.stringify(value)
                  : value
            }
          />
        ))}
      </div>
    </div>
  );
}

function SummaryField({ label, value, full = false }) {
  return (
    <div className={`summary-field ${full ? "full" : ""}`}>
      <span>{label}</span>

      <strong>{value || "—"}</strong>
    </div>
  );
}

/* ==========================================================
   BOOKING DETAILS
========================================================== */

function BookingDetails({ details, request }) {
  return (
    <div className="booking-details-card">
      <div className="booking-details-header">
        <div>
          <span>Booking Details</span>

          <h3>Travel Ticket Request</h3>
        </div>

        <span className="request-status booked">TICKET BOOKED</span>
      </div>

      <div className="booking-details-grid">
        <SummaryField
          label="Booked By"
          value={details.bookedByName || details.bookedBy}
        />

        <SummaryField label="Booked On" value={formatDate(details.bookedOn)} />

        <SummaryField label="Airline" value={details.airline} />

        <SummaryField label="PNR" value={details.pnr} />

        <SummaryField label="Departure" value={details.departureTime} />

        <SummaryField label="Return" value={details.returnTime} />

        <SummaryField
          label="Route"
          value={`${details.from || "—"} → ${details.to || "—"}`}
          full
        />
      </div>

      {details.eTicketFileName && (
        <a
          className="ticket-download"
          href="#"
          onClick={(e) => {
            e.preventDefault();

            if (typeof window !== "undefined") {
              const base = process.env.NEXT_PUBLIC_BACKEND_URL || "";

              const employeeId = request.employee_id;

              const orgId = request.org_id;

              const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

              const url = `${base}/requests/attachments/${encodeURIComponent(
                details.eTicketFileName,
              )}`;

              /*
                The application's existing
                auth middleware requires headers,
                so download through fetch.
              */

              fetch(url, {
                headers: {
                  "x-api-key": API_KEY,
                  "x-employee-id": employeeId,
                  "x-org-id": orgId,
                },
                credentials: "include",
              })
                .then((response) => response.blob())
                .then((blob) => {
                  const objectUrl = URL.createObjectURL(blob);

                  const link = document.createElement("a");

                  link.href = objectUrl;

                  link.download = details.eTicketFileName;

                  document.body.appendChild(link);

                  link.click();

                  link.remove();

                  URL.revokeObjectURL(objectUrl);
                })
                .catch((error) =>
                  console.error("Ticket download failed:", error),
                );
            }
          }}
        >
          <FiDownload />

          {details.eTicketFileName}

          <span>Download</span>
        </a>
      )}
    </div>
  );
}

/* ==========================================================
   TIMELINE
========================================================== */

function RequestTimeline({ events }) {
  if (!events?.length) {
    return null;
  }

  return (
    <div className="request-timeline-card">
      <div className="summary-heading">
        <h3>Request Timeline</h3>
      </div>

      <div className="timeline">
        {events.map((event, index) => {
          const isLast = index === events.length - 1;

          return (
            <div
              className="timeline-row"
              key={event.id ?? `${event.event_type}-${index}`}
            >
              <div className="timeline-indicator">
                <span
                  className={isLast ? "timeline-dot active" : "timeline-dot"}
                >
                  <FiCheck />
                </span>

                {!isLast && <span className="timeline-line" />}
              </div>

              <div className="timeline-content">
                <strong>{formatEvent(event.event_type)}</strong>

                <span>{formatDate(event.created_at)}</span>

                {event.actor_name && <small>{event.actor_name}</small>}

                {event.message && <p>{event.message}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ==========================================================
   REQUEST MESSAGES
========================================================== */

function RequestMessages({ messages, employeeId }) {
  if (!messages?.length) {
    return null;
  }

  return (
    <div className="request-thread-card">
      <div className="summary-heading">
        <h3>Conversation</h3>
      </div>

      <div className="request-thread-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`request-thread-message ${
              String(message.sender_id) === String(employeeId)
                ? "outgoing"
                : "incoming"
            }`}
          >
            <div className="thread-message-name">
              {message.sender_name || message.sender_role}
            </div>

            <div className="thread-message-bubble">
              {message.message && <p>{message.message}</p>}

              {message.attachment_url && (
                <div className="thread-attachment">📎 Attachment</div>
              )}

              <small>{formatDate(message.created_at)}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getLatestEventMessage(request) {
  const events = request?.events || [];

  return (
    [...events]
      .reverse()
      .find(
        (event) =>
          event.event_type === "REQUEST_REJECTED" ||
          event.event_type === "SUPERVISOR_REJECTED",
      )?.message || ""
  );
}

function formatKey(key) {
  return String(key)
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

export default EmployeeAssistant;
