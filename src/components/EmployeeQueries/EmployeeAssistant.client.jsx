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
import { PiClockCounterClockwise } from "react-icons/pi";
import { PiBell } from "react-icons/pi";
import { IoMdMore } from "react-icons/io";

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

function getRequestTitle(type) {
  const found = REQUEST_TYPES.find((item) => item.key === type);
  return found?.title || "Employee Services";
}

function getNotificationTone(notification) {
  const requestType =
    notification?.request_type ||
    normalizeDetails(notification?.metadata)?.requestType ||
    normalizeDetails(notification?.metadata)?.request_type ||
    "OTHER_QUERY";

  return getRequestTone(requestType);
}

function isEmployeeRole(role) {
  return String(role || "").toLowerCase() === "employee";
}

function isAdminRole(role) {
  return String(role || "").toLowerCase() === "admin";
}

function isTravelOperatorRole(role) {
  return ["traveldesk", "finance", "financeteam"].includes(
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
  const [ownRequests, setOwnRequests] = useState([]);
  const [allAssignedRequests, setAllAssignedRequests] = useState([]);
  const [requestFilter, setRequestFilter] = useState("ALL");
  const [requestHistoryTab, setRequestHistoryTab] = useState("assigned");
  const [showRequestHistory, setShowRequestHistory] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [showForm, setShowForm] = useState(null);

  const [showOtherQuery, setShowOtherQuery] = useState(false);

  const [loading, setLoading] = useState(true);

  const [loadingDetail, setLoadingDetail] = useState(false);

  const [actionComment, setActionComment] = useState("");

  const [requestMessage, setRequestMessage] = useState("");

  const [messageAttachment, setMessageAttachment] = useState(null);

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
    ticketAttachment: null,
  });

  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  const [assetAllocation, setAssetAllocation] = useState(null);

  const [socket, setSocket] = useState(null);

  const [otherQueryKey, setOtherQueryKey] = useState(0);

  const socketRef = useRef(null);
  const selectedRequestRef = useRef(null);
  const messageAttachmentInputRef = useRef(null);

  const headers = useMemo(
    () => ({
      "x-api-key": API_KEY,
      ...(employeeId ? { "x-employee-id": employeeId } : {}),
      ...(orgId ? { "x-org-id": orgId } : {}),
    }),
    [API_KEY, employeeId, orgId],
  );

  const [serviceNotifications, setServiceNotifications] = useState([]);
  const [serviceReminders, setServiceReminders] = useState([]);

  const [serviceCounts, setServiceCounts] = useState({
    notifications: 0,
    reminders: 0,
  });

  const [serviceOverview, setServiceOverview] = useState(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [showOverview, setShowOverview] = useState(false);

  const isEmployee = isEmployeeRole(userRole);

  const isAdmin = isAdminRole(userRole);
  const isTravelOperator = isTravelOperatorRole(userRole);

  const fetchServiceHeaderData = useCallback(async () => {
    if (!employeeId || !orgId || !BACKEND_URL) {
      return;
    }

    try {
      const [
        notificationsResponse,
        remindersResponse,
        countsResponse,
        overviewResponse,
      ] = await Promise.all([
        axios.get(`${BACKEND_URL}/requests/service-notifications`, {
          headers,
          withCredentials: true,
        }),

        axios.get(`${BACKEND_URL}/requests/service-reminders`, {
          headers,
          withCredentials: true,
        }),

        axios.get(`${BACKEND_URL}/requests/service-notifications/counts`, {
          headers,
          withCredentials: true,
        }),

        axios.get(`${BACKEND_URL}/requests/service-overview`, {
          headers,
          withCredentials: true,
        }),
      ]);

      const notificationList = notificationsResponse.data?.data || [];

      setServiceNotifications(
        Array.isArray(notificationList)
          ? notificationList.filter(
              (notification) => !Number(notification.is_read),
            )
          : [],
      );

      setServiceReminders(remindersResponse.data?.data || []);

      setServiceCounts(
        countsResponse.data?.data || {
          notifications: 0,
          reminders: 0,
        },
      );

      setServiceOverview(overviewResponse.data?.data || null);
    } catch (error) {
      console.error("[EmployeeAssistant] fetchServiceHeaderData:", error);
    }
  }, [BACKEND_URL, employeeId, orgId, headers]);

  const markAllServiceNotificationsRead = useCallback(async () => {
    try {
      await axios.patch(
        `${BACKEND_URL}/requests/service-notifications/read-all`,
        {},
        {
          headers,
          withCredentials: true,
        },
      );

      /*
       * Remove all notifications from the visible panel.
       */
      setServiceNotifications([]);

      /*
       * Clear the unread badge.
       */
      setServiceCounts((previous) => ({
        ...previous,
        notifications: 0,
      }));
    } catch (error) {
      console.error(
        "[EmployeeAssistant] markAllServiceNotificationsRead:",
        error,
      );
    }
  }, [BACKEND_URL, headers]);

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

  const fetchOwnRequests = useCallback(async () => {
    if (!employeeId || !orgId || !BACKEND_URL) return;

    try {
      setLoading(true);

      const response = await axios.get(`${BACKEND_URL}/requests/mine`, {
        headers,
        withCredentials: true,
      });

      const list = response.data?.data || [];

      setOwnRequests(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("[EmployeeAssistant] fetchOwnRequests:", error);

      setOwnRequests([]);
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL, employeeId, orgId, headers]);

  const fetchAllAssignedRequests = useCallback(async () => {
    if (!employeeId || !orgId || !BACKEND_URL) return;

    try {
      setLoading(true);

      const response = await axios.get(
        `${BACKEND_URL}/requests/assigned-history`,
        {
          headers,
          withCredentials: true,
        },
      );

      const list = response.data?.data || [];

      setAllAssignedRequests(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("[EmployeeAssistant] fetchAllAssignedRequests:", error);

      setAllAssignedRequests([]);
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL, employeeId, orgId, headers]);

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

  const handleServiceNotificationClick = useCallback(
    async (notification) => {
      try {
        if (!notification?.id) return;

        /*
         * Mark the notification as read on the server.
         */
        if (!Number(notification.is_read)) {
          await axios.patch(
            `${BACKEND_URL}/requests/service-notifications/${notification.id}/read`,
            {},
            {
              headers,
              withCredentials: true,
            },
          );
        }

        /*
         * Immediately remove it from the visible notification panel.
         */
        setServiceNotifications((previous) =>
          previous.filter(
            (item) => String(item.id) !== String(notification.id),
          ),
        );

        /*
         * Update the unread badge.
         */
        setServiceCounts((previous) => ({
          ...previous,
          notifications: notification.is_read
            ? previous.notifications
            : Math.max(0, previous.notifications - 1),
        }));

        /*
         * Close the notification panel.
         */
        setShowNotifications(false);

        /*
         * Open the associated request.
         */
        if (notification.request_id) {
          await loadRequest(notification.request_id);
        }
      } catch (error) {
        console.error(
          "[EmployeeAssistant] handleServiceNotificationClick:",
          error,
        );
      }
    },
    [BACKEND_URL, headers, loadRequest],
  );

  useEffect(() => {
    fetchRequests();
    fetchServiceHeaderData();
  }, [fetchRequests, fetchServiceHeaderData]);

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
      await Promise.all([fetchRequests(), fetchServiceHeaderData()]);

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
  }, [
    API_KEY,
    BACKEND_URL,
    employeeId,
    orgId,
    fetchRequests,
    fetchServiceHeaderData,
    loadRequest,
  ]);

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
      ticketAttachment: null,
    });
  };

  const submitRequest = async ({ requestType, title, details, file }) => {
    if (!employeeId || !orgId) {
      throw new Error("Employee or organization information is missing.");
    }

    const payload = new FormData();
    payload.append("requestType", requestType);
    payload.append("title", title);
    payload.append("details", JSON.stringify(details));
    if (file) payload.append("attachment", file);

    const response = await axios.post(`${BACKEND_URL}/requests`, payload, {
      headers,
      withCredentials: true,
    });

    const created = response.data?.data;

    await fetchRequests();

    if (!isEmployee) {
      await fetchOwnRequests();
    }

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

    // A new file OR an already-saved draft attachment is acceptable.
    if (!bookingForm.ticket && !bookingForm.ticketAttachment?.id) {
      showAlert("Please upload the e-ticket PDF.");
      return;
    }

    try {
      setBookingSubmitting(true);

      const formData = new FormData();

      formData.append("transportType", bookingForm.airline || "");
      formData.append("pnr", bookingForm.pnr || "");
      formData.append("departureTime", bookingForm.departureTime || "");
      formData.append("returnTime", bookingForm.returnTime || "");
      formData.append("message", bookingForm.message || "");

      // Only send a file when the user selected a new file.
      //
      // If no new file was selected, the backend will reuse the
      // already-saved E-Ticket attachment from the draft.
      if (bookingForm.ticket) {
        formData.append("e_ticket", bookingForm.ticket);
      }

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

  const saveTravelBookingDraft = async () => {
    if (!selectedRequest) return;

    try {
      const formData = new FormData();

      formData.append("transportType", bookingForm.airline || "");

      formData.append("pnr", bookingForm.pnr || "");

      formData.append("departureTime", bookingForm.departureTime || "");

      formData.append("returnTime", bookingForm.returnTime || "");

      formData.append("message", bookingForm.message || "");

      if (bookingForm.ticket) {
        formData.append("e_ticket", bookingForm.ticket);
      }

      const response = await axios.post(
        `${BACKEND_URL}/requests/${selectedRequest.id}/book-draft`,
        formData,
        {
          headers: {
            ...headers,
          },
          withCredentials: true,
        },
      );

      const updatedRequest = response.data?.data;

      if (updatedRequest) {
        setSelectedRequest(updatedRequest);
        selectedRequestRef.current = updatedRequest;
      }

      showAlert("Booking draft saved.");
    } catch (error) {
      console.error("[EmployeeAssistant] saveTravelBookingDraft:", error);

      showAlert(error.response?.data?.message || "Unable to save draft.");
    }
  };

  useEffect(() => {
    if (selectedRequest?.request_type !== "TRAVEL_BOOKING") return;

    const details = normalizeDetails(selectedRequest.details_json);

    const savedTicket = Array.isArray(selectedRequest.attachments)
      ? selectedRequest.attachments.find(
          (attachment) => attachment.purpose === "E_TICKET",
        ) || null
      : null;

    setBookingForm((previous) => ({
      ...previous,

      airline: details.transportType || details.airline || "",

      pnr: details.pnr || "",

      departureTime: details.departureTime || "",

      returnTime: details.returnTime || "",

      message: details.bookingMessage || "",

      // Browser security prevents restoring a File object.
      ticket: null,

      // Keep the server-side attachment separately.
      ticketAttachment: savedTicket,
    }));
  }, [
    selectedRequest?.id,
    selectedRequest?.details_json,
    selectedRequest?.attachments,
  ]);

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

  const loadAssetCandidates = async () => {
    if (!selectedRequest) return;

    try {
      setAssetAllocation({ loading: true, data: null });
      const response = await axios.get(
        `${BACKEND_URL}/requests/${selectedRequest.id}/asset-candidates`,
        { headers, withCredentials: true },
      );
      setAssetAllocation({ loading: false, data: response.data?.data || {} });
    } catch (error) {
      console.error("[EmployeeAssistant] loadAssetCandidates:", error);
      setAssetAllocation(null);
      showAlert(
        error.response?.data?.message || "Unable to find available assets.",
      );
    }
  };

  const processAssetRequest = async (processing) => {
    if (!selectedRequest) return;

    try {
      await axios.post(
        `${BACKEND_URL}/requests/${selectedRequest.id}/asset-process`,
        processing,
        { headers, withCredentials: true },
      );
      await fetchRequests();
      await loadRequest(selectedRequest.id);
      setAssetAllocation(null);
      showAlert(
        processing?.offline
          ? "Asset request marked for offline handling."
          : "Existing asset assigned to the requesting employee.",
      );
    } catch (error) {
      console.error("[EmployeeAssistant] processAssetRequest:", error);
      showAlert(error.response?.data?.message || "Unable to assign the asset.");
    }
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

    if (!requestMessage.trim() && !messageAttachment) {
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

      if (messageAttachment) {
        const formData = new FormData();

        formData.append("attachment", messageAttachment);

        formData.append("thread_id", String(selectedRequest.thread_id));

        formData.append("sender_id", String(employeeId));

        formData.append("sender_role", String(userRole || ""));

        formData.append("recipient_id", String(recipientId));

        formData.append("sender_name", String(employeeName || ""));

        if (requestMessage?.trim()) {
          formData.append("message", requestMessage.trim());
        }

        const multipartHeaders = {
          ...headers,
          "Content-Type": "multipart/form-data",
        };

        const response = await axios.post(
          `${BACKEND_URL}/threads/${selectedRequest.thread_id}/messages`,
          formData,
          {
            withCredentials: true,
            headers: multipartHeaders,
          },
        );

        console.log(
          "[sendRequestMessage] Attachment upload response:",
          response.data,
        );
      } else if (socketRef.current?.connected) {
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
      setMessageAttachment(null);
      if (messageAttachmentInputRef.current) {
        messageAttachmentInputRef.current.value = "";
      }

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
          requests={
            isEmployee || requestHistoryTab === "assigned"
              ? requests
              : requestHistoryTab === "mine"
                ? ownRequests
                : allAssignedRequests
          }
          requestFilter={requestFilter}
          setRequestFilter={setRequestFilter}
          loading={loading}
          isEmployee={isEmployee}
          showTabs={!isEmployee}
          activeTab={requestHistoryTab}
          onTabChange={(tab) => {
            setRequestHistoryTab(tab);
            setRequestFilter("ALL");

            if (tab === "mine") {
              fetchOwnRequests();
            } else if (tab === "all") {
              fetchAllAssignedRequests();
            }
          }}
          loadRequest={loadRequest}
        />
      </div>
    );
  }

  function ServiceNotificationPanel({
    notifications,
    unreadCount,
    onClose,
    onNotificationClick,
    onMarkAllRead,
  }) {
    return (
      <>
        <button
          type="button"
          className="service-notification-backdrop"
          aria-label="Close notifications"
          onClick={onClose}
        />

        <aside
          className="service-notification-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Employee Services notifications"
        >
          <div className="service-notification-panel-header">
            <div>
              <span className="service-panel-eyebrow">Employee Services</span>

              <h2>Notifications</h2>

              <p>
                {unreadCount > 0
                  ? `${unreadCount} unread notification${
                      unreadCount === 1 ? "" : "s"
                    }`
                  : "You're all caught up"}
              </p>
            </div>

            <button
              type="button"
              className="service-panel-close"
              onClick={onClose}
              aria-label="Close notifications"
              title="Close"
            >
              <FiX />
            </button>
          </div>

          {unreadCount > 0 && (
            <div className="service-notification-toolbar">
              <span>Recent updates</span>

              <button
                type="button"
                onClick={onMarkAllRead}
                className="service-mark-all-button"
              >
                Mark all as read
              </button>
            </div>
          )}

          <div className="service-notification-list">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const tone = getNotificationTone(notification);

                const requestType =
                  notification.request_type ||
                  normalizeDetails(notification.metadata)?.requestType ||
                  normalizeDetails(notification.metadata)?.request_type ||
                  "OTHER_QUERY";

                const Icon = getRequestIcon(requestType);

                const requestTypeTitle = getRequestTitle(requestType);

                return (
                  <button
                    type="button"
                    key={notification.id}
                    className={`service-notification-item ${tone} ${
                      notification.is_read ? "read" : "unread"
                    }`}
                    onClick={() => onNotificationClick(notification)}
                  >
                    <div className="service-notification-accent">
                      <div className="service-notification-icon">
                        <Icon />
                      </div>
                    </div>

                    <div className="service-notification-content">
                      <div className="service-notification-topline">
                        <span className="service-notification-type">
                          {requestTypeTitle}
                        </span>

                        {!notification.is_read && (
                          <span className="service-notification-dot" />
                        )}
                      </div>

                      <strong>{notification.title}</strong>

                      <p>{notification.message}</p>

                      <div className="service-notification-meta">
                        {notification.request_code && (
                          <span>{notification.request_code}</span>
                        )}

                        <span>{formatDate(notification.created_at)}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="service-notification-empty">
                <div className="service-notification-empty-icon">
                  <PiBell />
                </div>

                <h3>No notifications</h3>

                <p>
                  Updates about your Employee Services requests will appear
                  here.
                </p>
              </div>
            )}
          </div>
        </aside>
      </>
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
        <div className="assistant-actions">
          <button
            type="button"
            className="assistant-action-button"
            aria-label="Reminders"
            title="Reminders"
            onClick={() => {
              setShowReminders(true);
              setShowNotifications(false);
              setShowOverview(false);
            }}
          >
            <PiClockCounterClockwise />

            {serviceCounts.reminders > 0 && (
              <span className="assistant-action-badge reminder-badge">
                {serviceCounts.reminders > 99 ? "99+" : serviceCounts.reminders}
              </span>
            )}
          </button>

          <button
            type="button"
            className="assistant-action-button notification-action"
            aria-label="Notifications"
            title="Notifications"
            onClick={() => {
              setShowNotifications(true);
              setShowReminders(false);
              setShowOverview(false);
            }}
          >
            <PiBell />

            {serviceCounts.notifications > 0 && (
              <span className="assistant-action-badge notification-badge">
                {serviceCounts.notifications > 99
                  ? "99+"
                  : serviceCounts.notifications}
              </span>
            )}
          </button>

          <button
            type="button"
            className="assistant-action-button more-action"
            aria-label="Request overview"
            title="Request overview"
            onClick={() => {
              setShowOverview(true);
              setShowNotifications(false);
              setShowReminders(false);
            }}
          >
            <IoMdMore />
          </button>
        </div>
      </header>

      {showNotifications && (
        <ServiceNotificationPanel
          notifications={serviceNotifications}
          unreadCount={serviceCounts.notifications}
          onClose={() => setShowNotifications(false)}
          onNotificationClick={handleServiceNotificationClick}
          onMarkAllRead={markAllServiceNotificationsRead}
        />
      )}

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
                    disabled={item.key === "SALARY_ADVANCE"}
                    className={`assistant-category-card ${item.tone} ${
                      item.key === "SALARY_ADVANCE"
                        ? "temporarily-unavailable"
                        : ""
                    }`}
                    onClick={() => {
                      if (item.key === "SALARY_ADVANCE") {
                        return;
                      }

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

                    {item.key === "SALARY_ADVANCE" && (
                      <span className="category-unavailable-badge">
                        Temporarily unavailable
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                className="assistant-category-card history-card"
                onClick={() => {
                  setRequestHistoryTab(isEmployee ? "mine" : "assigned");
                  setShowRequestHistory(true);
                }}
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
            saveTravelBookingDraft={saveTravelBookingDraft}
            submitTravelBooking={submitTravelBooking}
            completeTrip={completeTrip}
            cancelRequest={cancelRequest}
            processAssetRequest={processAssetRequest}
            assetAllocation={assetAllocation}
            loadAssetCandidates={loadAssetCandidates}
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
              <button
                type="button"
                aria-label="Attach a file"
                title="Attach a file"
                onClick={() => messageAttachmentInputRef.current?.click()}
                disabled={sendingMessage}
                className="eq-icon"
              >
                <FiPaperclip />
              </button>
              <input
                ref={messageAttachmentInputRef}
                type="file"
                hidden
                onChange={(event) =>
                  setMessageAttachment(event.target.files?.[0] || null)
                }
              />
              {messageAttachment && (
                <span className="assistant-attachment-name">
                  {messageAttachment.name}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            className="assistant-send"
            onClick={sendRequestMessage}
            disabled={
              sendingMessage || (!requestMessage.trim() && !messageAttachment)
            }
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
          orgPrefix={user?.orgPrefix}
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
  showTabs,
  activeTab,
  onTabChange,
  loadRequest,
}) {
  const isMineTab = isEmployee || activeTab === "mine";
  const isAllTab = activeTab === "all";

  return (
    <main className="assistant-history-body">
      {showTabs && (
        <div
          className="request-history-tabs"
          role="tablist"
          aria-label="Request views"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "assigned"}
            className={activeTab === "assigned" ? "active" : ""}
            onClick={() => onTabChange("assigned")}
          >
            Assigned Requests
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "mine"}
            className={activeTab === "mine" ? "active" : ""}
            onClick={() => onTabChange("mine")}
          >
            My Requests
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "all"}
            className={activeTab === "all" ? "active" : ""}
            onClick={() => onTabChange("all")}
          >
            All Requests
          </button>
        </div>
      )}

      <div className="assistant-history-heading">
        <div>
          <span className="assistant-section-eyebrow">Request workspace</span>
          <h1>
            {isMineTab
              ? "My Requests"
              : isAllTab
                ? "All Requests"
                : "Assigned Requests"}
          </h1>
          <p>
            {isMineTab
              ? "Track requests you have submitted."
              : isAllTab
                ? "Track requests you have handled, including completed and rejected requests."
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
            {isMineTab
              ? "You have not raised any requests yet"
              : isAllTab
                ? "No request history is available"
                : "No requests are waiting for you"}
          </h3>
          <p>
            {isMineTab
              ? "Your submitted requests will appear here."
              : isAllTab
                ? "Requests you handle will appear here."
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
  saveTravelBookingDraft,
  submitTravelBooking,
  completeTrip,
  cancelRequest,
  processAssetRequest,
  assetAllocation,
  loadAssetCandidates,
  onBack,
}) {
  const details = normalizeDetails(request?.details_json);
  const [offlineAssetNote, setOfflineAssetNote] = useState("");

  const isRequester = String(request.employee_id) === String(employeeId);

  const isCurrentAssignee =
    String(request.current_assignee_id) === String(employeeId);

  const canApprove =
    isCurrentAssignee &&
    (request.current_status === "PENDING_APPROVAL" ||
      (isAdmin &&
        request.current_status === "PENDING_ADMIN_ACTION" &&
        !["TRAVEL_BOOKING", "ASSET_REQUEST"].includes(request.request_type)));

  const approvalHeading =
    isAdmin && request.current_status === "PENDING_ADMIN_ACTION"
      ? "Admin Approval"
      : "Supervisor Approval";

  const canBookTravel =
    (isAdmin || isTravelOperator) &&
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
                    <span>{approvalHeading}</span>

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
                    <label>Transport Type</label>

                    <input
                      value={bookingForm.airline}
                      onChange={(e) =>
                        setBookingForm((prev) => ({
                          ...prev,
                          airline: e.target.value,
                        }))
                      }
                      placeholder="Train"
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
                          : bookingForm.ticketAttachment?.fileName
                            ? `Saved: ${bookingForm.ticketAttachment.fileName}`
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

                    {bookingForm.ticketAttachment && !bookingForm.ticket && (
                      <div className="saved-ticket-info">
                        <FiFileText />

                        <span>
                          Previously uploaded:
                          <strong>
                            {bookingForm.ticketAttachment.fileName}
                          </strong>
                        </span>
                      </div>
                    )}
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
                    onClick={saveTravelBookingDraft}
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
              !["TRAVEL_BOOKING", "ASSET_REQUEST"].includes(
                request.request_type,
              ) && (
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

            {isAdmin &&
              isCurrentAssignee &&
              request.current_status === "PENDING_ADMIN_ACTION" &&
              request.request_type === "ASSET_REQUEST" && (
                <div className="workflow-action-card asset-action">
                  <div className="workflow-action-heading">
                    <div>
                      <span>Asset Allocation</span>
                      <h3>Assign an existing registered asset.</h3>
                    </div>
                    <span className="action-pill info">Action Required</span>
                  </div>

                  {!assetAllocation && (
                    <button
                      type="button"
                      className="upload-notify-button"
                      onClick={loadAssetCandidates}
                    >
                      Find Available Assets
                    </button>
                  )}

                  {assetAllocation?.loading && <p>Finding available assets…</p>}

                  {assetAllocation?.data && (
                    <div className="asset-allocation-options">
                      <p>
                        Requested:{" "}
                        <strong>{details.itemName || "Asset"}</strong>
                        {details.configuration
                          ? ` — ${details.configuration}`
                          : ""}
                      </p>

                      <AssetCandidateList
                        title={`Available ${details.category || "assets"}`}
                        assets={assetAllocation.data.assets || []}
                        onAssign={(assetId) => processAssetRequest({ assetId })}
                        emptyMessage="No unassigned assets are currently available in this category."
                      />

                      <div className="assistant-field full">
                        <label>Handle offline instead</label>
                        <input
                          value={offlineAssetNote}
                          onChange={(event) =>
                            setOfflineAssetNote(event.target.value)
                          }
                          placeholder="Optional handover or procurement reference"
                        />
                        <button
                          type="button"
                          className="save-draft-button"
                          onClick={() =>
                            processAssetRequest({
                              offline: true,
                              note: offlineAssetNote,
                            })
                          }
                        >
                          Mark for Offline Handling
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* Booking details */}

            {request.current_status === "BOOKED" &&
              request.request_type === "TRAVEL_BOOKING" && (
                <BookingDetails
                  details={details}
                  request={request}
                  employeeId={employeeId}
                />
              )}

            <RequestAttachments request={request} employeeId={employeeId} />

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
                  <strong>
                    {request.request_type === "TRAVEL_BOOKING"
                      ? "Trip Completed"
                      : "Request Completed"}
                  </strong>

                  <p>
                    {request.request_type === "TRAVEL_BOOKING"
                      ? "We hope you had a productive trip."
                      : "This request has been completed successfully."}
                  </p>
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
            orgId={request.org_id}
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

          <SummaryField label="Project" value={details.project} />

          <SummaryField
            label="Government ID (Aadhar)"
            value={details.governmentId}
          />

          <SummaryField label="Mobile Number" value={details.mobileNumber} />

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
            label="Accommodation"
            value={details.accommodationRequired ? "Required" : "Not required"}
          />

          {details.accommodationRequired && (
            <>
              <SummaryField
                label="Accommodation Place"
                value={details.accommodationPlace}
              />

              <SummaryField
                label="Accommodation From"
                value={formatShortDate(details.accommodationFrom)}
              />

              <SummaryField
                label="Accommodation To"
                value={formatShortDate(details.accommodationTo)}
              />

              <SummaryField
                label="Number of Nights"
                value={details.accommodationNights}
              />

              <SummaryField
                label="Occupancy Count"
                value={details.occupancyCount}
              />
            </>
          )}

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

function BookingDetails({ details, request, employeeId }) {
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

        <SummaryField
          label="Transport Type"
          value={details.transportType || details.airline}
        />

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

              const orgId = request.org_id;

              const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

              const url = `${base}/requests/${request.id}/attachments/${details.eTicketAttachmentId}`;

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

function RequestAttachments({ request, employeeId }) {
  const attachments = (request.attachments || []).filter(
    (attachment) => attachment.purpose !== "E_TICKET",
  );
  if (!attachments.length) return null;

  const download = async (attachment) => {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL || "";
    const response = await fetch(
      `${base}/requests/${request.id}/attachments/${attachment.id}`,
      {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          "x-employee-id": employeeId,
          "x-org-id": request.org_id,
        },
        credentials: "include",
      },
    );
    if (!response.ok) throw new Error("Attachment download failed.");
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = attachment.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="booking-details-card">
      <div className="summary-heading">
        <h3>Attachments</h3>
      </div>
      {attachments.map((attachment) => (
        <button
          key={attachment.id}
          type="button"
          className="ticket-download"
          onClick={() => download(attachment).catch(console.error)}
        >
          <FiPaperclip /> {attachment.fileName}
          <span>Download</span>
        </button>
      ))}
    </div>
  );
}

function AssetCandidateList({ title, assets, onAssign, emptyMessage }) {
  return (
    <div className="asset-candidate-list">
      <strong>{title}</strong>
      {assets.length ? (
        assets.map((asset) => (
          <div className="asset-candidate-row" key={asset.asset_id}>
            <div>
              <strong>{asset.asset_name || asset.asset_id}</strong>
              <span>
                {[
                  asset.asset_code,
                  asset.configuration,
                  asset.category,
                  asset.sub_category,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
            <button
              type="button"
              className="upload-notify-button"
              onClick={() => onAssign(asset.asset_id)}
            >
              Assign
            </button>
          </div>
        ))
      ) : (
        <p>{emptyMessage || "No assets available."}</p>
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

function getFilenameFromContentDisposition(value) {
  if (!value) return null;

  const utfMatch = value.match(/filename\*=UTF-8''([^;]+)/i);

  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1]);
    } catch {
      return utfMatch[1];
    }
  }

  const normalMatch = value.match(/filename="?([^"]+)"?/i);

  return normalMatch?.[1] || null;
}

function getExtensionFromMimeType(mimeType) {
  const mime = String(mimeType || "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  const map = {
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      ".xlsx",
    "application/vnd.ms-powerpoint": ".ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      ".pptx",
    "text/plain": ".txt",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "application/zip": ".zip",
  };

  return map[mime] || "";
}

function RequestMessages({ messages, employeeId, orgId }) {
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
                <button
                  type="button"
                  className="thread-attachment"
                  onClick={async () => {
                    try {
                      const rawUrl = String(message.attachment_url || "");

                      const rawFilename =
                        rawUrl.split("?")[0].split("/").pop() || "";

                      const filename = decodeURIComponent(rawFilename);

                      if (!filename) {
                        throw new Error("Attachment filename is missing.");
                      }

                      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/empquery/attachments/${encodeURIComponent(
                        filename,
                      )}`;

                      const response = await axios.get(url, {
                        withCredentials: true,
                        responseType: "blob",
                        headers: {
                          "x-api-key": process.env.NEXT_PUBLIC_API_KEY,

                          "x-employee-id": employeeId,

                          "x-org-id": orgId,
                        },
                      });

                      const blob = response.data;

                      if (!blob || blob.size === 0) {
                        throw new Error("Downloaded attachment is empty.");
                      }

                      const objectUrl = window.URL.createObjectURL(blob);

                      const link = document.createElement("a");

                      link.href = objectUrl;
                      link.download = filename;

                      document.body.appendChild(link);

                      link.click();

                      link.remove();

                      setTimeout(() => {
                        window.URL.revokeObjectURL(objectUrl);
                      }, 1000);
                    } catch (error) {
                      console.error(
                        "[RequestMessages] Attachment download failed:",
                        error,
                      );

                      alert("Unable to download the attachment.");
                    }
                  }}
                >
                  <FiPaperclip />
                  {message.file_name || message.attachment_name || "Attachment"}
                </button>
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
