import React from "react";
import "./Header.css";

const Header = ({ menuOpen, toggleMenu, openNoPlanModal, openBonusModal, handleViewAllDetails }) => {
  return (
    <div className="sb-header-container">
      <div className="sb-header-heading">Salary Breakup</div>
      <div className="sb-header-button-container">
        <div className="sb-header-menu-icon" onClick={toggleMenu}>
          &#9776;
        </div>
        {menuOpen && (
          <div className="sb-header-dropdown-menu">
            <button
              className="sb-header-dropdown-item"
              onClick={openNoPlanModal}
            >
              View Employees Without Plans
            </button>
            <button
              className="sb-header-dropdown-item"
              onClick={openBonusModal}
            >
              Add Bonus
            </button>
            
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;