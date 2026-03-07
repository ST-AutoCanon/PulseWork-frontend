"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Country, State } from "country-state-city";
import { useAuth } from "../../context/AuthProvider.client";
import {
  getStatusBgColor,
  getFinanceStatusColor,
  formatDate,
} from "./utils.client";

export default function useProjectForm({
  projectData,
  onClose,
  onSuccess,
  onProjectAdded,
}) {
  const { user } = useAuth();
  const projectRole = user?.role || user?.userRole || " ";
  const dashboardData = user?.dashboardData || user?.dashboard || {};
  const department = (dashboardData.department || "").toLowerCase();
  const employeeId = user?.employeeId ?? user?.id ?? null;
  const orgId = user?.orgId ?? user?.raw?.org_id ?? null;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rolePermissions = {
    Admin: {
      allowedSteps: [1, 2, 3, 4],
      editable: { 1: true, 2: true, 3: true, 4: true },
    },
    Employee: {
      allowedSteps: [1, 2, 3],
      editable: { 1: false, 2: false, 3: false, 4: false },
    },
    Manager: {
      allowedSteps: [1, 2, 3],
      editable: { 1: false, 2: false, 3: true, 4: false },
    },
  };

  if (projectRole === "Manager" && department === "finance") {
    rolePermissions.Manager = {
      allowedSteps: [1, 2, 3, 4],
      editable: { 1: false, 2: false, 3: false, 4: true },
    };
  }

  const { allowedSteps, editable: editableFromRole } =
    rolePermissions[projectRole] || rolePermissions.Employee;

  const dropdownRef = useRef(null);
  const [step, setStep] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const [points, setPoints] = useState([""]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newAttachments, setNewAttachments] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);

  const [formData, setFormData] = useState({
    country: "",
    state: "",
    company_name: "",
    project_name: "",
    project_poc_name: "",
    project_poc_contact: "",
    company_gst: "",
    company_pan: "",
    company_address: "",
    project_category: [],
    start_date: "",
    end_date: "",
    service_mode: "",
    service_location: "",
    project_status: "",
    payment_type: "",
    description: "",
    attachment_url: [],
    sts_owner_id: "",
    sts_owner: "",
    sts_contact: "",
    employee_list: [],
    key_considerations: [],
    milestones: [],
    project_amount: "",
    monthly_fixed_amount: "",
    service_description: "",
    month_year: "",
    tds_percentage: "",
    tds_amount: "",
    gst_percentage: "",
    gst_amount: "",
    total_amount: "",
    financialDetails: [],
  });

  useEffect(() => {
    if (projectData) {
      setFormData((prev) => ({
        ...prev,
        ...projectData,
        monthly_fixed_amount:
          projectData.monthly_fixed_amount ?? prev.monthly_fixed_amount,
        service_description:
          projectData.service_description ?? prev.service_description,
        financialDetails:
          projectData?.financialDetails?.map((row) => ({
            id: row.id,
            milestone_id: row.milestone_id,
            month_year: row.month_year,
            service_description: row.service_description,
            monthly_fixed_amount: row.monthly_fixed_amount,
            m_actual_amount: row.m_actual_amount,
            m_tds_percentage: row.m_tds_percentage,
            m_tds_amount: row.m_tds_amount,
            m_gst_percentage: row.m_gst_percentage,
            m_gst_amount: row.m_gst_amount,
            m_total_amount: row.m_total_amount,
            status: row.status,
            completed_date: row.completed_date,
          })) || prev.financialDetails,
      }));
    }
  }, [projectData]);

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });
  const showAlert = (message, title = "") =>
    setAlertModal({ isVisible: true, title, message });
  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  useEffect(() => {
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
      ...(employeeId ? { "x-employee-id": employeeId } : {}),
      ...(orgId ? { "x-org-id": orgId } : {}),
    };

    axios
      .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/employees`, {
        withCredentials: true,
        headers,
      })
      .then((response) => {
        const employeesData = response.data.data || response.data || [];
        setAllEmployees(employeesData);
        setFilteredEmployees(employeesData);
      })
      .catch((error) => {
        console.error("Error fetching employees:", error);
      });
  }, [employeeId, orgId]);

  useEffect(() => {
    if (filterType === "all") {
      if (!searchQuery.trim()) {
        setFilteredEmployees(allEmployees);
      } else {
        const lowerSearch = searchQuery.trim().toLowerCase();
        setFilteredEmployees(
          allEmployees.filter((emp) => {
            const name = emp.name || "";
            const employeeId = emp.employee_id || "";
            const deptName = emp.department_name || "";
            return (
              name.toLowerCase().includes(lowerSearch) ||
              employeeId.toLowerCase().includes(lowerSearch) ||
              deptName.toLowerCase().includes(lowerSearch)
            );
          }),
        );
      }
    } else if (filterType === "dept") {
      const uniqueDepts = [
        ...new Set(
          allEmployees
            .filter(
              (emp) => emp.department_name && emp.department_name.trim() !== "",
            )
            .map((emp) => emp.department_name.trim()),
        ),
      ];
      setFilteredEmployees(
        uniqueDepts.map((dept) => ({ name: dept, type: "department" })),
      );
    }
  }, [searchQuery, filterType, allEmployees]);

  const stsOwners = allEmployees.filter(
    (emp) => emp.role === "Admin" || emp.role === "Manager",
  );

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files.map((file) => file.name));
    setNewAttachments(files);
    setFormData((prev) => ({ ...prev, attachment_url: files }));
  };

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilterType(value);
  };

  const handleDepartmentDoubleClick = (departmentName) => {
    if (!allEmployees || allEmployees.length === 0) return;
    const departmentEmployees = allEmployees.filter(
      (emp) => emp.department_name === departmentName,
    );
    setSelectedEmployees((prev) => {
      const existingIds = new Set(prev.map((emp) => emp.employee_id));
      const newEmployees = departmentEmployees.filter(
        (emp) => !existingIds.has(emp.employee_id),
      );
      return [...prev, ...newEmployees];
    });
  };

  const handleDoubleClick = (employee) => {
    if (!employee) return;

    const newEmployee = {
      employee_id: employee.employee_id,
      name: employee.name,
      department_id: employee.department_id,
      department_name: employee.department_name,
    };

    setSelectedEmployees((prev) => {
      if (prev.some((emp) => emp.employee_id === newEmployee.employee_id)) {
        return prev;
      }
      const updatedEmployees = [...prev, newEmployee];

      setFormData((prev) => ({
        ...prev,
        employee_list: updatedEmployees.map((emp) => emp.employee_id),
      }));

      return updatedEmployees;
    });
  };

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      employee_list: selectedEmployees.map((emp) => emp.employee_id),
    }));
  }, [selectedEmployees]);

  useEffect(() => {
    if (projectData?.employee_list?.length > 0 && allEmployees.length > 0) {
      setSelectedEmployees(
        allEmployees.filter((emp) =>
          projectData.employee_list.includes(emp.employee_id),
        ),
      );
    }
  }, [allEmployees, projectData]);

  useEffect(() => {
    if (projectData?.id) {
      fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${projectData.id}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
            ...(orgId ? { "x-org-id": orgId } : {}),
          },
        },
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.project) {
            setFormData((prev) => ({
              ...prev,
              ...data.project,
              employee_list: data.project.employee_list || [],
              key_considerations: Array.isArray(data.project.key_considerations)
                ? data.project.key_considerations
                : [],
            }));
            setSelectedFiles(
              Array.isArray(data.project.attachment_url)
                ? data.project.attachment_url
                : data.project.attachment_url
                  ? [data.project.attachment_url]
                  : [],
            );
            setSelectedEmployees(
              allEmployees.filter((emp) =>
                (data.project.employee_list || []).includes(emp.employee_id),
              ),
            );
          }
        })
        .catch((error) =>
          console.error("Error fetching project details:", error),
        );
    }
  }, [projectData, allEmployees]);

  const categories = [
    "Website Design",
    "Chatbot Application",
    "3D Modeling",
    "IT consulting",
    "Software Development",
    "Testing and QA",
    "Styling Product design",
    "Export Homologation",
    "Consulting",
    "CAE",
    "Domestic Type Approval",
    "Tooling, jigs and fixtures",
    "Staffing and Training services",
  ];

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    setFormData((prevData) => {
      let newData = { ...prevData };

      if (type === "file") {
        newData[name] = files[0];
        return newData;
      }

      let projectAmount =
        parseFloat(
          name === "project_amount" ? value : prevData.project_amount,
        ) || 0;
      let tdsPercentage =
        parseFloat(
          name === "tds_percentage" ? value : prevData.tds_percentage,
        ) || 0;
      let gstPercentage =
        parseFloat(
          name === "gst_percentage" ? value : prevData.gst_percentage,
        ) || 0;

      let tdsAmount = (tdsPercentage / 100) * projectAmount;
      let gstAmount = (gstPercentage / 100) * projectAmount;
      let totalAmount = projectAmount - tdsAmount + gstAmount;

      const updatedFinancialDetails = (prevData.financialDetails || []).map(
        (fd) => {
          const actualAmount = parseFloat(fd.m_actual_amount) || 0;
          const mActualPercentage = projectAmount
            ? ((actualAmount / projectAmount) * 100).toFixed(2)
            : "0";

          return {
            ...fd,
            m_actual_percentage: mActualPercentage,
          };
        },
      );

      newData = {
        ...newData,
        financialDetails: updatedFinancialDetails,
      };

      if (name === "project_amount") {
        newData = {
          ...newData,
          project_amount: value,
          tds_amount: tdsAmount.toFixed(2),
          gst_amount: gstAmount.toFixed(2),
          total_amount: totalAmount.toFixed(2),
        };
      }

      if (name === "tds_percentage") {
        newData = {
          ...newData,
          tds_percentage: value,
          tds_amount: tdsAmount.toFixed(2),
          total_amount: totalAmount.toFixed(2),
        };
      }

      if (name === "gst_percentage") {
        newData = {
          ...newData,
          gst_percentage: value,
          gst_amount: gstAmount.toFixed(2),
          total_amount: totalAmount.toFixed(2),
        };
      }

      return {
        ...newData,
        [name]: value,
      };
    });
  };

  const handleMilestoneChange = (index, event) => {
    const { name, value } = event.target;

    setFormData((prev) => {
      const updatedMilestones = [...(prev.milestones || [])];
      updatedMilestones[index] = {
        ...(updatedMilestones[index] || {}),
        [name]: value,
      };

      const updatedFinancialDetails = [...(prev.financialDetails || [])];
      if (name === "details") {
        if (!updatedFinancialDetails[index])
          updatedFinancialDetails[index] = {};
        updatedFinancialDetails[index].milestone_details = value;
      }

      return {
        ...prev,
        milestones: updatedMilestones,
        financialDetails: updatedFinancialDetails,
      };
    });
  };

  const handleFinanceChange = (index, e) => {
    const { name, value } = e.target;
    const updatedDetails = [...(formData.financialDetails || [])];
    const finance = { ...(updatedDetails[index] || {}), [name]: value };

    const projectAmount = parseFloat(formData.project_amount || 0) || 0;

    if (finance.m_actual_percentage) {
      finance.m_actual_amount = (
        (projectAmount * parseFloat(finance.m_actual_percentage)) /
        100
      ).toFixed(2);
    }

    if (finance.m_tds_percentage) {
      finance.m_tds_amount = (
        (parseFloat(finance.m_actual_amount || 0) *
          parseFloat(finance.m_tds_percentage)) /
        100
      ).toFixed(2);
    }

    if (finance.m_gst_percentage) {
      finance.m_gst_amount = (
        (parseFloat(finance.m_actual_amount || 0) *
          parseFloat(finance.m_gst_percentage)) /
        100
      ).toFixed(2);
    }

    finance.m_total_amount = (
      parseFloat(finance.m_actual_amount || 0) -
      parseFloat(finance.m_tds_amount || 0) +
      parseFloat(finance.m_gst_amount || 0)
    ).toFixed(2);

    updatedDetails[index] = finance;
    setFormData((prev) => ({ ...prev, financialDetails: updatedDetails }));
  };

  useEffect(() => {
    if (formData.project_amount) {
      const projectAmount = parseFloat(formData.project_amount) || 0;

      const updatedFinancialDetails = (formData.financialDetails || []).map(
        (detail) => {
          let actualAmount = parseFloat(detail.m_actual_amount) || 0;
          let tdsAmount = parseFloat(detail.m_tds_amount) || 0;
          let gstAmount = parseFloat(detail.m_gst_amount) || 0;

          let updatedDetail = { ...detail };
          if (
            (!detail.m_actual_percentage ||
              detail.m_actual_percentage === "") &&
            detail.m_actual_amount
          ) {
            const recalculatedPercentage = projectAmount
              ? ((actualAmount / projectAmount) * 100).toFixed(2)
              : "0";
            updatedDetail.m_actual_percentage = recalculatedPercentage;
          }

          if (
            (!detail.m_tds_percentage || detail.m_tds_percentage === "") &&
            detail.m_tds_amount &&
            actualAmount
          ) {
            const recalculatedTdsPercentage = actualAmount
              ? ((tdsAmount / actualAmount) * 100).toFixed(2)
              : "0";
            updatedDetail.m_tds_percentage = recalculatedTdsPercentage;
          }

          updatedDetail.m_total_amount = (
            actualAmount -
            tdsAmount +
            gstAmount
          ).toFixed(2);

          return updatedDetail;
        },
      );

      setFormData((prev) => ({
        ...prev,
        financialDetails: updatedFinancialDetails,
      }));
    }
  }, [formData.project_amount]);

  const addMilestone = () => {
    const newMilestone = {
      details: "",
      start_date: "",
      end_date: "",
      status: "",
      dependency: "",
      assigned_to: "",
    };

    const newFinancialEntry = {
      milestone_details: "",
      m_actual_percentage: "",
      m_actual_amount: "",
      m_tds_percentage: "",
      m_tds_amount: "",
      m_gst_percentage: "",
      m_gst_amount: "",
      m_total_amount: "",
      status: "",
    };

    setFormData((prev) => ({
      ...prev,
      milestones: [...(prev.milestones || []), newMilestone],
      financialDetails: [...(prev.financialDetails || []), newFinancialEntry],
    }));
  };

  const removeMilestone = (indexToRemove) => {
    setFormData((prev) => {
      const updatedMilestones = prev.milestones.filter(
        (_, index) => index !== indexToRemove,
      );

      const updatedFinancialDetails = prev.financialDetails.filter(
        (_, index) => index !== indexToRemove,
      );

      return {
        ...prev,
        milestones: updatedMilestones,
        financialDetails: updatedFinancialDetails,
      };
    });
  };

  useEffect(() => {
    setFormData((prev) => {
      const milestones = Array.isArray(prev.milestones) ? prev.milestones : [];
      const financialDetails = Array.isArray(prev.financialDetails)
        ? prev.financialDetails
        : [];

      const updatedFinancialDetails = financialDetails.map((fd, index) => {
        if (milestones[index] && typeof milestones[index] === "object") {
          return {
            ...fd,
            milestone_id: milestones[index].id || fd.milestone_id,
            milestone_details:
              milestones[index].details || fd.milestone_details,
          };
        }
        return fd;
      });

      if (milestones.length > updatedFinancialDetails.length) {
        const diff = milestones.length - updatedFinancialDetails.length;
        for (let i = 0; i < diff; i++) {
          const milestone = milestones[updatedFinancialDetails.length + i];
          if (milestone && typeof milestone === "object") {
            updatedFinancialDetails.push({
              milestone_details: milestone.details || "",
              m_actual_percentage: "",
              m_actual_amount: "",
              m_tds_percentage: "",
              m_tds_amount: "",
              m_gst_percentage: "",
              m_gst_amount: "",
              m_total_amount: "",
              status: "",
              milestone_id: milestone.id || null,
            });
          }
        }
      }
      return { ...prev, financialDetails: updatedFinancialDetails };
    });
  }, [formData.milestones]);

  const handleRemoveEmployee = (employeeId) => {
    setSelectedEmployees((prev) =>
      prev.filter((emp) => emp.employee_id !== employeeId),
    );
  };

  const handleStatusChange = (index, newStatus) => {
    setFormData((prevData) => {
      const updatedFinancialDetails = [...(prevData.financialDetails || [])];
      updatedFinancialDetails[index] = {
        ...updatedFinancialDetails[index],
        status: newStatus,
        completed_date:
          newStatus === "Received" ? new Date().toLocaleDateString() : "",
      };
      return { ...prevData, financialDetails: updatedFinancialDetails };
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const downloadAllAttachments = async (projectId) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${projectId}/attachments/download`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
            ...(orgId ? { "x-org-id": orgId } : {}),
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch attachments");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-${projectId}-attachments.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading attachments:", error);
    }
  };

  const openAttachment = async (fileName) => {
    try {
      // Ensure the attachment URL is built correctly regardless of whether
      // the backend value already includes the pjattachments prefix.
      let attachmentPath = String(fileName || "").trim();
      if (!attachmentPath) return;

      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") || "";

      let url;
      if (
        attachmentPath.startsWith("http://") ||
        attachmentPath.startsWith("https://")
      ) {
        url = attachmentPath;
      } else if (attachmentPath.startsWith("/pjattachments")) {
        url = `${backendUrl}${attachmentPath}`;
      } else {
        // Strip leading slashes to avoid doubling
        const cleanPath = attachmentPath.replace(/^\/+/, "");
        url = `${backendUrl}/pjattachments/${cleanPath}`;
      }

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          ...(orgId ? { "x-org-id": orgId } : {}),
        },
      });

      if (!response.ok) throw new Error("Failed to fetch the file.");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (error) {
      console.error("Error opening attachment:", error);
    }
  };

  useEffect(() => {
    if (formData.payment_type === "Monthly Scheduled") {
      setFormData((prev) => ({ ...prev, financialDetails: [] }));
    } else {
      if (!formData.milestones || formData.milestones.length === 0) {
        setFormData((prev) => ({ ...prev, financialDetails: [] }));
      }
    }
  }, [formData.payment_type]);

  useEffect(() => {
    const countryList = Country.getAllCountries().map((country) => ({
      code: country.isoCode,
      name: country.name,
    }));
    setCountries(countryList);
  }, []);

  useEffect(() => {
    if (formData.country) {
      const stateList = State.getStatesOfCountry(formData.country).map(
        (state) => ({
          code: state.isoCode,
          name: state.name,
        }),
      );
      setStates(stateList);
    } else {
      setStates([]);
    }
  }, [formData.country]);

  const steps = [
    "Project Details",
    "Project Owners",
    "Milestone",
    "Financial Details",
  ];

  const adjustedSteps =
    formData.payment_type === "Monthly Scheduled"
      ? [steps[0], steps[1], steps[3]]
      : steps.filter((_, index) => allowedSteps.includes(index + 1));

  const visibleCount = adjustedSteps.length;
  let totalLineWidth = "68%";
  let lineLeft = "16%";
  if (visibleCount === 3) {
    totalLineWidth = "60%";
    lineLeft = "20%";
  }

  const maxIndex = visibleCount - 1;

  let currentStepName;
  if (formData.payment_type === "Monthly Scheduled") {
    if (step === 1 || step === 2 || step === 4) {
      currentStepName = steps[step === 4 ? 3 : step - 1];
    } else {
      currentStepName = steps[3];
    }
  } else {
    currentStepName = steps[step - 1];
  }

  const currentIndex = adjustedSteps.indexOf(currentStepName);
  const progressValue =
    maxIndex > 0 ? (currentIndex / maxIndex) * parseFloat(totalLineWidth) : 0;
  const progressPercent = `${progressValue}%`;

  useEffect(() => {
    if (formData.payment_type === "Monthly Scheduled") {
      if (![1, 2, 4].includes(step)) {
        setStep(4);
      }
    } else {
      if (!allowedSteps.includes(step)) {
        setStep(1);
      }
    }
  }, [step, formData.payment_type, allowedSteps]);

  const nextStep = () => {
    const currentVisibleIndex = adjustedSteps.indexOf(currentStepName);
    if (currentVisibleIndex < adjustedSteps.length - 1) {
      const nextStepName = adjustedSteps[currentVisibleIndex + 1];
      const nextStepNum = steps.indexOf(nextStepName) + 1;
      setStep(nextStepNum);
    }
  };

  const prevStep = () => {
    const currentVisibleIndex = adjustedSteps.indexOf(currentStepName);
    if (currentVisibleIndex > 0) {
      const prevStepName = adjustedSteps[currentVisibleIndex - 1];
      const prevStepNum = steps.indexOf(prevStepName) + 1;
      setStep(prevStepNum);
    }
  };

  useEffect(() => {
    if (formData.key_considerations && formData.key_considerations.length > 0) {
      setPoints(formData.key_considerations);
    }
  }, [formData.key_considerations]);

  const handleInputChange = (index, value) => {
    const newPoints = [...points];
    newPoints[index] = value;
    setPoints(newPoints);
    setFormData((prev) => ({
      ...prev,
      key_considerations: newPoints,
    }));
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newPoints = [...points, ""];
      setPoints(newPoints);
      setFormData((prev) => ({
        ...prev,
        key_considerations: newPoints,
      }));
    } else if (
      e.key === "Backspace" &&
      points[index] === "" &&
      points.length > 1
    ) {
      e.preventDefault();
      const newPoints = points.slice(0, index).concat(points.slice(index + 1));
      setPoints(newPoints);
      setFormData((prev) => ({
        ...prev,
        key_considerations: newPoints,
      }));
    }
  };

  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const updatedCategories = checked
        ? [...prev.project_category, value]
        : prev.project_category.filter((cat) => cat !== value);
      return { ...prev, project_category: updatedCategories };
    });
  };

  const handleStsOwnerChange = (e) => {
    const ownerId = e.target.value;
    const owner = allEmployees.find((emp) => emp.employee_id === ownerId);

    setFormData((prev) => ({
      ...prev,
      sts_owner_id: ownerId,
      sts_owner: owner ? owner.name : "",
      sts_contact: owner ? owner.phone_number || "" : "",
    }));
  };

  const handleTopLevelFinanceChange = (field, value) => {
    let updatedData = { ...formData, [field]: value };

    const projectAmount = parseFloat(updatedData.project_amount || 0);
    const tdsPercentage = parseFloat(updatedData.tds_percentage || 0);
    const gstPercentage = parseFloat(updatedData.gst_percentage || 0);

    const tdsAmount = (projectAmount * tdsPercentage) / 100;
    const gstAmount = (projectAmount * gstPercentage) / 100;

    const totalAmount = projectAmount - tdsAmount + gstAmount;

    updatedData = {
      ...updatedData,
      tds_amount: tdsAmount.toFixed(2),
      gst_amount: gstAmount.toFixed(2),
      total_amount: totalAmount.toFixed(2),
    };

    setFormData(updatedData);
  };

  useEffect(() => {
    const ownerId = formData.sts_owner_id;
    if (!ownerId || !allEmployees || allEmployees.length === 0) return;

    const owner = allEmployees.find((emp) => emp.employee_id === ownerId);
    if (!owner) return;

    setFormData((prev) => {
      if (prev.sts_contact && prev.sts_contact.trim() !== "") return prev;
      return {
        ...prev,
        sts_owner: owner.name || prev.sts_owner,
        sts_contact: owner.phone_number || prev.sts_contact,
      };
    });
  }, [formData.sts_owner_id, allEmployees]);

  const validateForm = () => {
    const fieldLabels = {
      company_name: "Company Name",
      project_name: "Project Name",
      project_poc_name: "Project POC Name",
      project_poc_contact: "Project POC Contact",
      company_gst: "Company GST",
      company_pan: "Company PAN",
      company_address: "Company Address",
      country: "Country",
      state: "State",
      project_category: "Project Category",
      start_date: "Start Date",
      end_date: "End Date",
      service_mode: "Mode of Service",
      service_location: "Service Location",
      project_status: "Project Status",
      payment_type: "Payment Type",
    };

    const requiredKeys = [
      "company_name",
      "project_name",
      "project_poc_name",
      "project_poc_contact",
      "company_gst",
      "company_pan",
      "company_address",
      "country",
      "state",
      "project_category",
      "start_date",
      "end_date",
      "service_mode",
      "service_location",
      "project_status",
      "payment_type",
    ];

    for (const key of requiredKeys) {
      const val = formData[key];
      if (key === "project_category") {
        if (!Array.isArray(val) || val.length === 0) {
          return `${fieldLabels[key]} is required.`;
        }
      } else if (
        val === undefined ||
        val === null ||
        (typeof val === "string" && val.trim() === "")
      ) {
        return `${fieldLabels[key]} is required.`;
      }
    }

    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end < start) {
        return "End Date cannot be earlier than Start Date.";
      }
    }

    const poc = (formData.project_poc_contact || "").toString().trim();
    if (poc && poc.length < 7) {
      return "Project POC Contact looks too short.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (isSubmitting) return; // 🔒 prevent double click

    const validationError = validateForm();
    if (validationError) {
      showAlert(validationError, "Validation Error");
      return;
    }

    setIsSubmitting(true); // 🔒 lock button

    const url = projectData
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${projectData.id}`
      : `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects`;

    const method = projectData ? "PUT" : "POST";
    const submissionData = new FormData();

    for (const key in formData) {
      if (key !== "attachment_url") {
        let value = formData[key];
        if (typeof value === "object") {
          try {
            value = JSON.stringify(value);
          } catch {}
        }
        submissionData.append(key, value);
      }
    }

    if (newAttachments?.length > 0) {
      newAttachments.forEach((file) => {
        submissionData.append("attachment_url", file);
      });
    }

    try {
      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          ...(orgId ? { "x-org-id": orgId } : {}),
        },
        body: submissionData,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => null);
        throw new Error(text || "Failed to save project");
      }

      if (onProjectAdded) onProjectAdded();
      if (onSuccess) onSuccess();

      showAlert("Project saved successfully!", "Success");

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (error) {
      console.error("Error:", error);
      showAlert(
        error.message || "An error occurred while saving the project.",
        "Error",
      );
    } finally {
      setIsSubmitting(false); // 🔓 unlock button (success or error)
    }
  };

  const valuesForSteps = {
    stepOne: {
      formData,
      countries,
      states,
      categories,
      dropdownRef,
      dropdownOpen,
      toggleDropdown,
      handleCategoryChange,
      handleChange,
      formatDate,
      selectedFiles,
      handleFileUpload,
      openAttachment,
      editable: editableFromRole[1],
    },
    stepTwo: {
      stsOwners,
      filteredEmployees,
      filterType,
      searchQuery,
      setSearchQuery,
      handleFilterChange,
      handleDoubleClick,
      handleDepartmentDoubleClick,
      selectedEmployees,
      handleRemoveEmployee,
      points,
      handleInputChange,
      handleKeyDown,
      editable: editableFromRole[2],
      handleStsOwnerChange,
      handleChange,
      formData,
    },
    stepThree: {
      formData,
      addMilestone,
      removeMilestone,
      handleMilestoneChange,
      stsOwners,
      getStatusBgColor,
      editable: editableFromRole[3],
    },
    stepFour: {
      formData,
      getStatusBgColor,
      getFinanceStatusColor,
      handleFinanceChange,
      handleTopLevelFinanceChange,
      handleStatusChange,
      formatDate,
      downloadAllAttachments,
      projectData,
      editable: editableFromRole[4],
      onMonthlyFixedAmountChange: (newAmount, newDescription) => {
        setFormData((prev) => ({
          ...prev,
          monthly_fixed_amount: newAmount,
          service_description: newDescription,
        }));
      },
      handleFinancialDetailsChange: (newRows) => {
        setFormData((prev) => ({ ...prev, financialDetails: newRows }));
      },
    },
  };

  return {
    step,
    setStep,
    adjustedSteps,
    currentIndex,
    progressPercent,
    lineLeft,
    totalLineWidth,
    allowedSteps,
    editable: editableFromRole,
    formData,
    setFormData,
    handleSubmit,
    isSubmitting,
    prevStep,
    nextStep,
    alertModal,
    closeAlert,
    showAlert,
    selectedFiles,
    downloadAllAttachments,
    projectRole,
    valuesForSteps,
    handleTopLevelFinanceChange,
    handleFinanceChange,
    onMonthlyFixedAmountChange: (newAmount, newDescription) => {
      setFormData((prev) => ({
        ...prev,
        monthly_fixed_amount: newAmount,
        service_description: newDescription,
      }));
    },
    handleFinancialDetailsChange: (newRows) => {
      setFormData((prev) => ({ ...prev, financialDetails: newRows }));
    },
  };
}
