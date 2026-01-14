"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider.client";
import "./assignCompensation.css";
import Modal from "../Modal/Modal.client";

const AssignCompensation = () => {
  const { user } = useAuth();

  const meId = React.useMemo(() => {
    return user?.employeeId ?? user?.id ?? user?.employee_id ?? null;
  }, [user]);

  const orgId = React.useMemo(() => {
    return user?.orgId ?? user?.raw?.org_id ?? null;
  }, [user]);

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [employeeList, setEmployeeList] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [departmentList, setDepartmentList] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [compensationList, setCompensationList] = useState([]);
  const [filteredCompensations, setFilteredCompensations] = useState([]);
  const [compensationSearchTerm, setCompensationSearchTerm] = useState("");
  const [selectedCompensation, setSelectedCompensation] = useState("");
  const [employeesByDepartment, setEmployeesByDepartment] = useState({});
  const [originalEmployeesByDepartment, setOriginalEmployeesByDepartment] =
    useState({});
  const [selectionType, setSelectionType] = useState("employee");
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const employeeFetchedRef = useRef(false);
  const departmentFetchedRef = useRef(false);
  const compensationFetchedRef = useRef(false);

  if (!BACKEND_URL) {
    console.error(
      "BACKEND_URL is undefined - check .env.local and restart dev server"
    );
    useEffect(() => {
      showAlert(
        "Backend URL not configured. Check .env.local and restart server.",
        "Config Error"
      );
    }, []);
  }

  const ENDPOINTS = {
    employeesNames: `${BACKEND_URL}/api/compensations/employees/names`,
    departmentsNames: `${BACKEND_URL}/api/compensations/departments/names`,
    compensationsList: `${BACKEND_URL}/api/compensations/list`,
    employeesByDepartment: (deptId) =>
      `${BACKEND_URL}/api/compensations/employees/by-department/${deptId}`,
    assignedCompensations: `${BACKEND_URL}/api/compensation/assigned`,
    assignCompensation: `${BACKEND_URL}/api/compensation/assign`,
  };

  const headers = {
    "x-api-key": API_KEY,
    "x-employee-id": meId,
    ...(orgId ? { "x-org-id": orgId } : {}),
  };

  const showAlert = (message, title = "Alert") => {
    setAlertModal({ isVisible: true, title, message });
  };

  const closeAlert = () => {
    setAlertModal({ isVisible: false, title: "", message: "" });
  };

  const fetchEmployeeDetails = async () => {
    if (!BACKEND_URL || !meId) {
      showAlert("Please login to continue");
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get(ENDPOINTS.employeesNames, {
        withCredentials: true,
        headers,
      });

      if (response.data.success) {
        setEmployeeList(response.data.data || []);
        setFilteredEmployees(response.data.data || []);
      } else {
        throw new Error(response.data.message || "Failed to fetch employees");
      }
    } catch (error) {
      console.error("Error fetching employee details:", error);
      showAlert(`Failed to fetch employees: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartmentDetails = async () => {
    if (!BACKEND_URL || !meId) {
      showAlert("Please login to continue");
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get(ENDPOINTS.departmentsNames, {
        withCredentials: true,
        headers,
      });
      if (response.data.success) {
        setDepartmentList(response.data.data || []);
        setFilteredDepartments(response.data.data || []);
      } else {
        throw new Error(response.data.message || "Failed to fetch departments");
      }
    } catch (error) {
      console.error("Error fetching department details:", error);
      showAlert(
        `Failed to fetch departments: ${error.message || "Network error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompensations = async () => {
    if (!BACKEND_URL || !meId || !orgId) {
      showAlert("Please login to continue");
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get(
        `${ENDPOINTS.compensationsList}?org_id=${orgId}`,
        { withCredentials: true, headers }
      );
      if (response.data.success) {
        const validCompensations = Array.isArray(response.data.data)
          ? response.data.data.filter(
              (comp) =>
                comp &&
                typeof comp.compensation_plan_name === "string" &&
                comp.id &&
                !isNaN(parseInt(comp.id))
            )
          : [];
        setCompensationList(validCompensations);
        setFilteredCompensations(validCompensations);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch compensations"
        );
      }
    } catch (error) {
      console.error("Error fetching compensations:", error);
      showAlert(
        `Failed to fetch compensations: ${error.message || "Network error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!meId) return;

    if (!employeeFetchedRef.current) {
      employeeFetchedRef.current = true;
      fetchEmployeeDetails();
    }

    if (!departmentFetchedRef.current) {
      departmentFetchedRef.current = true;
      fetchDepartmentDetails();
    }

    if (!compensationFetchedRef.current) {
      compensationFetchedRef.current = true;
      fetchCompensations();
    }
  }, [meId]);

  useEffect(() => {
    const filtered = employeeList.filter(
      (emp) =>
        emp &&
        typeof emp.full_name === "string" &&
        emp.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(filtered);
  }, [searchTerm, employeeList]);

  useEffect(() => {
    const filtered = departmentList.filter(
      (dept) =>
        dept &&
        typeof dept.name === "string" &&
        dept.name.toLowerCase().includes(departmentSearchTerm.toLowerCase())
    );
    setFilteredDepartments(filtered);
  }, [departmentSearchTerm, departmentList]);

  useEffect(() => {
    const filtered = compensationList.filter(
      (comp) =>
        comp &&
        typeof comp.compensation_plan_name === "string" &&
        comp.compensation_plan_name
          .toLowerCase()
          .includes(compensationSearchTerm.toLowerCase())
    );
    setFilteredCompensations(filtered);
  }, [compensationSearchTerm, compensationList]);

  const handleEmployeeSelect = (e) => {
    setSelectedEmployee(e.target.value);
  };

  const handleDepartmentSelect = (e) => {
    setSelectedDepartment(e.target.value);
  };

  const handleCompensationSelect = (e) => {
    setSelectedCompensation(e.target.value);
  };

  const handleEmployeeDoubleClick = () => {
    if (selectedEmployee && selectionType === "employee") {
      const employee = employeeList.find(
        (emp) => emp.employee_id === selectedEmployee
      );
      if (
        employee &&
        !selectedEmployees.some((e) => e.employee_id === employee.employee_id)
      ) {
        setSelectedEmployees([employee, ...selectedEmployees]);
        setSelectedEmployee("");
      } else if (!employee) {
        showAlert("Please select a valid employee.");
      } else {
        showAlert("Employee already selected.");
      }
    } else {
      showAlert(
        "Please select an employee and ensure 'Employee' option is chosen."
      );
    }
  };

  const handleDepartmentDoubleClick = async () => {
    if (!selectedDepartment || selectionType !== "department") {
      showAlert(
        "Please select a department and ensure 'Department' option is chosen."
      );
      return;
    }

    const department = departmentList.find(
      (dept) => String(dept.id) === String(selectedDepartment)
    );
    if (!department) {
      showAlert("Please select a valid department.");
      return;
    }
    if (
      selectedDepartments.some((d) => String(d.id) === String(department.id))
    ) {
      showAlert("Department already selected.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get(
        ENDPOINTS.employeesByDepartment(selectedDepartment),
        { withCredentials: true, headers }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch employees for department"
        );
      }

      const employees = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      if (employees.length === 0) {
        showAlert("No employees found in this department.");
        return;
      }

      setSelectedDepartments([department, ...selectedDepartments]);
      setEmployeesByDepartment((prev) => ({
        ...prev,
        [department.id]: employees,
      }));
      setOriginalEmployeesByDepartment((prev) => ({
        ...prev,
        [department.id]: [...employees],
      }));
      setSelectedDepartment("");
    } catch (error) {
      console.error("Error fetching employees:", error);
      showAlert(
        `Error fetching employees for department: ${
          error.message || "Network error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompensationDoubleClick = () => {
    if (selectedCompensation) {
      const compensation = compensationList.find(
        (comp) => String(comp.id) === selectedCompensation
      );
      if (compensation && !isNaN(parseInt(selectedCompensation))) {
        setSelectedCompensation(String(compensation.id));
        showAlert(
          "Compensation plan selected. Only one plan can be assigned at a time."
        );
      } else {
        showAlert("Please select a valid compensation plan with a numeric ID.");
      }
    } else {
      showAlert("Please select a compensation plan before double-clicking.");
    }
  };

  const removeEmployee = (employeeId) => {
    setSelectedEmployees(
      selectedEmployees.filter((emp) => emp.employee_id !== employeeId)
    );
  };

  const removeDepartment = (departmentId) => {
    setSelectedDepartments(
      selectedDepartments.filter((dept) => dept.id !== departmentId)
    );
    setEmployeesByDepartment((prev) => {
      const updated = { ...prev };
      delete updated[departmentId];
      return updated;
    });
    setOriginalEmployeesByDepartment((prev) => {
      const updated = { ...prev };
      delete updated[departmentId];
      return updated;
    });
  };

  const removeEmployeeFromDepartment = (departmentId, employeeId) => {
    setEmployeesByDepartment((prev) => {
      const updated = { ...prev };
      updated[departmentId] = updated[departmentId].filter(
        (emp) => emp.employee_id !== employeeId
      );
      if (updated[departmentId].length === 0) {
        setSelectedDepartments(
          selectedDepartments.filter((dept) => dept.id !== departmentId)
        );
        delete updated[departmentId];
        setOriginalEmployeesByDepartment((origPrev) => {
          const origUpdated = { ...origPrev };
          delete origUpdated[departmentId];
          return origUpdated;
        });
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!selectedCompensation) {
      showAlert("Please select a compensation plan.");
      return;
    }

    const compensation = compensationList.find(
      (comp) => String(comp.id) === selectedCompensation
    );
    if (!compensation) {
      showAlert(
        "Invalid compensation plan selected. Please select a valid plan."
      );
      return;
    }

    if (selectedEmployees.length === 0 && selectedDepartments.length === 0) {
      showAlert("Please select at least one employee or department.");
      return;
    }

    try {
      setIsLoading(true);

      const allEmployees = [
        ...selectedEmployees,
        ...Object.values(employeesByDepartment || {}).flat(),
      ].filter(Boolean);

      const fullDepartmentIds = [];
      const partialEmployeeIds = [];

      selectedDepartments.forEach((dept) => {
        const currentEmps = employeesByDepartment[dept.id] || [];
        const originalEmps = originalEmployeesByDepartment[dept.id] || [];
        if (currentEmps.length === originalEmps.length) {
          fullDepartmentIds.push(dept.id);
        } else {
          partialEmployeeIds.push(...currentEmps.map((emp) => emp.employee_id));
        }
      });

      const employeeIdsForPayload = [
        ...allEmployees.map((emp) => emp.employee_id),
        ...partialEmployeeIds,
      ];

      const payload = {
        compensationId: compensation.id,
        compensationPlanName: compensation.compensation_plan_name,
        employeeId: employeeIdsForPayload,
        departmentIds: fullDepartmentIds,
        assignedBy: meId,
      };

      const assignResponse = await axios.post(
        ENDPOINTS.assignCompensation,
        payload,
        { withCredentials: true, headers }
      );

      if (assignResponse.data.success) {
        showAlert("Compensation assigned successfully!", "Success");
        setSelectedEmployees([]);
        setSelectedDepartments([]);
        setSelectedCompensation("");
        setSelectedEmployee("");
        setSelectedDepartment("");
        setEmployeesByDepartment({});
        setOriginalEmployeesByDepartment({});
      } else {
        throw new Error(assignResponse.data.error || "Assignment unsuccessful");
      }
    } catch (error) {
      console.error(
        "Error assigning compensation:",
        error.response?.data || error.message
      );
      showAlert(
        `Failed to assign compensation: ${
          error.response?.data?.error || error.message || "Network error"
        }`,
        "Error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ac-container">
      <div className="ac-header">
        <h1 className="ac-header-title">Assign Compensation</h1>
      </div>
      <div className="ac-content">
        {isLoading && <div className="ac-loading">Loading...</div>}
        <div className="ac-section ac-compensation-section">
          <h2 className="ac-section-title">Select Compensation Plan</h2>
          <div className="ac-compensation-container">
            <input
              type="text"
              placeholder="Search compensation..."
              className="ac-compensation-search-input"
              value={compensationSearchTerm}
              onChange={(e) => setCompensationSearchTerm(e.target.value)}
              disabled={isLoading}
            />
            <select
              className="ac-compensation-dropdown"
              id="compensation-select"
              value={selectedCompensation}
              onChange={handleCompensationSelect}
              onDoubleClick={handleCompensationDoubleClick}
              size="5"
              disabled={isLoading}
            >
              <option value="" disabled>
                Select a compensation plan
              </option>
              {filteredCompensations.length > 0 ? (
                filteredCompensations.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.compensation_plan_name}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No compensation plans found
                </option>
              )}
            </select>
            <div className="ac-selected-compensations-container">
              <h3 className="ac-subsection-title">
                Selected Compensation Plan
              </h3>
              {selectedCompensation ? (
                <ul className="ac-selected-compensations-list">
                  <li className="ac-selected-compensation-item">
                    {
                      compensationList.find(
                        (comp) => String(comp.id) === selectedCompensation
                      )?.compensation_plan_name
                    }
                    <span
                      className="ac-compensation-remove-icon"
                      onClick={() => setSelectedCompensation("")}
                    >
                      ✕
                    </span>
                  </li>
                </ul>
              ) : (
                <p>No compensation plan selected</p>
              )}
            </div>
          </div>
        </div>
        <div className="ac-section ac-selection-type">
          <h2 className="ac-section-title">Select Assignment Type</h2>
          <div className="ac-selection-type-container">
            <label className="ac-selection-type-label">
              <input
                type="radio"
                name="selectionType"
                value="employee"
                checked={selectionType === "employee"}
                onChange={() => {
                  setSelectionType("employee");
                  setSelectedDepartments([]);
                  setSelectedDepartment("");
                  setEmployeesByDepartment({});
                  setOriginalEmployeesByDepartment({});
                }}
                disabled={isLoading}
              />
              Employees
            </label>
            <label className="ac-selection-type-label">
              <input
                type="radio"
                name="selectionType"
                value="department"
                checked={selectionType === "department"}
                onChange={() => {
                  setSelectionType("department");
                  setSelectedEmployees([]);
                  setSelectedEmployee("");
                }}
                disabled={isLoading}
              />
              Departments
            </label>
          </div>
        </div>
        {selectionType === "employee" && (
          <div className="ac-section ac-employee-section">
            <h2 className="ac-section-title">Select Employees</h2>
            <div className="ac-dropdown-container">
              <input
                type="text"
                placeholder="Search employee..."
                className="ac-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
              />
              <select
                className="ac-employee-dropdown"
                id="employee-select"
                value={selectedEmployee}
                onChange={handleEmployeeSelect}
                onDoubleClick={handleEmployeeDoubleClick}
                size="5"
                disabled={isLoading}
              >
                <option value="" disabled>
                  Select an employee
                </option>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.full_name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No employees found
                  </option>
                )}
              </select>
              <div className="ac-selected-employees-container">
                <h3 className="ac-subsection-title">Selected Employees</h3>
                {selectedEmployees.length > 0 ? (
                  <ul className="ac-selected-employees-list">
                    {selectedEmployees.map((emp) => (
                      <li
                        key={emp.employee_id}
                        className="ac-selected-employee-item"
                      >
                        {emp.full_name}
                        <span
                          className="ac-remove-icon"
                          onClick={() => removeEmployee(emp.employee_id)}
                        >
                          ✕
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No employees selected</p>
                )}
              </div>
            </div>
          </div>
        )}
        {selectionType === "department" && (
          <div className="ac-section ac-department-section">
            <h2 className="ac-section-title">Select Departments</h2>
            <div className="ac-department-container">
              <input
                type="text"
                placeholder="Search department..."
                className="ac-department-search-input"
                value={departmentSearchTerm}
                onChange={(e) => setDepartmentSearchTerm(e.target.value)}
                disabled={isLoading}
              />
              <select
                className="ac-department-dropdown"
                id="department-select"
                value={selectedDepartment}
                onChange={handleDepartmentSelect}
                onDoubleClick={handleDepartmentDoubleClick}
                size="5"
                disabled={isLoading}
              >
                <option value="" disabled>
                  Select a department
                </option>
                {filteredDepartments.length > 0 ? (
                  filteredDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No departments found
                  </option>
                )}
              </select>
              <div className="ac-selected-departments-container">
                <h3 className="ac-subsection-title">Selected Departments</h3>
                {selectedDepartments.length > 0 ? (
                  <ul className="ac-selected-departments-list">
                    {selectedDepartments.map((dept) => (
                      <li key={dept.id} className="ac-selected-department-item">
                        {dept.name}
                        <span
                          className="ac-department-remove-icon"
                          onClick={() => removeDepartment(dept.id)}
                        >
                          ✕
                        </span>
                        {employeesByDepartment[dept.id]?.length > 0 ? (
                          <ul className="ac-selected-employees-list">
                            {employeesByDepartment[dept.id].map((emp) => (
                              <li
                                key={emp.employee_id}
                                className="ac-selected-employee-item"
                              >
                                {emp.full_name}
                                <span
                                  className="ac-remove-icon"
                                  onClick={() =>
                                    removeEmployeeFromDepartment(
                                      dept.id,
                                      emp.employee_id
                                    )
                                  }
                                >
                                  ✕
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No employees in this department</p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No departments selected</p>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="ac-save-section">
          <button
            className="ac-save-button"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      <Modal
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        title={alertModal.title}
        buttons={[{ label: "OK", onClick: closeAlert }]}
      >
        <p>{alertModal.message}</p>
      </Modal>
    </div>
  );
};

export default AssignCompensation;
