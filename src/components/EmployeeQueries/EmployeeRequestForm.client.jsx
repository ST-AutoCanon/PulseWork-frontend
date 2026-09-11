"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Modal from "../Modal/Modal.client";

import {
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiMapPin,
  FiMonitor,
  FiPaperclip,
  FiPlus,
  FiUser,
  FiX,
} from "react-icons/fi";

const TRAVEL_CLASS_BY_ROLE = {
  admin: "Business",
  director: "Business",
  manager: "Premium Economy",
  hr: "Premium Economy",
  employee: "Economy",
};

const TRANSPORT_OPTIONS = {
  LOWER: ["Bus", "Train"],
  UPPER: ["Airbus", "Train", "Bus"],
};

const currentMonthKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const recoveryMonthOptions = Array.from({ length: 3 }, (_, index) => {
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
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    from: "",
    to: "",
    travelDate: "",
    returnDate: "",
    travelClass: "",
    cadreBand: "",
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

    assetRequestType: "",
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
  const [guestHouses, setGuestHouses] = useState([]);
  const [salaryContext, setSalaryContext] = useState({
    monthlyGrossSalary: 0,
    maximumAdvance: 0,
  });
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  const roleClass =
    TRAVEL_CLASS_BY_ROLE[String(userRole || "employee").toLowerCase()] ||
    "Economy";

  useEffect(() => {
    if (type === "TRAVEL_BOOKING") update("travelClass", roleClass);
  }, [roleClass, type]);

  useEffect(() => {
    if (type !== "TRAVEL_BOOKING") return;
    update("transportMode", "");
  }, [form.cadreBand, type]);

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
        setSalaryContext({ monthlyGrossSalary: 0, maximumAdvance: 0 }),
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
        icon: FiDollarSign,
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
      if (!form.cadreBand) nextErrors.cadreBand = "Select a cadre band";
      if (!form.baseLocation.trim())
        nextErrors.baseLocation = "Base location is required";
      if (!form.travelLocation.trim())
        nextErrors.travelLocation = "Travel location is required";
      if (!form.transportMode)
        nextErrors.transportMode = "Select a mode of transport";
      if (!form.distanceKm || Number(form.distanceKm) < 0)
        nextErrors.distanceKm = "Enter a valid travel distance";
      if (
        form.cadreBand === "LOWER" &&
        !["Bus", "Train"].includes(form.transportMode)
      )
        nextErrors.transportMode =
          "Lower band travel is limited to Bus or Train";
      if (!form.tripType) nextErrors.tripType = "Trip type is required";
      if (!form.purpose) nextErrors.purpose = "Purpose is required";
      if (!form.travelers.some((traveler) => traveler.trim()))
        nextErrors.travelers = "Add at least one traveler";
      if (
        form.accommodationRequired &&
        (!form.accommodationPlace ||
          (form.accommodationPlace === "Other" &&
            !form.otherAccommodationPlace.trim()))
      )
        nextErrors.accommodationPlace = "Select a guest house";
    }
    if (type === "SALARY_ADVANCE") {
      if (!form.amount || Number(form.amount) <= 0)
        nextErrors.amount = "Enter a valid amount";
      if (
        salaryContext.maximumAdvance <= 0 ||
        Number(form.amount) > salaryContext.maximumAdvance
      )
        nextErrors.amount = `Maximum allowed is ₹${Number(
          salaryContext.maximumAdvance,
        ).toLocaleString("en-IN")}`;
      if (!form.repaymentMonths || Number(form.repaymentMonths) < 1)
        nextErrors.repaymentMonths = "Enter a valid recovery period";
      if (!form.recoveryStartMonth)
        nextErrors.recoveryStartMonth = "Select a recovery start month";
      if (!form.payoutDate) nextErrors.payoutDate = "Payout date is required";
      if (!form.payoutMode) nextErrors.payoutMode = "Select a payout mode";
      if (!form.advanceReason) nextErrors.advanceReason = "Select a reason";
    }
    if (type === "SUPPORTING_DOCUMENT") {
      if (!form.documentType)
        nextErrors.documentType = "Select a document type";
      if (!form.documentPurpose)
        nextErrors.documentPurpose = "Select a purpose";
    }
    if (type === "ASSET_REQUEST") {
      if (!form.assetRequestType)
        nextErrors.assetRequestType = "Select a request type";
      if (!form.itemName.trim()) nextErrors.itemName = "Item name is required";
      if (!form.assetReason) nextErrors.assetReason = "Select a reason";
      if (!form.requiredDate)
        nextErrors.requiredDate = "Required date is required";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async () => {
    if (!validate()) {
      showAlert("Please complete all required fields.");
      return;
    }

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
          travelClass: form.travelClass,
          cadreBand: form.cadreBand,
          baseLocation: form.baseLocation,
          travelLocation: form.travelLocation,
          transportMode: form.transportMode,
          distanceKm: Number(form.distanceKm),
          beyondEligibility:
            form.cadreBand === "LOWER" && Number(form.distanceKm) > 1000,
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
        };
      }

      if (type === "SALARY_ADVANCE") {
        requestType = "SALARY_ADVANCE";

        title = "Salary Advance Request";

        details = {
          amount: form.amount,
          payoutDate: form.payoutDate,
          payoutMode: form.payoutMode,
          reason: form.advanceReason,
          additionalInfo: form.additionalInfo,
          repaymentMonths: form.repaymentMonths,
          recoveryStartMonth: form.recoveryStartMonth,
          existingAdvance: form.existingAdvance,
          bankAccount: form.bankAccount,
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
          requestType: form.assetRequestType,
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
      );
    } finally {
      setSaving(false);
    }
  };

  const Icon = config.icon;

  const showAlert = (message, title = "") =>
    setAlertModal({ isVisible: true, title, message });

  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

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
                  value={form.travelDate}
                  onChange={(value) => update("travelDate", value)}
                />
              </RequestField>

              <RequestField
                label="Cadre (Band)"
                required
                error={errors.cadreBand}
              >
                <select
                  value={form.cadreBand}
                  onChange={(event) => update("cadreBand", event.target.value)}
                >
                  <option value="">Select band</option>
                  <option value="LOWER">Lower band</option>
                  <option value="UPPER">Upper band</option>
                </select>
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
                label="Base location"
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
                label="Travel location"
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
                  disabled={!form.cadreBand}
                  onChange={(event) =>
                    update("transportMode", event.target.value)
                  }
                >
                  <option value="">Select transport</option>
                  {(TRANSPORT_OPTIONS[form.cadreBand] || []).map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </RequestField>

              <RequestField label="Return Date">
                <InputWithIcon
                  icon={<FiCalendar />}
                  type="date"
                  value={form.returnDate}
                  onChange={(value) => update("returnDate", value)}
                />
              </RequestField>

              <RequestField
                label={`Class (${roleClass})`}
                error={errors.travelClass}
              >
                <select
                  value={form.travelClass}
                  disabled
                  onChange={(e) => update("travelClass", e.target.value)}
                >
                  <option value="">Select class</option>

                  <option value="Economy">Economy</option>

                  <option value="Premium Economy">Premium Economy</option>

                  <option value="Business">Business</option>

                  <option value="First">First</option>
                </select>
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
                </>
              )}

              <RequestField label={<>Additional Information</>} full>
                <textarea
                  value={form.additionalInfo}
                  onChange={(e) => update("additionalInfo", e.target.value)}
                  placeholder="Enter any special requests or remarks"
                />
              </RequestField>

              <RequestField
                label="Who will be traveling?"
                required
                error={errors.travelers}
                full
              >
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
            <div className="request-form-grid">
              <div className="salary-advance-limit full">
                <strong>
                  Maximum allowed: ₹
                  {Number(salaryContext.maximumAdvance || 0).toLocaleString(
                    "en-IN",
                  )}
                </strong>
                <span>(3 months&apos; gross salary)</span>
              </div>

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

              <RequestField
                label="Recovery over (months)"
                required
                error={errors.repaymentMonths}
              >
                <input
                  type="number"
                  min="1"
                  value={form.repaymentMonths}
                  onChange={(e) => update("repaymentMonths", e.target.value)}
                  placeholder="e.g. 6"
                />
              </RequestField>

              <RequestField
                label="Recovery starts from"
                required
                error={errors.recoveryStartMonth}
              >
                <select
                  value={form.recoveryStartMonth}
                  onChange={(e) => update("recoveryStartMonth", e.target.value)}
                >
                  {recoveryMonthOptions.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </RequestField>
              <RequestField label="Existing advance">
                <input
                  type="number"
                  min="0"
                  value={form.existingAdvance}
                  onChange={(e) => update("existingAdvance", e.target.value)}
                  placeholder="0"
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

                  <option value="Personal emergency">Personal emergency</option>

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
                label="Request Type"
                required
                error={errors.assetRequestType}
              >
                <select
                  value={form.assetRequestType}
                  onChange={(e) => update("assetRequestType", e.target.value)}
                >
                  <option value="">Select request type</option>

                  <option value="Laptop">Laptop</option>

                  <option value="Monitor">Monitor</option>

                  <option value="Mobile">Mobile</option>

                  <option value="Software">Software</option>

                  <option value="Accessory">Accessory</option>
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
        buttons={[{ label: "OK", onClick: closeAlert }]}
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

function InputWithIcon({ icon, type = "text", value, onChange, placeholder }) {
  return (
    <div className="request-input-icon">
      {icon}

      <input
        type={type}
        value={value}
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
