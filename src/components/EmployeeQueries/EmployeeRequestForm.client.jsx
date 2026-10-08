"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Modal from "../Modal/Modal.client";

import {
  FiCalendar,
  FiFileText,
  FiMapPin,
  FiMonitor,
  FiPaperclip,
  FiPlus,
  FiUser,
  FiX,
} from "react-icons/fi";
import { MdOutlineCurrencyRupee } from "react-icons/md";

const TRANSPORT_OPTIONS = {
  LOWER: ["Bus", "Train"],
  UPPER: ["Airbus", "Train", "Bus"],
};

const currentMonthKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const currentDateKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
};

const recoveryMonthOptions = Array.from({ length: 2 }, (_, index) => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + index);

  return {
    value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    label: date.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    }),
  };
});

const EmployeeRequestForm = ({
  type,
  userRole,
  employeeId,
  orgId,
  orgPrefix,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    from: "",
    to: "",
    travelDate: "",
    returnDate: "",
    project: "",
    governmentId: "",
    mobileNumber: "",
    baseLocation: "",
    travelLocation: "",
    transportMode: "",
    distanceKm: "",
    tripType: "",
    purpose: "",
    recoveryStartMonth: currentMonthKey(),
    additionalInfo: "",
    travelers: [""],
    accommodationRequired: false,
    accommodationPlace: "",
    otherAccommodationPlace: "",
    accommodationFrom: "",
    accommodationTo: "",
    accommodationNights: "",
    occupancyCount: "1",

    amount: "",
    payoutDate: "",
    payoutMode: "",
    advanceReason: "",
    repaymentMonths: "",
    existingAdvance: "",
    bankAccount: "",

    documentType: "",
    documentPurpose: "",
    documentAdditionalInfo: "",

    assetCategory: "",
    assetSubCategory: "",
    itemName: "",
    configuration: "",
    assetReason: "",
    assetAdditionalInfo: "",
    requiredDate: "",
    location: "",
    urgency: "",
  });

  const [file, setFile] = useState(null);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [travelContext, setTravelContext] = useState({ cadreBand: "LOWER" });
  const [guestHouses, setGuestHouses] = useState([]);
  const [salaryContext, setSalaryContext] = useState({
    baseNetSalary: 0,
    maximumAdvance: 0,
    outstandingAdvance: 0,
    paidAdvance: 0,
    remainingAdvance: 0,
  });
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
    buttons: [],
  });

  const getMinimumRecoveryMonths = () => {
    const requestedAmount = Number(form.amount);
    const baseNetSalary = Number(salaryContext.baseNetSalary);

    if (
      !Number.isFinite(requestedAmount) ||
      requestedAmount <= 0 ||
      !Number.isFinite(baseNetSalary) ||
      baseNetSalary <= 0
    ) {
      return 1;
    }
    return Math.max(1, Math.ceil(requestedAmount / baseNetSalary));
  };

  const getMonthlyRecoveryAmount = () => {
    const requestedAmount = Number(form.amount);
    const repaymentMonths = Number(form.repaymentMonths);

    if (
      !Number.isFinite(requestedAmount) ||
      requestedAmount <= 0 ||
      !Number.isFinite(repaymentMonths) ||
      repaymentMonths <= 0
    ) {
      return 0;
    }

    return requestedAmount / repaymentMonths;
  };

  useEffect(() => {
    if (type !== "TRAVEL_BOOKING" || !employeeId || !orgId) return;

    axios
      .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/requests/travel-context`, {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          "x-org-id": orgId,
          "x-employee-id": employeeId,
        },
        withCredentials: true,
      })
      .then((response) => {
        const context = response.data?.data || {};
        setTravelContext(context);
        setForm((previous) => ({
          ...previous,
          governmentId: context.governmentId || "",
          mobileNumber: context.mobileNumber || "",
        }));
      })
      .catch(() => undefined);
  }, [employeeId, orgId, type]);

  useEffect(() => {
    if (type !== "TRAVEL_BOOKING" || !orgId) return;

    axios
      .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/projectdrop`, {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          "x-org-id": orgId,
          "x-employee-id": employeeId,
        },
        withCredentials: true,
      })
      .then((response) => {
        const raw = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        setProjects(
          raw
            .map((item) =>
              typeof item === "string"
                ? item
                : item?.project || item?.project_name || item?.name || "",
            )
            .filter(Boolean),
        );
      })
      .catch(() => setProjects([]));
  }, [employeeId, orgId, type]);

  useEffect(() => {
    if (
      type !== "TRAVEL_BOOKING" ||
      !form.accommodationFrom ||
      !form.accommodationTo
    ) {
      return;
    }

    const from = new Date(form.accommodationFrom);
    const to = new Date(form.accommodationTo);
    const nights = Math.max(
      0,
      Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)),
    );

    update("accommodationNights", String(nights));
  }, [form.accommodationFrom, form.accommodationTo, type]);

  useEffect(() => {
    if (type !== "TRAVEL_BOOKING") return;

    const travelerCount = form.travelers.filter((traveler) =>
      traveler.trim(),
    ).length;

    setForm((previous) => ({
      ...previous,
      occupancyCount: String(1 + travelerCount),
    }));
  }, [form.travelers, type]);

  useEffect(() => {
    if (type !== "TRAVEL_BOOKING" || !employeeId) return;
    axios
      .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/employees`, {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          "x-org-id": orgId,
          "x-employee-id": employeeId,
        },
        withCredentials: true,
      })
      .then((response) => {
        const employeeList = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        setEmployees(
          employeeList
            .map((employee) => ({
              employeeId: employee.employee_id || employee.id,
              name:
                employee.name ||
                [employee.first_name, employee.middle_name, employee.last_name]
                  .filter(Boolean)
                  .join(" "),
            }))
            .filter((employee) => employee.employeeId),
        );
      })
      .catch(() => setEmployees([]));
  }, [employeeId, orgId, type]);

  useEffect(() => {
    if (type !== "TRAVEL_BOOKING" || !orgId) return;

    axios
      .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/guest-houses`, {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          "x-org-id": orgId,
        },
        withCredentials: true,
      })
      .then((response) => {
        const list = Array.isArray(response.data?.data)
          ? response.data.data
          : [];
        setGuestHouses(list);
      })
      .catch(() => setGuestHouses([]));
  }, [orgId, type]);

  useEffect(() => {
    if (type !== "SALARY_ADVANCE" || !employeeId || !orgId) return;

    axios
      .get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/requests/salary-advance-context`,
        {
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
            "x-org-id": orgId,
            "x-employee-id": employeeId,
          },
          withCredentials: true,
        },
      )
      .then((response) => {
        setSalaryContext(response.data?.data || {});
      })
      .catch(() =>
        setSalaryContext({
          baseNetSalary: 0,
          maximumAdvance: 0,
          outstandingAdvance: 0,
          paidAdvance: 0,
          remainingAdvance: 0,
        }),
      );
  }, [employeeId, orgId, type]);

  const update = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const addTraveler = () => {
    setForm((prev) => ({
      ...prev,
      travelers: [...prev.travelers, ""],
    }));
  };

  const removeTraveler = (index) => {
    setForm((prev) => ({
      ...prev,
      travelers: prev.travelers.filter((_, i) => i !== index),
    }));
  };

  const updateTraveler = (index, value) => {
    setForm((prev) => ({
      ...prev,
      travelers: prev.travelers.map((name, i) => (i === index ? value : name)),
    }));
  };

  const config = useMemo(() => {
    const configs = {
      TRAVEL_BOOKING: {
        icon: FiMapPin,
        title: "Travel Ticket Request",
        subtitle:
          "Please provide your travel details and we'll take care of the rest.",
        button: "Submit Request",
        tone: "purple",
      },

      SALARY_ADVANCE: {
        icon: MdOutlineCurrencyRupee,
        title: "Salary Advance Request",
        subtitle: "Fill in the details below to request salary advance.",
        button: "Submit Request",
        tone: "green",
      },

      SUPPORTING_DOCUMENT: {
        icon: FiFileText,
        title: "Supporting Documents Request",
        subtitle: "Fill in the details below.",
        button: "Submit Request",
        tone: "orange",
      },

      ASSET_REQUEST: {
        icon: FiMonitor,
        title: "Request for Laptop / Device / Software",
        subtitle: "Fill in the details below.",
        button: "Submit Request",
        tone: "blue",
      },
    };

    return configs[type] || configs.TRAVEL_BOOKING;
  }, [type]);

  const validate = () => {
    const nextErrors = {};
    if (type === "TRAVEL_BOOKING") {
      if (!form.from) nextErrors.from = "Departure is required";
      if (!form.to) nextErrors.to = "Destination is required";
      if (!form.travelDate) nextErrors.travelDate = "Travel date is required";
      const today = currentDateKey();

      if (form.travelDate && form.travelDate < today) {
        nextErrors.travelDate = "Travel date cannot be in the past.";
      }

      if (
        form.returnDate &&
        form.travelDate &&
        form.returnDate < form.travelDate
      ) {
        nextErrors.returnDate = "Return date cannot be before the travel date.";
      }
      if (!form.project) nextErrors.project = "Project is required";
      if (!form.baseLocation.trim())
        nextErrors.baseLocation = "Pickup Point is required";
      if (!form.travelLocation.trim())
        nextErrors.travelLocation = "Drop Point is required";
      if (!form.transportMode)
        nextErrors.transportMode = "Select a mode of transport";
      if (!form.distanceKm || Number(form.distanceKm) < 0)
        nextErrors.distanceKm = "Enter a valid travel distance";
      if (!form.tripType) nextErrors.tripType = "Trip type is required";
      if (!form.purpose) nextErrors.purpose = "Purpose is required";
      if (
        form.accommodationRequired &&
        (!form.accommodationPlace ||
          (form.accommodationPlace === "Other" &&
            !form.otherAccommodationPlace.trim()))
      )
        nextErrors.accommodationPlace = "Select a guest house";
    }
    if (type === "SALARY_ADVANCE") {
      const amount = Number(form.amount);

      if (!form.amount || !Number.isFinite(amount) || amount <= 0) {
        nextErrors.amount = "Enter a valid amount";
      }

      if (
        !Number.isFinite(Number(salaryContext.maximumAdvance)) ||
        Number(salaryContext.maximumAdvance) <= 0
      ) {
        nextErrors.amount =
          "Unable to determine your salary advance limit. Please refresh and try again.";
      }

      const minimumRecoveryMonths = getMinimumRecoveryMonths();
      const repaymentMonths = Number(form.repaymentMonths);

      if (
        !form.repaymentMonths ||
        !Number.isInteger(repaymentMonths) ||
        repaymentMonths < minimumRecoveryMonths
      ) {
        nextErrors.repaymentMonths = `Recovery must be at least ${minimumRecoveryMonths} months for the requested amount.`;
      }

      if (!form.recoveryStartMonth) {
        nextErrors.recoveryStartMonth = "Select a recovery start month";
      }

      const allowedRecoveryMonths = recoveryMonthOptions.map(
        (month) => month.value,
      );

      if (!allowedRecoveryMonths.includes(form.recoveryStartMonth)) {
        nextErrors.recoveryStartMonth =
          "Recovery can start only in the current month or next month.";
      }

      if (!form.payoutDate) {
        nextErrors.payoutDate = "Payout date is required";
      } else if (form.payoutDate < currentDateKey()) {
        nextErrors.payoutDate = "Payout date cannot be in the past.";
      }

      if (!form.payoutMode) {
        nextErrors.payoutMode = "Select a payout mode";
      }

      if (!form.advanceReason) {
        nextErrors.advanceReason = "Select a reason";
      }
    }
    if (type === "SUPPORTING_DOCUMENT") {
      if (!form.documentType)
        nextErrors.documentType = "Select a document type";
      if (!form.documentPurpose)
        nextErrors.documentPurpose = "Select a purpose";
    }
    if (type === "ASSET_REQUEST") {
      if (!form.assetCategory) nextErrors.assetCategory = "Select a category";
      if (!form.assetSubCategory)
        nextErrors.assetSubCategory = "Select a sub-category";
      if (!form.itemName.trim()) nextErrors.itemName = "Item name is required";
      if (!form.assetReason) nextErrors.assetReason = "Select a reason";
      if (!form.requiredDate)
        nextErrors.requiredDate = "Required date is required";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitRequestNormally = async () => {
    setSaving(true);

    try {
      let requestType = "";
      let title = "";
      let details = {};

      if (type === "TRAVEL_BOOKING") {
        requestType = "TRAVEL_BOOKING";
        title = "Travel Ticket Request";

        details = {
          from: form.from,
          to: form.to,
          travelDate: form.travelDate,
          returnDate: form.returnDate,
          project: form.project,
          governmentId: form.governmentId,
          mobileNumber: form.mobileNumber,
          baseLocation: form.baseLocation,
          travelLocation: form.travelLocation,
          transportMode: form.transportMode,
          distanceKm: Number(form.distanceKm),
          beyondEligibility:
            travelContext.cadreBand === "LOWER" &&
            Number(form.distanceKm) > 1000,
          tripType: form.tripType,
          purpose: form.purpose,
          additionalInfo: form.additionalInfo,
          travelers: form.travelers.filter(Boolean),
          accommodationRequired: form.accommodationRequired,
          accommodationPlace:
            form.accommodationPlace === "Other"
              ? form.otherAccommodationPlace
              : form.accommodationPlace,
          accommodationFrom: form.accommodationFrom,
          accommodationTo: form.accommodationTo,
          accommodationNights: Number(form.accommodationNights) || 0,
          occupancyCount: Number(form.occupancyCount) || 1,
        };
      }

      if (type === "SALARY_ADVANCE") {
        const requestedAmount = Number(form.amount);

        requestType = "SALARY_ADVANCE";
        title = "Salary Advance Request";

        details = {
          amount: requestedAmount,
          payoutDate: form.payoutDate,
          payoutMode: form.payoutMode,
          reason: form.advanceReason,
          additionalInfo: form.additionalInfo,
          repaymentMonths: Number(form.repaymentMonths),
          recoveryStartMonth: form.recoveryStartMonth,

          // Informational frontend calculation only.
          // Backend must recalculate this before approval/payroll processing.
          minimumRecoveryMonths: getMinimumRecoveryMonths(),

          estimatedMonthlyRecovery: Number(
            getMonthlyRecoveryAmount().toFixed(2),
          ),
          bankAccount: form.bankAccount,

          /*
           * These are informational snapshots only.
           * The backend MUST recalculate them.
           */
          baseNetSalary: Number(salaryContext.baseNetSalary || 0),

          standardMaximum: Number(salaryContext.maximumAdvance || 0),

          outstandingAdvance: Number(salaryContext.outstandingAdvance || 0),

          paidAdvance: Number(salaryContext.paidAdvance || 0),

          remainingStandardAmount: Number(salaryContext.remainingAdvance || 0),

          excessAmount: Math.max(
            0,
            requestedAmount - Number(salaryContext.remainingAdvance || 0),
          ),

          isException:
            requestedAmount > Number(salaryContext.remainingAdvance || 0),

          limitSource: "calculateBaseNetSalary",
        };
      }

      if (type === "SUPPORTING_DOCUMENT") {
        requestType = "SUPPORTING_DOCUMENT";
        title = "Supporting Documents Request";

        details = {
          documentType: form.documentType,
          purpose: form.documentPurpose,
          additionalInfo: form.documentAdditionalInfo,
        };
      }

      if (type === "ASSET_REQUEST") {
        requestType = "ASSET_REQUEST";
        title = "Request for Laptop / Device / Software";

        details = {
          category: form.assetCategory,
          subCategory: form.assetSubCategory,
          itemName: form.itemName,
          configuration: form.configuration,
          reason: form.assetReason,
          additionalInfo: form.assetAdditionalInfo,
          requiredDate: form.requiredDate,
          location: form.location,
          urgency: form.urgency,
        };
      }

      await onSubmit({
        requestType,
        title,
        details,
        file,
      });

      onClose();
    } catch (error) {
      console.error("Request submit error:", error);

      showAlert(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit request.",
        "Submission failed",
      );
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    if (!validate()) {
      showAlert("Please complete all required fields.", "Validation");
      return;
    }

    if (type !== "SALARY_ADVANCE") {
      await submitRequestNormally();
      return;
    }

    const requestedAmount = Number(form.amount);

    const standardMaximum = Number(salaryContext.maximumAdvance || 0);

    const outstandingAdvance = Number(salaryContext.outstandingAdvance || 0);

    const remainingAdvance = Number(salaryContext.remainingAdvance || 0);

    const excessAmount = Math.max(0, requestedAmount - remainingAdvance);

    if (excessAmount <= 0) {
      await submitRequestNormally();
      return;
    }

    const message =
      remainingAdvance <= 0
        ? [
            "Your standard salary advance maximum has already been fully claimed.",
            "",
            `Standard 3-month maximum: ₹${standardMaximum.toLocaleString(
              "en-IN",
            )}`,
            `Already repaid through payroll: ₹${Number(
              salaryContext.paidAdvance || 0,
            ).toLocaleString("en-IN")}`,
            `Current outstanding advance: ₹${outstandingAdvance.toLocaleString(
              "en-IN",
            )}`,
            "Remaining standard amount: ₹0",
            `New request: ₹${requestedAmount.toLocaleString("en-IN")}`,
            `Exception amount: ₹${excessAmount.toLocaleString("en-IN")}`,
            "",
            "The standard 3-month amount has been fully utilized.",
            "You can still submit this as an exceptional/emergency request.",
            "The request will require final Admin approval.",
            "",
            "Do you want to continue?",
          ].join("\n")
        : [
            `Remaining standard amount: ₹${remainingAdvance.toLocaleString(
              "en-IN",
            )}`,
            `New request: ₹${requestedAmount.toLocaleString("en-IN")}`,
            `Amount above remaining standard amount: ₹${excessAmount.toLocaleString(
              "en-IN",
            )}`,
            "",
            "This request exceeds the employee's remaining standard salary-advance amount.",
            "It can still be submitted as an exceptional/emergency request.",
            "The excess amount will be clearly shown to the approver.",
            "",
            "Do you want to continue?",
          ].join("\n");

    showSalaryAdvanceConfirmation({
      title:
        remainingAdvance <= 0
          ? "Standard amount fully utilized"
          : "Exceptional salary advance",
      message,
      onConfirm: submitRequestNormally,
    });
  };

  const Icon = config.icon;

  const showAlert = (message, title = "Notice") => {
    setAlertModal({
      isVisible: true,
      title,
      message,
      buttons: [
        {
          label: "OK",
          onClick: closeAlert,
        },
      ],
    });
  };

  const showSalaryAdvanceConfirmation = ({ title, message, onConfirm }) => {
    setAlertModal({
      isVisible: true,
      title,
      message,
      buttons: [
        {
          label: "Cancel",
          onClick: closeAlert,
        },
        {
          label: "Continue",
          className: "ac-modal-btn ac-modal-btn-danger",
          onClick: () => {
            closeAlert();
            onConfirm();
          },
        },
      ],
    });
  };

  const closeAlert = () => {
    setAlertModal({
      isVisible: false,
      title: "",
      message: "",
      buttons: [],
    });
  };

  return (
    <div className="request-modal-backdrop">
      <div className={`request-modal ${config.tone}`}>
        <div className="request-modal-header">
          <div className="request-title-icon">
            <Icon />
          </div>

          <div className="request-modal-title">
            <h2>{config.title}</h2>

            <p>{config.subtitle}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="request-close-button"
          >
            <FiX />
          </button>
        </div>

        <div className="request-modal-body">
          {/* =================================================
              TRAVEL
          ================================================= */}

          {type === "TRAVEL_BOOKING" && (
            <div className="request-form-grid">
              <RequestField label="From" required>
                <InputWithIcon
                  icon={<FiMapPin />}
                  value={form.from}
                  onChange={(value) => update("from", value)}
                  placeholder="Select departure city"
                />
              </RequestField>

              <RequestField label="To" required>
                <InputWithIcon
                  icon={<FiMapPin />}
                  value={form.to}
                  onChange={(value) => update("to", value)}
                  placeholder="Select destination city"
                />
              </RequestField>

              <RequestField
                label="Travel Date"
                required
                error={errors.travelDate}
              >
                <InputWithIcon
                  icon={<FiCalendar />}
                  type="date"
                  min={currentDateKey()}
                  value={form.travelDate}
                  onChange={(value) => {
                    update("travelDate", value);
                    if (form.returnDate && form.returnDate < value) {
                      update("returnDate", "");
                    }
                  }}
                />
              </RequestField>

              <RequestField
                label="Travel distance (km)"
                required
                error={errors.distanceKm}
              >
                <input
                  type="number"
                  min="0"
                  value={form.distanceKm}
                  onChange={(event) => update("distanceKm", event.target.value)}
                  placeholder="e.g. 850"
                />
              </RequestField>

              <RequestField
                label="Pickup Point"
                required
                error={errors.baseLocation}
              >
                <input
                  value={form.baseLocation}
                  onChange={(event) =>
                    update("baseLocation", event.target.value)
                  }
                  placeholder="Current base location"
                />
              </RequestField>

              <RequestField
                label="Drop Point"
                required
                error={errors.travelLocation}
              >
                <input
                  value={form.travelLocation}
                  onChange={(event) =>
                    update("travelLocation", event.target.value)
                  }
                  placeholder="Destination location"
                />
              </RequestField>

              <RequestField
                label="Mode of transport"
                required
                error={errors.transportMode}
              >
                <select
                  value={form.transportMode}
                  onChange={(event) =>
                    update("transportMode", event.target.value)
                  }
                >
                  <option value="">Select transport</option>
                  {(TRANSPORT_OPTIONS[travelContext.cadreBand] || []).map(
                    (mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ),
                  )}
                </select>
              </RequestField>

              <RequestField label="Return Date">
                <InputWithIcon
                  icon={<FiCalendar />}
                  type="date"
                  min={form.travelDate || currentDateKey()}
                  value={form.returnDate}
                  onChange={(value) => update("returnDate", value)}
                />
              </RequestField>

              <RequestField label="Project" required error={errors.project}>
                <select
                  value={form.project}
                  onChange={(event) => update("project", event.target.value)}
                >
                  <option value="">Select project</option>
                  {orgPrefix && (
                    <option value={`${orgPrefix} CLAIM`}>
                      {orgPrefix} CLAIM
                    </option>
                  )}
                  {projects.map((project, index) => (
                    <option key={`${project}-${index}`} value={project}>
                      {project}
                    </option>
                  ))}
                </select>
              </RequestField>

              <RequestField label="Government ID (Aadhar)">
                <input value={form.governmentId} readOnly />
              </RequestField>

              <RequestField label="Mobile number">
                <input
                  type="tel"
                  value={form.mobileNumber}
                  onChange={(event) =>
                    update("mobileNumber", event.target.value)
                  }
                />
              </RequestField>

              <RequestField label="Trip Type" required error={errors.tripType}>
                <select
                  value={form.tripType}
                  onChange={(e) => update("tripType", e.target.value)}
                >
                  <option value="">Select trip type</option>

                  <option value="Official">Official</option>

                  <option value="Client Visit">Client Visit</option>

                  <option value="Training">Training</option>

                  <option value="Conference">Conference</option>

                  <option value="Business Development">
                    Business Development
                  </option>
                </select>
              </RequestField>

              <RequestField
                label="Purpose of Travel"
                required
                error={errors.purpose}
              >
                <select
                  value={form.purpose}
                  onChange={(e) => update("purpose", e.target.value)}
                >
                  <option value="">Select purpose</option>

                  <option value="Client meeting">Client meeting</option>

                  <option value="Project discussion">Project discussion</option>

                  <option value="Training">Training</option>

                  <option value="Conference">Conference</option>

                  <option value="Other">Other</option>
                </select>
              </RequestField>

              <RequestField label="Accommodation" full>
                <label className="accommodation-checkbox">
                  <input
                    type="checkbox"
                    checked={form.accommodationRequired}
                    onChange={(event) =>
                      update("accommodationRequired", event.target.checked)
                    }
                  />
                  <span>Accommodation required</span>
                </label>
              </RequestField>

              {form.accommodationRequired && (
                <>
                  <RequestField
                    label="Guest house"
                    required
                    error={errors.accommodationPlace}
                  >
                    <select
                      value={form.accommodationPlace}
                      onChange={(e) =>
                        update("accommodationPlace", e.target.value)
                      }
                    >
                      <option value="">Select guest house</option>
                      {guestHouses.map((place) => (
                        <option key={place} value={place}>
                          {place}
                        </option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                    {form.accommodationPlace === "Other" && (
                      <input
                        value={form.otherAccommodationPlace}
                        onChange={(event) =>
                          update("otherAccommodationPlace", event.target.value)
                        }
                        placeholder="Enter guest house or accommodation"
                      />
                    )}
                  </RequestField>
                  <RequestField label="Accommodation from">
                    <InputWithIcon
                      icon={<FiCalendar />}
                      type="date"
                      value={form.accommodationFrom}
                      onChange={(value) => update("accommodationFrom", value)}
                    />
                  </RequestField>
                  <RequestField label="Accommodation to">
                    <InputWithIcon
                      icon={<FiCalendar />}
                      type="date"
                      value={form.accommodationTo}
                      onChange={(value) => update("accommodationTo", value)}
                    />
                  </RequestField>
                  <RequestField label="Number of nights">
                    <input
                      type="number"
                      min="0"
                      value={form.accommodationNights}
                      onChange={(event) =>
                        update("accommodationNights", event.target.value)
                      }
                      placeholder="e.g. 2"
                    />
                  </RequestField>
                  <RequestField label="Occupancy count">
                    <input
                      type="number"
                      min="1"
                      value={form.occupancyCount}
                      readOnly
                    />
                  </RequestField>
                </>
              )}

              <RequestField label={<>Additional Information</>} full>
                <textarea
                  value={form.additionalInfo}
                  onChange={(e) => update("additionalInfo", e.target.value)}
                  placeholder="Enter any special requests or remarks"
                />
              </RequestField>

              <RequestField label="Who will be traveling?" full>
                <div className="traveler-list">
                  {form.travelers.map((traveler, index) => (
                    <div className="traveler-row" key={index}>
                      <FiUser />

                      <select
                        value={
                          employees.some(
                            (employee) =>
                              String(employee.employeeId) === String(traveler),
                          )
                            ? traveler
                            : ""
                        }
                        onChange={(event) => {
                          updateTraveler(
                            index,
                            event.target.value === "__OTHER__"
                              ? ""
                              : event.target.value,
                          );
                        }}
                        aria-label="Select employee traveler"
                      >
                        <option value="">Select an employee</option>
                        {employees.map((employee) => (
                          <option
                            key={employee.employeeId}
                            value={employee.employeeId}
                          >
                            {employee.employeeId} - {employee.name}
                          </option>
                        ))}
                        <option value="__OTHER__">Other</option>
                      </select>

                      {!employees.some(
                        (employee) =>
                          String(employee.employeeId) === String(traveler),
                      ) && (
                        <input
                          value={traveler}
                          onChange={(e) =>
                            updateTraveler(index, e.target.value)
                          }
                          placeholder="External traveler name"
                          aria-label="External traveler name"
                        />
                      )}

                      {form.travelers.length > 1 && (
                        <button
                          type="button"
                          className="traveler-remove"
                          onClick={() => removeTraveler(index)}
                        >
                          <FiX />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="small-outline-button"
                  onClick={addTraveler}
                >
                  <FiPlus />
                  Add
                </button>
              </RequestField>
            </div>
          )}

          {/* =================================================
              SALARY ADVANCE
          ================================================= */}

          {type === "SALARY_ADVANCE" && (
            <div>
              <div className="salary-advance-limit full">
                <div className="salary-advance-summary">
                  <div>
                    <strong>
                      Standard maximum: ₹
                      {Number(salaryContext.maximumAdvance || 0).toLocaleString(
                        "en-IN",
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>3 months of your current in-hand salary.</span>
                  </div>
                </div>

                <div className="salary-advance-summary">
                  <div>
                    <span>In-hand salary</span>
                    <strong>
                      ₹
                      {Number(salaryContext.baseNetSalary || 0).toLocaleString(
                        "en-IN",
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Outstanding advance</span>
                    <strong>
                      ₹
                      {Number(
                        salaryContext.outstandingAdvance || 0,
                      ).toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <div>
                    <span>Already repaid</span>
                    <strong>
                      ₹
                      {Number(salaryContext.paidAdvance || 0).toLocaleString(
                        "en-IN",
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Remaining standard amount</span>
                    <strong>
                      ₹
                      {Number(
                        salaryContext.remainingAdvance || 0,
                      ).toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="salary-advance-note full">
                <strong>Salary advance rules</strong>

                <p>
                  Standard maximum = 3 months of your current in-hand salary.
                </p>

                <p>
                  This is a standard eligibility amount, not a hard restriction.
                  Requests above the remaining standard amount may be submitted
                  as exceptional/emergency requests and will require Admin
                  approval.
                </p>

                <p>
                  Recovery starts only from the current month or next month.
                </p>

                <p>
                  The recovery period is calculated so that the monthly
                  deduction does not exceed your current in-hand salary. A
                  minimum of 1 month is allowed.
                </p>
              </div>
              <div className="request-form-grid">
                <RequestField
                  label="Advance Amount"
                  required
                  full
                  error={errors.amount}
                >
                  <div className="currency-input">
                    <span>₹</span>

                    <input
                      type="number"
                      min="0"
                      value={form.amount}
                      onChange={(e) => update("amount", e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>
                </RequestField>

                {type === "SALARY_ADVANCE" &&
                  Number(form.amount) > 0 &&
                  Number(form.amount) >
                    Number(salaryContext.remainingAdvance || 0) && (
                    <div className="salary-advance-warning">
                      <strong>Standard limit exceeded</strong>

                      <p>
                        Remaining standard amount: ₹
                        {Number(
                          salaryContext.remainingAdvance || 0,
                        ).toLocaleString("en-IN")}
                      </p>

                      <p>
                        Requested amount: ₹
                        {Number(form.amount).toLocaleString("en-IN")}
                      </p>

                      <p>
                        Amount above remaining standard amount: ₹
                        {Math.max(
                          0,
                          Number(form.amount) -
                            Number(salaryContext.remainingAdvance || 0),
                        ).toLocaleString("en-IN")}
                      </p>

                      <p>
                        This request can still be submitted as an
                        exceptional/emergency request, but the excess amount
                        will be clearly shown to the approver.
                      </p>
                    </div>
                  )}

                <RequestField
                  label="Recovery over (months)"
                  required
                  error={errors.repaymentMonths}
                >
                  <input
                    type="number"
                    min={getMinimumRecoveryMonths()}
                    step="1"
                    value={form.repaymentMonths}
                    onChange={(e) => update("repaymentMonths", e.target.value)}
                    placeholder={`Minimum ${getMinimumRecoveryMonths()} months`}
                  />

                  <small className="request-field-hint">
                    Minimum recovery period: {getMinimumRecoveryMonths()} months
                  </small>

                  {Number(form.amount) > 0 &&
                    Number(form.repaymentMonths) > 0 && (
                      <small className="request-field-hint">
                        Estimated monthly recovery: ₹
                        {getMonthlyRecoveryAmount().toLocaleString("en-IN", {
                          maximumFractionDigits: 2,
                        })}
                      </small>
                    )}
                </RequestField>

                <RequestField
                  label="Recovery starts from"
                  required
                  error={errors.recoveryStartMonth}
                >
                  <select
                    value={form.recoveryStartMonth}
                    onChange={(e) =>
                      update("recoveryStartMonth", e.target.value)
                    }
                  >
                    {recoveryMonthOptions.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </RequestField>
                <RequestField label="Outstanding advance">
                  <input
                    type="text"
                    value={`₹${Number(
                      salaryContext.outstandingAdvance || 0,
                    ).toLocaleString("en-IN")}`}
                    readOnly
                  />
                </RequestField>
                <RequestField label="Bank account / payout details" full>
                  <input
                    value={form.bankAccount}
                    onChange={(e) => update("bankAccount", e.target.value)}
                    placeholder="Last four digits or payout details"
                  />
                </RequestField>

                <RequestField
                  label="Preferred Payout Date"
                  required
                  error={errors.payoutDate}
                >
                  <InputWithIcon
                    icon={<FiCalendar />}
                    type="date"
                    min={currentDateKey()}
                    value={form.payoutDate}
                    onChange={(value) => update("payoutDate", value)}
                  />
                </RequestField>

                <RequestField
                  label="Mode of Payout"
                  required
                  error={errors.payoutMode}
                >
                  <select
                    value={form.payoutMode}
                    onChange={(e) => update("payoutMode", e.target.value)}
                  >
                    <option value="">Select mode</option>

                    <option value="Bank Transfer">Bank Transfer</option>

                    <option value="Salary">Salary</option>
                  </select>
                </RequestField>

                <RequestField
                  label="Reason for Advance"
                  required
                  error={errors.advanceReason}
                  full
                >
                  <select
                    value={form.advanceReason}
                    onChange={(e) => update("advanceReason", e.target.value)}
                  >
                    <option value="">Select reason</option>

                    <option value="Medical emergency">Medical emergency</option>

                    <option value="Personal emergency">
                      Personal emergency
                    </option>

                    <option value="Travel">Travel</option>

                    <option value="Other">Other</option>
                  </select>
                </RequestField>

                <RequestField label="Additional Information" full>
                  <textarea
                    value={form.additionalInfo}
                    onChange={(e) => update("additionalInfo", e.target.value)}
                    placeholder="Enter any additional information"
                  />
                </RequestField>

                <RequestField label="Attachments" full>
                  <FileUpload
                    file={file}
                    onChange={setFile}
                    placeholder="Upload supporting documents (if any)"
                  />
                </RequestField>
              </div>
            </div>
          )}

          {/* =================================================
              SUPPORTING DOCUMENT
          ================================================= */}

          {type === "SUPPORTING_DOCUMENT" && (
            <div className="request-form-grid">
              <RequestField
                label="Document Type"
                required
                error={errors.documentType}
              >
                <select
                  value={form.documentType}
                  onChange={(e) => update("documentType", e.target.value)}
                >
                  <option value="">Select document type</option>

                  <option value="Salary Certificate">Salary Certificate</option>

                  <option value="Employment Certificate">
                    Employment Certificate
                  </option>

                  <option value="Experience Letter">Experience Letter</option>

                  <option value="Other">Other</option>
                </select>
              </RequestField>

              <RequestField
                label="Purpose"
                required
                error={errors.documentPurpose}
              >
                <select
                  value={form.documentPurpose}
                  onChange={(e) => update("documentPurpose", e.target.value)}
                >
                  <option value="">Select purpose</option>

                  <option value="Bank">Bank</option>

                  <option value="Visa">Visa</option>

                  <option value="Loan">Loan</option>

                  <option value="Personal">Personal</option>

                  <option value="Other">Other</option>
                </select>
              </RequestField>

              <RequestField label="Additional Information" full>
                <textarea
                  value={form.documentAdditionalInfo}
                  onChange={(e) =>
                    update("documentAdditionalInfo", e.target.value)
                  }
                  placeholder="Enter any additional information"
                />
              </RequestField>

              <RequestField label="Attachments" full>
                <FileUpload
                  file={file}
                  onChange={setFile}
                  placeholder="Upload documents"
                />
              </RequestField>
            </div>
          )}

          {/* =================================================
              ASSET
          ================================================= */}

          {type === "ASSET_REQUEST" && (
            <div className="request-form-grid">
              <RequestField
                label="Asset Category"
                required
                error={errors.assetCategory}
              >
                <select
                  value={form.assetCategory}
                  onChange={(e) => update("assetCategory", e.target.value)}
                >
                  <option value="">Select category</option>
                  <option value="System">System</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Software">Software</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Others">Others</option>
                </select>
              </RequestField>

              <RequestField
                label="Asset Sub-category"
                required
                error={errors.assetSubCategory}
              >
                <select
                  value={form.assetSubCategory}
                  onChange={(e) => update("assetSubCategory", e.target.value)}
                >
                  <option value="">Select sub-category</option>
                  {form.assetCategory === "System" && (
                    <>
                      <option value="Laptop">Laptop</option>
                      <option value="Desktop">Desktop</option>
                      <option value="Server">Server</option>
                    </>
                  )}
                  {form.assetCategory === "Furniture" && (
                    <>
                      <option value="Table">Table</option>
                      <option value="Chair">Chair</option>
                      <option value="Drawers">Drawers</option>
                      <option value="cupboard">Cupboard</option>
                    </>
                  )}
                  {form.assetCategory === "Equipment" && (
                    <>
                      <option value="Electrical">Electrical</option>
                      <option value="Non-Electrical">Non-Electrical</option>
                    </>
                  )}
                  {form.assetCategory === "Software" && (
                    <option value="Software">Software</option>
                  )}
                  {form.assetCategory === "Accessories" && (
                    <option value="Accessories">Accessories</option>
                  )}
                  {form.assetCategory === "Others" && (
                    <option value="Others">Other</option>
                  )}
                </select>
              </RequestField>

              <RequestField
                label="Item / Software Name"
                required
                error={errors.itemName}
              >
                <input
                  value={form.itemName}
                  onChange={(e) => update("itemName", e.target.value)}
                  placeholder="Dell Latitude / VS Code etc."
                />
              </RequestField>

              <RequestField label="Configuration / Details" full>
                <input
                  value={form.configuration}
                  onChange={(e) => update("configuration", e.target.value)}
                  placeholder="Enter configuration details"
                />
              </RequestField>

              <RequestField
                label="Reason for Request"
                required
                error={errors.assetReason}
                full
              >
                <select
                  value={form.assetReason}
                  onChange={(e) => update("assetReason", e.target.value)}
                >
                  <option value="">Select reason</option>

                  <option value="New Joiner">New Joiner</option>

                  <option value="Replacement">Replacement</option>

                  <option value="Additional Requirement">
                    Additional Requirement
                  </option>

                  <option value="Project Requirement">
                    Project Requirement
                  </option>

                  <option value="Other">Other</option>
                </select>
              </RequestField>

              <RequestField label="Additional Information" full>
                <textarea
                  value={form.assetAdditionalInfo}
                  onChange={(e) =>
                    update("assetAdditionalInfo", e.target.value)
                  }
                  placeholder="Enter any additional information"
                />
              </RequestField>

              <RequestField
                label="Required by"
                required
                error={errors.requiredDate}
              >
                <InputWithIcon
                  icon={<FiCalendar />}
                  type="date"
                  value={form.requiredDate}
                  onChange={(value) => update("requiredDate", value)}
                />
              </RequestField>
              <RequestField label="Work location">
                <input
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                  placeholder="Office or remote"
                />
              </RequestField>
              <RequestField label="Urgency" full>
                <select
                  value={form.urgency}
                  onChange={(e) => update("urgency", e.target.value)}
                >
                  <option value="">Select urgency</option>
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </RequestField>
            </div>
          )}
        </div>

        <div className="request-form-actions">
          <button
            type="button"
            className="request-cancel-button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="request-submit-button"
            disabled={saving}
            onClick={submit}
          >
            {saving ? "Submitting..." : config.button}
          </button>
        </div>
      </div>

      <Modal
        isVisible={alertModal.isVisible}
        title={alertModal.title}
        onClose={closeAlert}
        buttons={alertModal.buttons}
      >
        <p style={{ whiteSpace: "pre-wrap" }}>{alertModal.message}</p>
      </Modal>
    </div>
  );
};

function RequestField({
  label,
  children,
  full = false,
  error,
  required = false,
}) {
  return (
    <div className={`request-field ${full ? "full" : ""}`}>
      <label>
        {label}
        {required && <span className="required-marker"> *</span>}
      </label>

      {children}
      {error && <small className="request-field-error">{error}</small>}
    </div>
  );
}

function InputWithIcon({
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  min,
}) {
  return (
    <div className="request-input-icon">
      {icon}

      <input
        type={type}
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function FileUpload({ file, onChange, placeholder }) {
  return (
    <label className="file-upload-row">
      <FiPaperclip />

      <span>{file ? file.name : placeholder}</span>

      <input
        type="file"
        hidden
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
    </label>
  );
}

export default EmployeeRequestForm;
