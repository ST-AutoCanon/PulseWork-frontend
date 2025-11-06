"use client";

import React, { useEffect, useState, useMemo } from "react";
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
import SalaryStatementWrapper from "../Salary_statement/SalaryStatementWrapper.client";
import PayrollSummary from "../PayrollSummary/PayrollSummary.client";
import Reimbursement from "../Reimbursement/Reimbursement.client";
import RbAdmin from "../Reimbursement/RbAdmin.client";
import RbTeamLead from "../Reimbursement/RbTeamLead.client";
import Assets from "../Assets/Assets.client";
import Vendors from "../vendors/vendors.client";
import Chat from "../Chat/ChatPage.client";
import EmployeeLogin from "../EmployeeLogin/EmployeeLogin.client";
import CreateOrganization from "../CreateOrganization/CreateOrganization.client";
import TemplateBuilder from "../TemplateBuilder/TemplateBuilder.client";
import TaskManagement from "../TaskManagement/TaskManagement.client";
import TaskManagementEmployee from "../TaskManagementEmployee/EmpTaskManagement.client";
import TaskManagementAdmin from "../TaskManagementAdmin/TaskManagementAdmin.client";

const Sidebar = ({ setActiveContent }) => {
  const { user, hydrated } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [activeItem, setActiveItem] = useState("/dashboard");
  const [showProfile, setShowProfile] = useState(false);
  const [activeNav, setActiveNav] = useState("/dashboard");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // ✅ NEW STATE FOR SUPERVISOR CHOICE
  const [showTaskChoice, setShowTaskChoice] = useState(false);

  const defaultMenuItems = useMemo(
    () => ({
      Admin: [
        { label: "Dashboard", path: "/dashboard", icon: "MdOutlineDashboard" },
      ],
      Employee: [
        { label: "Dashboard", path: "/dashboard", icon: "MdOutlineDashboard" },
      ],
      Manager: [
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
    []
  );

  const customIconMap = {
    comp_icon: MdIcons.MdOutlineAttachMoney,
    "letter-head": MdIcons.MdDescription,
    FaLaptopMedical: MdIcons.MdLaptop,
    MdOutLineChat: MdIcons.MdChat,
  };

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
      "/Salary_Statement": () => <SalaryStatementWrapper />,
      "/payrollSummary": () => <PayrollSummary />,
      "/messenger": () => <Chat />,
      "/reimbursement": (role) => {
        if (role === "Admin") return <RbAdmin />;
        if (role === "Manager") return <RbTeamLead />;
        return <Reimbursement />;
      },
      "/employeeQueries": (role) =>
        role === "Admin" ? <AdminQuery /> : <EmployeeQuery />,
      "/TemplateBuilder": () => <TemplateBuilder />,
      "/assets": () => <Assets />,
      "/vendors": () => <Vendors />,
      "/EmployeeLogin": () => <EmployeeLogin />,

      // ✅ CHANGED ONLY THIS PART
      "/TaskManagement": (role) => {
        if (role === "Admin") return <TaskManagementAdmin />;

        if (role === "Supervisor") {
          setShowTaskChoice(true); // show selection
          return null; // prevent auto load
        }

        return <TaskManagementEmployee />;
      },
    }),
    []
  );

  useEffect(() => {
    if (!hydrated) return;

    const role = user?.role ?? "Employee";

    if (Array.isArray(user?.sidebarMenu) && user.sidebarMenu.length > 0) {
      const normalized = user.sidebarMenu.map((it) => ({
        label: it.label ?? it.name ?? "Unnamed",
        path: it.path ?? it.route ?? "/dashboard",
        icon: it.icon ?? it.iconName ?? "MdOutlineDashboard",
      }));
      setMenuItems(normalized);
    } else {
      setMenuItems(defaultMenuItems[role] || defaultMenuItems.Employee);
    }

    if (setActiveContent) {
      const defaultPath =
        role === "SuperAdmin" ? "/CreateOrganization" : "/dashboard";
      const resolver =
        pathToComponent[defaultPath] || (() => <MyEmpDashboard />);
      const defaultComp = resolver(role);
      setActiveContent(defaultComp);
      setActiveItem(defaultPath);
      setActiveNav(defaultPath);
    }
  }, [user, hydrated, defaultMenuItems, pathToComponent, setActiveContent]);

  const handleMenuClick = (item) => {
    setActiveItem(item.path);
    setActiveNav(item.path);
    setShowMobileMenu(false);

    const role = user?.role ?? "Employee";
    const resolver = pathToComponent[item.path];
    if (resolver) {
      const comp = resolver(role);
      if (comp) setActiveContent(comp);
      return;
    }

    setActiveContent(<p>Content not found</p>);
  };

  const resolveIcon = (iconName) => {
    if (!iconName) return MdIcons.MdOutlineDashboard;
    if (typeof iconName !== "string") return iconName;

    if (MdIcons[iconName]) return MdIcons[iconName];
    if (MdIcons[iconName.trim()]) return MdIcons[iconName.trim()];

    if (customIconMap[iconName]) return customIconMap[iconName];

    return MdIcons.MdOutlineDashboard;
  };

  // ✅ SUPERVISOR POPUP UI
  const SupervisorTaskChoice = () => (
    <div
      className="task-choice-overlay"
      onClick={() => setShowTaskChoice(false)}
    >
      <div className="task-choice-box" onClick={(e) => e.stopPropagation()}>
        <h3>Select View</h3>

        <button
          className="task-choice-btn"
          onClick={() => {
            setActiveContent(<TaskManagement />);
            setShowTaskChoice(false);
          }}
        >
          Manage Tasks (Supervisor)
        </button>

        <button
          className="task-choice-btn"
          onClick={() => {
            setActiveContent(<TaskManagementEmployee />);
            setShowTaskChoice(false);
          }}
        >
          My Tasks (Employee View)
        </button>

        <button className="close-btn" onClick={() => setShowTaskChoice(false)}>
          Close
        </button>
      </div>
    </div>
  );

  return (
    <>
      {showTaskChoice && <SupervisorTaskChoice />}

      <div className="sidebar">
        {user?.role !== "Admin" && user?.role !== "SuperAdmin" && (
          <div className="view-profile">
            <span
              onClick={() => setShowProfile((s) => !s)}
              className="view-profile-text"
            >
              View Profile
            </span>
          </div>
        )}

        <ul>
          {menuItems && menuItems.length > 0 ? (
            menuItems.map((item, index) => {
              const IconComponent = resolveIcon(item.icon);
              return (
                <li
                  key={index}
                  className={activeItem === item.path ? "active" : ""}
                  onClick={() => handleMenuClick(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleMenuClick(item);
                  }}
                >
                  <span className="menu-text">
                    <IconComponent className="icon" />
                    {item.label}
                  </span>
                </li>
              );
            })
          ) : (
            <p className="no-menu">No menu items</p>
          )}
        </ul>

        {showProfile && (
          <Profile
            employeeId={user?.employeeId}
            onClose={() => setShowProfile(false)}
          />
        )}
      </div>

      <div className="bottom-nav">
        <button
          className={activeNav === "/dashboard" ? "active" : ""}
          onClick={() => handleMenuClick({ path: "/dashboard" })}
        >
          <MdIcons.MdHome />
        </button>
        <button
          className={activeNav === "/employeeQueries" ? "active" : ""}
          onClick={() => handleMenuClick({ path: "/employeeQueries" })}
        >
          <MdIcons.MdOutlineContactPhone />
        </button>
        <button
          className={activeNav === "/leaveQueries" ? "active" : ""}
          onClick={() => handleMenuClick({ path: "/leaveQueries" })}
        >
          <MdIcons.MdOutlineCommentBank />
        </button>
        <button
          className={activeNav === "/reimbursement" ? "active" : ""}
          onClick={() => handleMenuClick({ path: "/reimbursement" })}
        >
          <MdIcons.MdCurrencyRupee />
        </button>
        {user?.role !== "Admin" && user?.role !== "SuperAdmin" && (
          <button
            className={showProfile ? "active" : ""}
            onClick={() => setShowProfile((s) => !s)}
            aria-label="View Profile"
            title="View Profile"
          >
            <MdIcons.MdPerson />
          </button>
        )}
        <button onClick={() => setShowMobileMenu(true)}>
          <MdIcons.MdMenu />
        </button>
      </div>

      {showProfile && (
        <Profile
          employeeId={user?.employeeId}
          onClose={() => setShowProfile(false)}
        />
      )}

      {showMobileMenu && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setShowMobileMenu(false)}
        >
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-menu"
              onClick={() => setShowMobileMenu(false)}
            >
              ✖
            </button>
            {/* inside the mobile-menu JSX */}
            <ul>
              {menuItems && menuItems.length > 0 ? (
                menuItems.map((item, index) => {
                  const IconComponent = resolveIcon(item.icon);
                  return (
                    <li
                      key={index}
                      className={activeItem === item.path ? "active" : ""}
                      onClick={() => handleMenuClick(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleMenuClick(item);
                      }}
                    >
                      <IconComponent className="icon" />
                      <span className="label">{item.label}</span>
                    </li>
                  );
                })
              ) : (
                <p className="no-menu">No menu items</p>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
