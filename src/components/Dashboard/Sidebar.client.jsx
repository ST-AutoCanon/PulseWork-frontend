"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import * as MdIcons from "react-icons/md";
import { useAuth } from "../../context/AuthProvider.client";
import "./Sidebar.css";

import EmployeeDetails from "../EmployeeDetails/EmployeeDetails.client";
import AddDepartment from "../AddDepartment/AddDepartment.client";
import AdminQuery from "../EmployeeQueries/AdminQuery.client";
import EmployeeQuery from "../EmployeeQueries/EmployeeQuery.client";
import UpdateProject from "../UpdateProjects/ProjectsDashboard.client";
import LeaveQueries from "../LeaveQueries/Admin.client";
import LeaveRequest from "../LeaveQueries/LeaveRequest.client";
import Profile from "../Profile/Profile.client";
import MyDashboard from "../MyDashboard/MyDashboard.client";
import MyEmpDashboard from "../MyEmpDashboard/MyEmpDashboard.client";
import PayrollSummary from "../PayrollSummary/PayrollSummary.client";
import TemplateBuilder from "../TemplateBuilder/TemplateBuilder.client";

import Reimbursement from "../Reimbursement/Reimbursement.client";
import RbAdmin from "../Reimbursement/RbAdmin.client";
import RbTeamLead from "../Reimbursement/RbTeamLead.client";
import Assets from "../Assets/Assets.client";
import Vendors from "../vendors/vendors.client";
import Chat from "../Chat/ChatPage.client";
import CreateOrganization from "../CreateOrganization/CreateOrganization.client";
import TaskManagement from "../TaskManagement/TaskManagement.client";
import TaskManagementEmployee from "../TaskManagementEmployee/EmpTaskManagement.client";
import TaskManagementAdmin from "../TaskManagementAdmin/TaskManagementAdmin.client";
import Report from "../Report/ReportPanel.client";
import LetterHead from "../letterHead/letterhead.client";
import CreateCompensation from "../Compensation/createCompensation.client";
import AssignCompensation from "../Compensation/assignCompensation.client";
import SalaryBreakupMain from "../Compensation/SalaryBreakupMain.client";
import SalaryDetails from "../Compensation/SalaryDetails/SalaryDetails.client";
import EmployeeLogin from "../EmployeeLogin/EmployeeLogin.client";
import Salary_Statement from "../Salary_statement/Salary_Statement.client";
import GeneratePayslip from "../generate_payslip/GeneratePayslip.client";
import OvertimeDetails from "../Compensation/OvertimeDetails";
import OvertimeSupervisor from "../Compensation/overtimeSupervisor";
import ExitFlow from "../ExitFlow/ExitFlow.client";


const Sidebar = ({ setActiveContent }) => {
  const { user, hydrated } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [activeItem, setActiveItem] = useState("/dashboard");
  const [activeSubItem, setActiveSubItem] = useState("");
  const [activeNav, setActiveNav] = useState("/dashboard");
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [showCompensationDropdown, setShowCompensationDropdown] =
    useState(false);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [showSalaryDropdown, setShowSalaryDropdown] = useState(false);

  const [hasSubordinates, setHasSubordinates] = useState(false);
  const [loadingSubordinates, setLoadingSubordinates] = useState(true);

  const cancelRef = useRef(false);
const DROPDOWN_PATHS = {
  "/compensation": "compensation",
  "/TaskManagement": "task",
  "/Salary_Statement": "salary",
};

const toggleDropdown = (type) => {
  setShowCompensationDropdown(type === "compensation");
  setShowTaskDropdown(type === "task");
  setShowSalaryDropdown(type === "salary");
};

  const defaultMenuItems = useMemo(
    () => ({
      Admin: [
        { label: "Dashboard", path: "/dashboard", icon: "MdOutlineDashboard" },
      ],
      Manager: [
        { label: "Dashboard", path: "/dashboard", icon: "MdOutlineDashboard" },
      ],
      Employee: [
        { label: "Dashboard", path: "/dashboard", icon: "MdOutlineDashboard" },
      ],
      SuperAdmin: [
        {
          label: "Create Organization",
          path: "/CreateOrganization",
          icon: "MdOutlineBusiness",
        },
      ],
    }),
    [],
  );

  const pathToComponent = useMemo(
    () => ({
      "/dashboard": (role) =>
        role === "Admin" ? <MyDashboard /> : <MyEmpDashboard />,
      "/employeeDetails": () => <EmployeeDetails />,
      "/addDepartment": () => <AddDepartment />,
      "/updateProjects": () => <UpdateProject />,
      "/CreateOrganization": () => <CreateOrganization />,
      "/leaveQueries": (role) =>
        role === "Admin" ? <LeaveQueries /> : <LeaveRequest />,
      "/payrollSummary": () => <PayrollSummary />,
      "/messenger": () => <Chat />,
      "/EmployeeLogin": () => <EmployeeLogin />,
      "/reimbursement": (role) => {
        if (role === "Admin") return <RbAdmin />;
        if (role === "Manager") return <RbTeamLead />;
        return <Reimbursement />;
      },
      "/employeeQueries": () => <AdminQuery />,
      "/TemplateBuilder": () => <TemplateBuilder />,
      "/letterHead": () => <LetterHead />,
      "/assets": () => <Assets />,
      "/vendors": () => <Vendors />,
      "/Overtime": () => <OvertimeDetails />,
      "/OvertimeDetails": () => <OvertimeSupervisor />,
      "/OvertimeSummary": () => <OvertimeSupervisor />,
      "/report": () => <Report />,
      "/ExitFlow": () => <ExitFlow />,
      "/TaskManagement": (role, sub) => {
        if (sub === "admin" && role === "Admin") return <TaskManagementAdmin />;
        if (sub === "team") return <TaskManagement />;
        return <TaskManagementEmployee />;
      },
    }),
    [],
  );

  const normalizeMenu = (items = []) =>
    (items || []).map((it) => ({
      label: it.label ?? it.name ?? "Unnamed",
      path: it.path ?? it.route ?? "/dashboard",
      icon: it.icon ?? it.iconName ?? "MdOutlineDashboard",
    }));

  useEffect(() => {
    const onAppNavigate = (e) => {
      try {
        const path = e?.detail?.path;
        if (!path) return;

        const resolver = pathToComponent[path];
        if (resolver) {
          const role = user?.role ?? "Employee";
          const content = resolver.length > 0 ? resolver(role) : resolver();
          setActiveItem(path);
          setActiveNav(path);
          setActiveContent(content);
          setShowMobileMenu(false);
          return;
        }

        console.warn("Sidebar: no resolver for path:", path);
        if (typeof window !== "undefined") window.location.href = path;
      } catch (err) {
        console.error("app:navigate handler error:", err);
      }
    };

    window.addEventListener("app:navigate", onAppNavigate, { passive: true });

    return () => {
      window.removeEventListener("app:navigate", onAppNavigate);
    };
  }, [pathToComponent, user, setActiveContent]);

  useEffect(() => {
    if (
      !hydrated ||
      !user ||
      user.role === "Admin" ||
      user.role === "SuperAdmin"
    ) {
      setHasSubordinates(false);
      setLoadingSubordinates(false);
      return;
    }

    const checkSubordinates = async () => {
      try {
        setLoadingSubordinates(true);
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
        const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

        if (!BACKEND_URL) {
          setHasSubordinates(false);
          setLoadingSubordinates(false);
          return;
        }

        const employeeId = user.employeeId || user.id;
        const orgId = user.orgId || user.organizationId || user.org_id;

        if (!employeeId || !orgId) {
          console.warn("Missing employeeId or orgId in user context");
          setHasSubordinates(false);
          setLoadingSubordinates(false);
          return;
        }

        const headers = {
          "x-api-key": API_KEY,
          "x-employee-id": employeeId,
          "x-org-id": orgId,
        };

        const resp = await fetch(`${BACKEND_URL}/api/subordinate/status`, {
          method: "GET",
          credentials: "include",
          headers,
        });

        const data = await resp.json();
        setHasSubordinates(data.success && data.hasSubordinates === true);
      } catch (err) {
        console.error("Error checking subordinates:", err);
        setHasSubordinates(false);
      } finally {
        setLoadingSubordinates(false);
      }
    };

    checkSubordinates();
  }, [user, hydrated]);

  const handleMenuClick = (item, subOption = null) => {
    const role = user?.role ?? "Employee";

    setActiveItem(item.path);
    setActiveSubItem(subOption || "");

    const hasDropdown =
      item.path === "/compensation" ||
      item.path === "/TaskManagement" ||
      item.path === "/Salary_Statement";

    if (hasDropdown && !subOption) {
      if (item.path === "/compensation") {
        setShowCompensationDropdown((prev) => !prev);
        setShowTaskDropdown(false);
        setShowSalaryDropdown(false);
      } else if (item.path === "/TaskManagement") {
        setShowTaskDropdown((prev) => !prev);
        setShowCompensationDropdown(false);
        setShowSalaryDropdown(false);
      } else if (item.path === "/Salary_Statement") {
        setShowSalaryDropdown((prev) => !prev);
        setShowCompensationDropdown(false);
        setShowTaskDropdown(false);
      }
      return;
    }

    setShowMobileMenu(false);

    let content = null;

    if (item.path === "/compensation" && subOption) {
      switch (subOption) {
        case "create":
          content = <CreateCompensation />;
          setActiveNav("/compensation/create");
          break;
        case "assign":
          content = <AssignCompensation />;
          setActiveNav("/compensation/assign");
          break;
        case "breakup":
          content = <SalaryBreakupMain />;
          setActiveNav("/compensation/breakup");
          break;
        case "details":
          content = <SalaryDetails />;
          setActiveNav("/compensation/details");
          break;
      }
      setShowCompensationDropdown(true);
    } else if (item.path === "/TaskManagement") {
      content = pathToComponent["/TaskManagement"](role, subOption);
      setActiveNav(`/TaskManagement/${subOption || "employee"}`);
      setShowTaskDropdown(true);
    } else if (item.path === "/Salary_Statement" && subOption) {
      content =
        subOption === "statement" ? <Salary_Statement /> : <GeneratePayslip />;
      setActiveNav(`/Salary_Statement/${subOption}`);
      setShowSalaryDropdown(true);
    } else {
      const resolver = pathToComponent[item.path];
      console.log("Clicking item:", item.path, "Resolver exists:", !!resolver);
      if (resolver) {
        content = resolver.length > 0 ? resolver(role) : resolver();
        console.log("Content resolved:", !!content);
      } else {
        console.warn("No resolver found for path:", item.path);
      }
      setShowCompensationDropdown(false);
      setShowTaskDropdown(false);
      setShowSalaryDropdown(false);
    }

    if (content) {
      setActiveNav(item.path);
      setActiveContent(content);
    } else {
      console.warn("No content to display for path:", item.path);
    }
  };

//   const handleMenuClick = (item, subOption = null) => {
//   const role = user?.role ?? "Employee";
//   const { path } = item;

//   setActiveItem(path);
//   setActiveSubItem(subOption || "");

//   const dropdownType = DROPDOWN_PATHS[path];

//   // Only toggle dropdown
//   if (dropdownType && !subOption) {
//     toggleDropdown(dropdownType);
//     return;
//   }

//   setShowMobileMenu(false);

//   let content = null;

//   // Compensation
//   if (path === "/compensation" && subOption) {
//     const compensationMap = {
//       create: [<CreateCompensation />, "/compensation/create"],
//       assign: [<AssignCompensation />, "/compensation/assign"],
//       breakup: [<SalaryBreakupMain />, "/compensation/breakup"],
//       details: [<SalaryDetails />, "/compensation/details"],
//     };

//     const result = compensationMap[subOption];
//     if (result) {
//       content = result[0];
//       setActiveNav(result[1]);
//     }

//     toggleDropdown("compensation");
//   }

//   // Task Management
//   else if (path === "/TaskManagement") {
//     content = pathToComponent["/TaskManagement"](role, subOption);
//     setActiveNav(`/TaskManagement/${subOption || "employee"}`);
//     toggleDropdown("task");
//   }

//   // Salary Statement
//   else if (path === "/Salary_Statement" && subOption) {
//     content =
//       subOption === "statement"
//         ? <Salary_Statement />
//         : <GeneratePayslip />;

//     setActiveNav(`/Salary_Statement/${subOption}`);
//     toggleDropdown("salary");
//   }

//   // Default
//   else {
//     const resolver = pathToComponent[path];
//     if (resolver) {
//       content = resolver.length > 0
//         ? resolver(role)
//         : resolver();
//     }
//     toggleDropdown(null);
//   }

//   if (content) {
//     setActiveNav(path);
//     setActiveContent(content);
//   }
// };

  useEffect(() => {
    if (!hydrated) return;

    const role = user?.role ?? "Employee";

    if (Array.isArray(user?.sidebarMenu) && user.sidebarMenu.length > 0) {
      setMenuItems(normalizeMenu(user.sidebarMenu));
    } else {
      (async () => {
        try {
          const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
          const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
          if (!BACKEND_URL) {
            setMenuItems(defaultMenuItems[role] || defaultMenuItems.Employee);
            return;
          }

          const meId = user?.employeeId ?? user?.id ?? null;
          const headers = meId
            ? { "x-api-key": API_KEY, "x-employee-id": meId }
            : { "x-api-key": API_KEY };

          const resp = await fetch(`${BACKEND_URL}/sidebar`, {
            method: "GET",
            credentials: "include",
            headers,
          });

          const json = await resp.json().catch(() => null);
          const payload = (json && (json.message ?? json)) || [];

          if (cancelRef.current) return;

          if (Array.isArray(payload) && payload.length > 0) {
            setMenuItems(normalizeMenu(payload));
          } else {
            setMenuItems(defaultMenuItems[role] || defaultMenuItems.Employee);
          }
        } catch (err) {
          console.error("Error fetching sidebar:", err);
          if (!cancelRef.current) {
            setMenuItems(defaultMenuItems[role] || defaultMenuItems.Employee);
          }
        }
      })();
    }

    const defaultPath =
      role === "SuperAdmin" ? "/CreateOrganization" : "/dashboard";
    const resolver = pathToComponent[defaultPath] || (() => <MyEmpDashboard />);
    const initialContent = resolver.length > 0 ? resolver(role) : resolver();
    setActiveContent(initialContent);
    setActiveItem(defaultPath);
    setActiveNav(defaultPath);
  }, [user, hydrated, defaultMenuItems, pathToComponent, setActiveContent]);

  const resolveIcon = (iconName) => {
    if (!iconName) return MdIcons.MdOutlineDashboard;
    return MdIcons[iconName] || MdIcons.MdOutlineDashboard;
  };

  const renderMenuList = () => (
    <ul className="menu-list">
      {menuItems.map((item, index) => {
        const Icon = resolveIcon(item.icon);
        const isMainActive = activeItem === item.path;

        const hasDropdown =
          item.path === "/compensation" ||
          item.path === "/TaskManagement" ||
          item.path === "/Salary_Statement";

        return (
          <li key={index} className="menu-item">
            <div
              className={`menu-link ${isMainActive ? "active" : ""}`}
              onClick={() => handleMenuClick(item)}
            >
              <Icon size={22} />
              <span>{item.label}</span>
              {hasDropdown && (
                <span className="arrow">
                  {(item.path === "/compensation" &&
                    showCompensationDropdown) ||
                  (item.path === "/TaskManagement" && showTaskDropdown) ||
                  (item.path === "/Salary_Statement" && showSalaryDropdown) ? (
                    <MdIcons.MdKeyboardArrowDown />
                  ) : (
                    <MdIcons.MdKeyboardArrowRight />
                  )}
                </span>
              )}
            </div>

            {item.path === "/compensation" && showCompensationDropdown && (
              <ul className="desktop-submenu">
                <li
                  className={activeSubItem === "create" ? "active" : ""}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuClick(item, "create");
                  }}
                >
                  <MdIcons.MdOutlineAddCircleOutline size={20} />{" "}
                  <span>Create Compensation</span>
                </li>
                <li
                  className={activeSubItem === "assign" ? "active" : ""}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuClick(item, "assign");
                  }}
                >
                  <MdIcons.MdOutlineAssignmentInd size={20} />{" "}
                  <span>Assign Compensation</span>
                </li>
                <li
                  className={activeSubItem === "breakup" ? "active" : ""}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuClick(item, "breakup");
                  }}
                >
                  <MdIcons.MdOutlineAccountBalance size={20} />{" "}
                  <span>Salary Breakup</span>
                </li>
                <li
                  className={activeSubItem === "details" ? "active" : ""}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuClick(item, "details");
                  }}
                >
                  <MdIcons.MdOutlineTableChart size={20} />{" "}
                  <span>Salary Details</span>
                </li>
              </ul>
            )}

            {item.path === "/TaskManagement" && showTaskDropdown && (
              <ul className="desktop-submenu">
                {user?.role === "Admin" && (
                  <li
                    className={activeSubItem === "admin" ? "active" : ""}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuClick(item, "admin");
                    }}
                  >
                    <MdIcons.MdOutlineAdminPanelSettings size={20} />{" "}
                    <span>Admin Task Management</span>
                  </li>
                )}

                {!loadingSubordinates && hasSubordinates && (
                  <li
                    className={activeSubItem === "team" ? "active" : ""}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuClick(item, "team");
                    }}
                  >
                    <MdIcons.MdPeopleAlt size={20} /> <span>Team Tasks</span>
                  </li>
                )}

                {user?.role !== "Admin" && (
                  <li
                    className={
                      activeSubItem === "employee" || !activeSubItem
                        ? "active"
                        : ""
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuClick(item, "employee");
                    }}
                  >
                    <MdIcons.MdPerson size={20} /> <span>My Tasks</span>
                  </li>
                )}
              </ul>
            )}

            {item.path === "/Salary_Statement" && showSalaryDropdown && (
              <ul className="desktop-submenu">
                <li
                  className={activeSubItem === "statement" ? "active" : ""}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuClick(item, "statement");
                  }}
                >
                  <MdIcons.MdOutlineReceiptLong size={20} />{" "}
                  <span>View Salary Statement</span>
                </li>
                <li
                  className={activeSubItem === "payslip" ? "active" : ""}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuClick(item, "payslip");
                  }}
                >
                  <MdIcons.MdOutlineDescription size={20} />{" "}
                  <span>Generate Payslip</span>
                </li>
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <div className="sidebar">
        {user?.role !== "Admin" && user?.role !== "SuperAdmin" && (
          <div className="profile-section">
            <a
              href="#"
              className="view-profile-link"
              onClick={(e) => {
                e.preventDefault();
                setShowProfile(true);
              }}
            >
              <span>View Profile</span>
            </a>
          </div>
        )}

        {renderMenuList()}
      </div>

      <div className="bottom-nav">
        {menuItems.slice(0, 5).map((item, index) => {
          const Icon = resolveIcon(item.icon);
          const isActive = activeNav.startsWith(item.path);

          return (
            <button
              key={index}
              className={isActive ? "active" : ""}
              onClick={() => handleMenuClick(item)}
            >
              <Icon size={26} />
            </button>
          );
        })}

        <button onClick={() => setShowMobileMenu(true)}>
          <MdIcons.MdMenu size={26} />
        </button>
      </div>

      {showMobileMenu && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setShowMobileMenu(false)}
        >
          <div className="mobile-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-header">
              <button
                className="mobile-close"
                onClick={() => setShowMobileMenu(false)}
              >
                <MdIcons.MdClose size={28} />
              </button>
            </div>

            {user?.role !== "Admin" && user?.role !== "SuperAdmin" && (
              <div className="profile-section mobile-profile">
                <a
                  href="#"
                  className="view-profile-link"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowProfile(true);
                    setShowMobileMenu(false);
                  }}
                >
                  <MdIcons.MdPerson size={22} />
                  <span>View Profile</span>
                </a>
              </div>
            )}

            {renderMenuList()}
          </div>
        </div>
      )}

      {showProfile && (
        <Profile
          employeeId={user?.employeeId}
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
