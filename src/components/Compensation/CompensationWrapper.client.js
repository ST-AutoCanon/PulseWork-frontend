// // import React from "react";
// // import "./CompensationWrapper.css"; // Optional: Add styles for layout

// // const CompensationWrapper = ({ onSelect }) => {
// //   const handleButtonClick = (subPath) => {
// //     if (onSelect) {
// //       onSelect(subPath);
// //     }
// //   };

// //   return (
// //     <div className="compensation-wrapper">
// //       <h2>Compensation Management</h2>
// //       <p>Select an option to proceed:</p>
// //       <div className="buttons-container">
// //         <button
// //           className="compensation-btn"
// //           onClick={() => handleButtonClick("/compensation/create")}
// //         >
// //           Create Compensation
// //         </button>
// //         <button
// //           className="compensation-btn"
// //           onClick={() => handleButtonClick("/compensation/assign")}
// //         >
// //           Assign Compensation
// //         </button>
// //         <button
// //           className="compensation-btn"
// //           onClick={() => handleButtonClick("/compensation/breakup")}
// //         >
// //           Salary Breakup
// //         </button>
// //         <button
// //           className="compensation-btn"
// //           onClick={() => handleButtonClick("/compensation/details")}
// //         >
// //           Salary Details
// //         </button>
// //       </div>
// //     </div>
// //   );
// // };

// // export default CompensationWrapper;
// "use client";
// import React, { useState } from "react";
// import SalaryBreakup from "./SalaryBreakupMain.client";
//  import SalaryDetails from "./SalaryDetails/SalaryDetails.client"; // Updated path to match provided file structure
// // Import other components as needed
// import CreateCompensation from "./CreateCompensation.client";
// import AssignCompensation from "./AssignCompensation.client";

// import "./CompensationWrapper.css"; // Optional: Add styles for layout
// import SalaryBreakupMain from "./SalaryBreakupMain.client";

// const CompensationWrapper = () => {
//   const [currentView, setCurrentView] = useState(""); // Starts with wrapper view

//   const handleButtonClick = (subPath) => {
//     setCurrentView(subPath);
//   };

//   const renderView = () => {
//     switch (currentView) {
//       case "/compensation/breakup":
//         console.log("Rendering SalaryBreakupMain");
//         return <SalaryBreakupMain />;
//       case "/compensation/details":
//         return <SalaryDetails />;
//       //Add cases for other sub-components when implemented
//       case "/compensation/create":
//         return <CreateCompensation />;
//       case "/compensation/assign":
//         return <AssignCompensation />;
//       default:
//         return (
//           <>
//             <h2>Compensation Management</h2>
//             <p>Select an option to proceed:</p>
//             <div className="buttons-container">
//               <button
//                 className="compensation-btn"
//                 onClick={() => handleButtonClick("/compensation/create")}
//               >
//                 Create Compensation
//               </button>
//               <button
//                 className="compensation-btn"
//                 onClick={() => handleButtonClick("/compensation/assign")}
//               >
//                 Assign Compensation
//               </button>
//               <button
//                 className="compensation-btn"
//                 onClick={() => handleButtonClick("/compensation/breakup")}
//               >
//                 Salary Breakup
//               </button>
//               <button
//                 className="compensation-btn"
//                 onClick={() => handleButtonClick("/compensation/details")}
//               >
//                 Salary Details
//               </button>
//             </div>
//           </>
//         );
//     }
//   };

//   return (
//     <div className="compensation-wrapper">
//       {renderView()}
//     </div>
//   );
// };

// export default CompensationWrapper;
"use client";

import React, { useState } from "react";
import SalaryBreakupMain from "./SalaryBreakupMain.client"; // Only import once
import SalaryDetails from "./SalaryDetails/SalaryDetails.client";
import CreateCompensation from "./CreateCompensation.client";
import AssignCompensation from "./AssignCompensation.client";

import "./CompensationWrapper.css"; // Your styles

const CompensationWrapper = () => {
  // Use simple string identifiers instead of full paths — much safer and clearer
  const [currentView, setCurrentView] = useState("home"); // "home" = main menu

  const handleNavigation = (view) => {
    console.log("Navigating to view:", view); // Debug log
    setCurrentView(view);
  };

  const renderContent = () => {
    switch (currentView) {
      case "breakup":
        console.log("Rendering SalaryBreakupMain");
        return <SalaryBreakupMain />;

      case "details":
        console.log("Rendering SalaryDetails");
        return <SalaryDetails />;

      case "create":
        console.log("Rendering CreateCompensation");
        return <CreateCompensation />;

      case "assign":
        console.log("Rendering AssignCompensation");
        return <AssignCompensation />;

      case "home":
      default:
        return (
          <div className="home-view">
            <h2 className="title">Compensation Management</h2>
            <p className="subtitle">Select an option to proceed:</p>
            <div className="buttons-container">
              <button
                className="compensation-btn"
                onClick={() => handleNavigation("create")}
              >
                Create Compensation Plan
              </button>

              <button
                className="compensation-btn"
                onClick={() => handleNavigation("assign")}
              >
                Assign Compensation Plan
              </button>

              <button
                className="compensation-btn primary"
                onClick={() => handleNavigation("breakup")}
              >
                Salary Breakup
              </button>

              <button
                className="compensation-btn"
                onClick={() => handleNavigation("details")}
              >
                Salary Details
              </button>
            </div>
          </div>
        );
    }
  };

  // Optional: Add a back button when not on home
  const showBackButton = currentView !== "home";

  return (
    <div className="compensation-wrapper">
      {showBackButton && (
        <div className="back-button-container">
          <button
            className="back-btn"
            onClick={() => handleNavigation("home")}
          >
            ← Back to Menu
          </button>
        </div>
      )}

      <div className="content-area">
        {renderContent()}
      </div>
    </div>
  );
};

export default CompensationWrapper;