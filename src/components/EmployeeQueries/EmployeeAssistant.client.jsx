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
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiFileText,
  FiHelpCircle,
  FiList,
  FiMapPin,
  FiMonitor,
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
import Modal from "../Modal/Modal.client";
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
  CANCELLED: {
    label: "CANCELLED",
    className: "cancelled",
  },
};

const stageLabels = {
  SUPERVISOR_APPROVAL: "Supervisor Approval",
  ADMIN_ACTION: "Admin Action",
  PROJECT_HEAD_APPROVAL: "Project Head Approval",
  HR_FINANCE_APPROVAL: "HR and Finance Approval",
  FINANCE_APPROVAL: "Finance Approval",
  TRAVEL_DESK_ACTION: "Travel Desk Action",
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
  REQUEST_CANCELLED: "Request Cancelled",
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

function getRequestTone(type) {
  const found = REQUEST_TYPES.find((item) => item.key === type);
  return found?.tone || "indigo";
}

function isEmployeeRole(role) {
  return String(role || "").toLowerCase() === "employee";
}

function isAdminRole(role) {
  return String(role || "").toLowerCase() === "admin";
}

function isTravelOperatorRole(role) {
  return ["admin", "traveldesk", "finance", "financeteam"].includes(
    String(role || "")
      .toLowerCase()
      .replace(/[^a-z]/g, ""),
  );
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
  const [requestFilter, setRequestFilter] = useState("ALL");
  const [showRequestHistory, setShowRequestHistory] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [showForm, setShowForm] = useState(null);

  const [showOtherQuery, setShowOtherQuery] = useState(false);

  const [loading, setLoading] = useState(true);

  const [loadingDetail, setLoadingDetail] = useState(false);

  const [actionComment, setActionComment] = useState("");

  const [requestMessage, setRequestMessage] = useState("");

  const [sendingMessage, setSendingMessage] = useState(false);
  const [dialog, setDialog] = useState({
    isVisible: false,
    title: "",
    message: "",
    buttons: [],
  });

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
  const isTravelOperator = isTravelOperatorRole(userRole);

  const fetchRequests = useCallback(async () => {
    if (!employeeId || !orgId || !BACKEND_URL) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const endpoint = isEmployee
        ? `${BACKEND_URL}/requests/mine`
        : isTravelOperator
          ? `${BACKEND_URL}/requests/travel-operations`
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
  }, [BACKEND_URL, employeeId, orgId, headers, isEmployee, isTravelOperator]);

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
        setShowRequestHistory(false);
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

      showAlert(error.response?.data?.message || "Approval failed.");
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

      showAlert(error.response?.data?.message || "Rejection failed.");
    }
  };

  const submitTravelBooking = async () => {
    if (!selectedRequest) return;

    if (!bookingForm.airline.trim() || !bookingForm.pnr.trim()) {
      showAlert("Airline and PNR are required.");
      return;
    }

    if (!bookingForm.ticket) {
      showAlert("Please upload the e-ticket PDF.");
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

      showAlert(error.response?.data?.message || "Unable to complete booking.");
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

      showAlert(error.response?.data?.message || "Unable to complete request.");
    }
  };

  const cancelRequest = async () => {
    if (!selectedRequest) return;

    setDialog({
      isVisible: true,
      title: "Cancel request",
      message: "Are you sure you want to cancel this request?",
      buttons: [
        {
          label: "Keep request",
          onClick: () => setDialog((prev) => ({ ...prev, isVisible: false })),
        },
        {
          label: "Cancel request",
          className: "ac-modal-btn ac-modal-btn-danger",
          onClick: async () => {
            setDialog((prev) => ({ ...prev, isVisible: false }));
            await performCancelRequest();
          },
        },
      ],
    });
  };

  const showAlert = (message, title = "") =>
    setDialog({
      isVisible: true,
      title,
      message,
      buttons: [{ label: "OK", onClick: closeDialog }],
    });

  const closeDialog = () =>
    setDialog({ isVisible: false, title: "", message: "", buttons: [] });

  const performCancelRequest = async () => {
    if (!selectedRequest) return;

    try {
      await axios.post(
        `${BACKEND_URL}/requests/${selectedRequest.id}/cancel`,
        {},
        { headers, withCredentials: true },
      );
      await fetchRequests();
      await loadRequest(selectedRequest.id);
    } catch (error) {
      console.error("[EmployeeAssistant] cancel:", error);
      showAlert(error.response?.data?.message || "Unable to cancel request.");
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
      showAlert("Recipient could not be determined.");
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

      showAlert("Unable to send message.");
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
            <span>Back to Employee Services</span>
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

  if (showRequestHistory) {
    return (
      <div className="assistant-history-wrapper">
        <div className="assistant-history-topbar">
          <button
            type="button"
            className="assistant-back-button"
            onClick={() => setShowRequestHistory(false)}
          >
            <FiArrowLeft />
            <span>Back to Employee Services</span>
          </button>
        </div>

        <RequestHistory
          requests={requests}
          requestFilter={requestFilter}
          setRequestFilter={setRequestFilter}
          loading={loading}
          isEmployee={isEmployee}
          loadRequest={loadRequest}
        />
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
            <h1>Employee Services</h1>

            <div className="assistant-online">
              <span />
              Request hub
            </div>
          </div>
        </div>
      </header>

      {/* ==================================================
          MAIN
      ================================================== */}

      <main className="assistant-body">
        {!selectedRequest ? (
          <>
            <div className="assistant-topic-title">
              <h2>What do you need help with?</h2>
              <p>
                Choose a service to get started, or open your request history.
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

              <button
                type="button"
                className="assistant-category-card history-card"
                onClick={() => setShowRequestHistory(true)}
              >
                <div className="category-icon">
                  <FiList />
                </div>

                <h3>{isEmployee ? "My Requests" : "Assigned Requests"}</h3>

                <p>View previously raised requests and filter by category.</p>
              </button>
            </div>
          </>
        ) : (
          <RequestConversation
            request={selectedRequest}
            loading={loadingDetail}
            employeeId={employeeId}
            userRole={userRole}
            isAdmin={isAdmin}
            isTravelOperator={isTravelOperator}
            actionComment={actionComment}
            setActionComment={setActionComment}
            approveRequest={approveRequest}
            rejectRequest={rejectRequest}
            bookingForm={bookingForm}
            setBookingForm={setBookingForm}
            bookingSubmitting={bookingSubmitting}
            submitTravelBooking={submitTravelBooking}
            completeTrip={completeTrip}
            cancelRequest={cancelRequest}
            requestMessage={requestMessage}
            setRequestMessage={setRequestMessage}
            sendRequestMessage={sendRequestMessage}
            sendingMessage={sendingMessage}
            onBack={() => setSelectedRequest(null)}
          />
        )}
      </main>

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

      <Modal
        isVisible={dialog.isVisible}
        title={dialog.title}
        onClose={closeDialog}
        buttons={dialog.buttons}
      >
        <p style={{ whiteSpace: "pre-wrap" }}>{dialog.message}</p>
      </Modal>

      {showForm && (
        <EmployeeRequestForm
          type={showForm}
          userRole={userRole}
          employeeId={employeeId}
          orgId={orgId}
          onClose={() => setShowForm(null)}
          onSubmit={submitRequest}
        />
      )}
    </div>
  );
};

function RequestHistory({
  requests,
  requestFilter,
  setRequestFilter,
  loading,
  isEmployee,
  loadRequest,
}) {
  return (
    <main className="assistant-history-body">
      <div className="assistant-history-heading">
        <div>
          <span className="assistant-section-eyebrow">Request workspace</span>
          <h1>{isEmployee ? "My Requests" : "Assigned Requests"}</h1>
          <p>
            {isEmployee
              ? "Track requests you have submitted."
              : "Review requests currently assigned to you."}
          </p>
        </div>

        <span className="history-count">{requests.length}</span>
      </div>

      {requests.length > 0 && (
        <div className="request-filter-row">
          <label htmlFor="request-filter">Filter requests</label>
          <select
            id="request-filter"
            value={requestFilter}
            onChange={(event) => setRequestFilter(event.target.value)}
          >
            <option value="ALL">All categories</option>
            {REQUEST_TYPES.filter((item) => item.key !== "OTHER_QUERY").map(
              (item) => (
                <option key={item.key} value={item.key}>
                  {item.title}
                </option>
              ),
            )}
          </select>
        </div>
      )}

      {loading ? (
        <div className="request-loading">Loading requests...</div>
      ) : requests.length > 0 ? (
        <div className="history-list">
          {requests
            .filter(
              (request) =>
                requestFilter === "ALL" ||
                request.request_type === requestFilter,
            )
            .map((request) => (
              <button
                type="button"
                key={request.id}
                className={`history-item ${getRequestTone(request.request_type)}`}
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
      ) : (
        <div className="empty-request-state">
          <FiCheckCircle />
          <h3>
            {isEmployee
              ? "You have not raised any requests yet"
              : "No requests are waiting for you"}
          </h3>
          <p>
            {isEmployee
              ? "Your submitted requests will appear here."
              : "New approval and processing requests will appear here."}
          </p>
        </div>
      )}
    </main>
  );
}

/* ==========================================================
   REQUEST CONVERSATION
========================================================== */

function RequestConversation({
  request,
  loading,
  employeeId,
  userRole,
  isAdmin,
  isTravelOperator,
  actionComment,
  setActionComment,
  approveRequest,
  rejectRequest,
  bookingForm,
  setBookingForm,
  bookingSubmitting,
  submitTravelBooking,
  completeTrip,
  cancelRequest,
  onBack,
}) {
  const details = normalizeDetails(request?.details_json);

  const isRequester = String(request.employee_id) === String(employeeId);

  const isCurrentAssignee =
    String(request.current_assignee_id) === String(employeeId);

  const canApprove =
    isCurrentAssignee && request.current_status === "PENDING_APPROVAL";

  const canBookTravel =
    isTravelOperator &&
    isCurrentAssignee &&
    request.current_status === "PENDING_ADMIN_ACTION" &&
    request.request_type === "TRAVEL_BOOKING";

  const canComplete =
    isRequester &&
    request.current_status === "BOOKED" &&
    request.request_type === "TRAVEL_BOOKING";

  const canCancel =
    isRequester &&
    !["COMPLETED", "REJECTED", "CANCELLED"].includes(request.current_status);

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
              <strong>Request Update</strong>

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

            {canCancel && (
              <button
                type="button"
                className="cancel-request-button"
                onClick={cancelRequest}
              >
                <FiXCircle />
                Cancel request
              </button>
            )}

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

          <SummaryField label="Cadre (Band)" value={details.cadreBand} />

          <SummaryField label="Base Location" value={details.baseLocation} />

          <SummaryField
            label="Travel Location"
            value={details.travelLocation}
          />

          <SummaryField label="Transport" value={details.transportMode} />

          <SummaryField
            label="Distance"
            value={details.distanceKm ? `${details.distanceKm} km` : "—"}
          />

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
