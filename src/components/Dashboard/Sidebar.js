import React, { useState, useEffect } from "react";
import "./Sidebar.css";
import * as MdIcons from "react-icons/md";
import EmployeeDetails from "../EmployeeDetails/EmployeeDetails";
import AddDepartment from "../AddDepartment/AddDepartment";
import AdminQuery from "../EmployeeQueries/AdminQuery";
import EmployeeQuery from "../EmployeeQueries/EmployeeQuery";
import UpdateProject from "../UpdateProjects/ProjectsDashboard";
import LeaveQueries from "../LeaveQueries/Admin";
import LeaveRequest from "../LeaveQueries/LeaveRequest";
import Profile from "../Profile/Profile";
import MyDashboard from "../MyDashboard/MyDashboard";
import MyEmpDashboard from "../MyEmpDashboard/MyEmpDashboard";
import Salary_Statement from "../Salary_statement/Salary_Statement";
import PayrollSummary from "../PayrollSummary/PayrollSummary";
import Reimbursement from "../Reimbursement/Reimbursement";
import RbAdmin from "../Reimbursement/RbAdmin";
import RbTeamLead from "../Reimbursement/RbTeamLead";
import Assets from "../Assets/assets";
import Vendors from "../vendors/vendors";
import Chat from "../Chat/ChatPage";
import EmployeeLogin from "../EmployeeLogin/EmployeeLogin";
import SalaryStatementWrapper from "../Salary_statement/SalaryStatementWrapper";
import CreateOrganization from "../CreateOrganization/CreateOrganization";
import TemplateBuilder from "../TemplateBuilder/TemplateBuilder";

const Sidebar = ({ setActiveContent }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [activeItem, setActiveItem] = useState("/dashboard"); // Default active item
  const [showProfile, setShowProfile] = useState(false);
  const employeeId = localStorage.getItem("employeeId");
  const userRole = localStorage.getItem("userRole") || "Employee";
  const dashboardData = JSON.parse(
    localStorage.getItem("dashboardData") || "{}"
  );
  const userPosition = dashboardData.position;
  const [activeNav, setActiveNav] = useState("/dashboard");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Define default menu items based on role
  const defaultMenuItems = {
    Admin: [
      { label: "Dashboard", path: "/dashboard", icon: "MdOutlineDashboard" },
      { label: "Employee Details", path: "/employeeDetails", icon: "MdPeople" },
      { label: "Add Department", path: "/addDepartment", icon: "MdBusiness" },
      { label: "Update Projects", path: "/updateProjects", icon: "MdWork" },
      {
        label: "Leave Queries",
        path: "/leaveQueries",
        icon: "MdOutlineCommentBank",
      },
      {
        label: "Payroll Summary",
        path: "/payrollSummary",
        icon: "MdOutlinePayment",
      },
      {
        label: "Reimbursement",
        path: "/reimbursement",
        icon: "MdCurrencyRupee",
      },
      {
        label: "Employee Queries",
        path: "/employeeQueries",
        icon: "MdOutlineContactPhone",
      },
      { label: "Assets", path: "/assets", icon: "MdOutlineInventory" },
      { label: "Vendors", path: "/vendors", icon: "MdOutlineStore" },
      { label: "Messenger", path: "/messenger", icon: "MdChat" },
    ],
    Employee: [
      { label: "Dashboard", path: "/dashboard", icon: "MdOutlineDashboard" },
      {
        label: "Leave Request",
        path: "/leaveQueries",
        icon: "MdOutlineCommentBank",
      },
      {
        label: "Reimbursement",
        path: "/reimbursement",
        icon: "MdCurrencyRupee",
      },
      {
        label: "Employee Queries",
        path: "/employeeQueries",
        icon: "MdOutlineContactPhone",
      },
      {
        label: "Salary Statement",
        path: "/Salary_Statement",
        icon: "MdOutlinePayment",
      },
      { label: "Messenger", path: "/messenger", icon: "MdChat" },
    ],
    Manager: [
      { label: "Dashboard", path: "/dashboard", icon: "MdOutlineDashboard" },
      {
        label: "Leave Request",
        path: "/leaveQueries",
        icon: "MdOutlineCommentBank",
      },
      {
        label: "Reimbursement",
        path: "/reimbursement",
        icon: "MdCurrencyRupee",
      },
      {
        label: "Employee Queries",
        path: "/employeeQueries",
        icon: "MdOutlineContactPhone",
      },
      {
        label: "Salary Statement",
        path: "/Salary_Statement",
        icon: "MdOutlinePayment",
      },
      { label: "Messenger", path: "/messenger", icon: "MdChat" },
      { label: "Update Projects", path: "/updateProjects", icon: "MdWork" },
    ],
    SuperAdmin: [
      {
        label: "Create Organization",
        path: "/CreateOrganization",
        icon: "MdOutlineBusiness",
      },
    ],
  };

  useEffect(() => {
    // Load menu items from local storage or set defaults based on role
    const storedData = localStorage.getItem("sidebarMenu");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setMenuItems(parsedData || defaultMenuItems[userRole] || []);
      } catch (error) {
        console.error("Error parsing sidebar menu:", error);
        setMenuItems(defaultMenuItems[userRole] || []);
      }
    } else {
      // Set default menu items based on role and store in localStorage
      const defaultItems =
        defaultMenuItems[userRole] || defaultMenuItems.Employee;
      setMenuItems(defaultItems);
      localStorage.setItem("sidebarMenu", JSON.stringify(defaultItems));
    }

    // Set default active content based on userRole
    if (setActiveContent) {
      if (userRole === "SuperAdmin") {
        setActiveContent(<CreateOrganization />);
        setActiveItem("/CreateOrganization");
        setActiveNav("/CreateOrganization");
      } else if (userRole === "Admin") {
        setActiveContent(<MyDashboard />);
        setActiveItem("/dashboard");
        setActiveNav("/dashboard");
      } else {
        setActiveContent(<MyEmpDashboard />);
        setActiveItem("/dashboard");
        setActiveNav("/dashboard");
      }
    }
  }, [setActiveContent, userRole]);

  const handleMenuClick = (item) => {
    setActiveItem(item.path);
    setActiveNav(item.path);
    setShowMobileMenu(false);

    switch (item.path) {
      case "/dashboard":
        setActiveContent(
          userRole === "Admin" ? <MyDashboard /> : <MyEmpDashboard />
        );
        break;
      case "/employeeDetails":
        setActiveContent(<EmployeeDetails />);
        break;
      case "/addDepartment":
        setActiveContent(<AddDepartment />);
        break;
      case "/updateProjects":
        setActiveContent(<UpdateProject />);
        break;
      case "/CreateOrganization":
        setActiveContent(<CreateOrganization />);
        break;
      case "/leaveQueries":
        if (userRole === "Admin") {
          setActiveContent(<LeaveQueries />);
        } else {
          setActiveContent(<LeaveRequest />);
        }
        break;
      case "/Salary_Statement":
        setActiveContent(<SalaryStatementWrapper />);
        break;
      case "/payrollSummary":
        setActiveContent(<PayrollSummary />);
        break;
      case "/messenger":
        setActiveContent(<Chat />);
        break;
      case "/reimbursement":
        if (userRole === "Admin") {
          setActiveContent(<RbAdmin />);
        } else if (userRole === "Manager") {
          setActiveContent(<RbTeamLead />);
        } else {
          setActiveContent(<Reimbursement />);
        }
        break;
      case "/employeeQueries":
        setActiveContent(
          userRole === "Admin" ? <AdminQuery /> : <EmployeeQuery />
        );
      case "/TemplateBuilder":
        setActiveContent(<TemplateBuilder />);
        break;
        break;
      case "/assets":
        setActiveContent(<Assets />);
        break;
      case "/vendors":
        setActiveContent(<Vendors />);
        break;
      case "/EmployeeLogin":
        setActiveContent(<EmployeeLogin />);
        break;
      default:
        setActiveContent(<p>Content not found for this path.</p>);
    }
  };

  const toggleProfile = () => {
    setShowProfile(!showProfile);
  };

  return (
    <>
      {/* Sidebar (Desktop) */}
      <div className="sidebar">
        {userRole !== "Admin" && (
          <div className="view-profile">
            <span
              onClick={() => setShowProfile(!showProfile)}
              className="view-profile-text"
            >
              View Profile
            </span>
          </div>
        )}
        <ul>
          {menuItems.length > 0 ? (
            menuItems.map((item, index) => {
              const IconComponent =
                MdIcons[item.icon] || MdIcons.MdOutlineDashboard;
              return (
                <li
                  key={index}
                  className={activeItem === item.path ? "active" : ""}
                  onClick={() => handleMenuClick(item)}
                >
                  <span className="icon">
                    <IconComponent />
                  </span>
                  <span className="menu-text">{item.label}</span>
                </li>
              );
            })
          ) : (
            <p className="no-menu">No menu items available</p>
          )}
        </ul>
        {showProfile && (
          <Profile
            employeeId={employeeId}
            onClose={() => setShowProfile(false)}
          />
        )}
      </div>

      {/* Bottom Navigation for Mobile */}
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
        <button onClick={() => setShowMobileMenu(true)}>
          <MdIcons.MdMenu />
        </button>
      </div>

      {/* Mobile Sidebar Popup */}
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
            <ul>
              {menuItems.length > 0 ? (
                menuItems.map((item, index) => {
                  const IconComponent =
                    MdIcons[item.icon] || MdIcons.MdOutlineDashboard;
                  return (
                    <li
                      key={index}
                      className={activeItem === item.path ? "active" : ""}
                      onClick={() => handleMenuClick(item)}
                    >
                      <span className="icon">
                        <IconComponent />
                      </span>
                      <span className="menu-text">{item.label}</span>
                    </li>
                  );
                })
              ) : (
                <p className="no-menu">No menu items available</p>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
