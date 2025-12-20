
// import React from "react";
// import "./incentivesModal.css";

// const IncentivesModal = ({
//   incentivesModal,
//   setIncentivesModal,
//   handleIncentiveSubmit,
//   isLoading,
//   getAvailableMonths,
// }) => {
//   // Full dropdown
//   const getMonthYearOptions = () => {
//     const options = [];
//     const currentDate = new Date();
//     const startYear = currentDate.getFullYear() - 5;
//     const endYear = currentDate.getFullYear() + 1;
//     const monthNames = [
//       "January", "February", "March", "April", "May", "June",
//       "July", "August", "September", "October", "November", "December"
//     ];

//     for (let year = startYear; year <= endYear; year++) {
//       for (let m = 0; m < 12; m++) {
//         const monthName = monthNames[m];
//         options.push({
//           value: `${monthName} ${year}`,
//           label: `${monthName} ${year}`,
//         });
//       }
//     }
//     return options;
//   };

//   const availableMonths = getMonthYearOptions();

//   // Simple validation (no conversion here)
//   const validateForm = () => {
//     if (!incentivesModal.employeeId) {
//       setIncentivesModal({ ...incentivesModal, error: "Employee ID missing." });
//       return false;
//     }
//     if (!incentivesModal.incentiveType) {
//       setIncentivesModal({ ...incentivesModal, error: "Select incentive type." });
//       return false;
//     }
//     if (incentivesModal.incentiveType === "ctc" && !incentivesModal.ctcPercentage) {
//       setIncentivesModal({ ...incentivesModal, error: "Enter CTC percentage." });
//       return false;
//     }
//     if (incentivesModal.incentiveType === "sales" && !incentivesModal.salesAmount) {
//       setIncentivesModal({ ...incentivesModal, error: "Enter Sales amount." });
//       return false;
//     }
//     if (!incentivesModal.applicableMonth || incentivesModal.applicableMonth === "Select Month and Year") {
//       setIncentivesModal({ ...incentivesModal, error: "Select applicable month." });
//       return false;
//     }
//     return true;
//   };

//   const handleSubmit = () => {
//     console.log("🔍 Modal state on submit:", incentivesModal);  // Debug
//     if (!validateForm()) return;
//     handleIncentiveSubmit();  // Parent converts + POST
//   };

//   if (!incentivesModal?.isVisible) return null;

//   return (
//     <div className="im-modal-overlay">
//       <div className="im-modal">
//         <div className="im-modal-header">
//           <h2>Add Incentive for {incentivesModal.fullName}</h2>
//           <button
//             className="im-modal-close"
//             onClick={() =>
//               setIncentivesModal({ ...incentivesModal, isVisible: false })
//             }
//           >
//             ×
//           </button>
//         </div>

//         <div className="im-modal-content">
//           {incentivesModal.error && (
//             <div className="im-modal-error">{incentivesModal.error}</div>
//           )}

//           {/* Incentive Type */}
//           <div className="im-modal-field">
//             <label>Incentive Type:</label>
//             <div className="im-radio-group">
//               <label>
//                 <input
//                   type="radio"
//                   name="incentiveType"
//                   value="ctc"
//                   checked={incentivesModal.incentiveType === "ctc"}
//                   onChange={(e) =>
//                     setIncentivesModal({
//                       ...incentivesModal,
//                       incentiveType: e.target.value,
//                       error: "",
//                     })
//                   }
//                 />
//                 On CTC (%)
//               </label>
//               <label>
//                 <input
//                   type="radio"
//                   name="incentiveType"
//                   value="sales"
//                   checked={incentivesModal.incentiveType === "sales"}
//                   onChange={(e) =>
//                     setIncentivesModal({
//                       ...incentivesModal,
//                       incentiveType: e.target.value,
//                       error: "",
//                     })
//                   }
//                 />
//                 Sales Margin Amount
//               </label>
//             </div>
//           </div>

//           {/* Conditional fields */}
//           {incentivesModal.incentiveType === "ctc" && (
//             <div className="im-modal-field">
//               <label>CTC Percentage (%):</label>
//               <input
//                 type="number"
//                 value={incentivesModal.ctcPercentage}
//                 onChange={(e) =>
//                   setIncentivesModal({
//                     ...incentivesModal,
//                     ctcPercentage: e.target.value,
//                     error: "",
//                   })
//                 }
//                 placeholder="Enter percentage"
//                 min="0"
//                 max="100"
//               />
//             </div>
//           )}

//           {incentivesModal.incentiveType === "sales" && (
//             <div className="im-modal-field">
//               <label>Sales Margin Amount (₹):</label>
//               <input
//                 type="number"
//                 value={incentivesModal.salesAmount}
//                 onChange={(e) =>
//                   setIncentivesModal({
//                     ...incentivesModal,
//                     salesAmount: e.target.value,
//                     error: "",
//                   })
//                 }
//                 placeholder="Enter amount"
//                 min="0"
//               />
//             </div>
//           )}

//           {/* Applicable Month */}
//           <div className="im-modal-field">
//             <label>Applicable Month:</label>
//             <select
//               value={incentivesModal.applicableMonth}
//               onChange={(e) =>
//                 setIncentivesModal({
//                   ...incentivesModal,
//                   applicableMonth: e.target.value,
//                   error: "",
//                 })
//               }
//             >
//               <option value="">Select Month and Year</option>
//               {availableMonths.map((month) => (
//                 <option key={month.value} value={month.value}>
//                   {month.label}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Actions */}
//           <div className="im-modal-actions">
//             <button
//               className="im-modal-cancel"
//               onClick={() =>
//                 setIncentivesModal({ ...incentivesModal, isVisible: false })
//               }
//             >
//               Cancel
//             </button>
//             <button
//               className="im-modal-submit"
//               onClick={handleSubmit}
//               disabled={isLoading}
//             >
//               {isLoading ? "Submitting..." : "Submit"}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default IncentivesModal;

import React from "react";
import "./incentivesModal.css";

const IncentivesModal = ({
  incentivesModal,
  setIncentivesModal,
  handleIncentiveSubmit,
  isLoading,
  getAvailableMonths,
}) => {
  // Full dropdown
  const getMonthYearOptions = () => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonthIndex = currentDate.getMonth(); // 0-11
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Current year, from current month to end
    for (let m = currentMonthIndex; m < 12; m++) {
      const monthName = monthNames[m];
      options.push({
        value: `${monthName} ${currentYear}`,
        label: `${monthName} ${currentYear}`,
      });
    }

    // Next year full
    const nextYear = currentYear + 1;
    for (let m = 0; m < 12; m++) {
      const monthName = monthNames[m];
      options.push({
        value: `${monthName} ${nextYear}`,
        label: `${monthName} ${nextYear}`,
      });
    }

    // Year after next full
    const yearAfter = currentYear + 2;
    for (let m = 0; m < 12; m++) {
      const monthName = monthNames[m];
      options.push({
        value: `${monthName} ${yearAfter}`,
        label: `${monthName} ${yearAfter}`,
      });
    }

    return options;
  };

  const availableMonths = getMonthYearOptions();

  // Simple validation (no conversion here)
  const validateForm = () => {
    if (!incentivesModal.employeeId) {
      setIncentivesModal({ ...incentivesModal, error: "Employee ID missing." });
      return false;
    }
    if (!incentivesModal.incentiveType) {
      setIncentivesModal({ ...incentivesModal, error: "Select incentive type." });
      return false;
    }
    if (incentivesModal.incentiveType === "ctc" && !incentivesModal.ctcPercentage) {
      setIncentivesModal({ ...incentivesModal, error: "Enter CTC percentage." });
      return false;
    }
    if (incentivesModal.incentiveType === "sales" && !incentivesModal.salesAmount) {
      setIncentivesModal({ ...incentivesModal, error: "Enter Sales amount." });
      return false;
    }
    if (!incentivesModal.applicableMonth || incentivesModal.applicableMonth === "Select Month and Year") {
      setIncentivesModal({ ...incentivesModal, error: "Select applicable month." });
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    console.log("🔍 Modal state on submit:", incentivesModal);  // Debug
    if (!validateForm()) return;
    handleIncentiveSubmit();  // Parent converts + POST
  };

  if (!incentivesModal?.isVisible) return null;

  return (
    <div className="im-modal-overlay">
      <div className="im-modal">
        <div className="im-modal-header">
          <h2>Add Incentive for {incentivesModal.fullName}</h2>
          <button
            className="im-modal-close"
            onClick={() =>
              setIncentivesModal({ ...incentivesModal, isVisible: false })
            }
          >
            ×
          </button>
        </div>

        <div className="im-modal-content">
          {incentivesModal.error && (
            <div className="im-modal-error">{incentivesModal.error}</div>
          )}

          {/* Incentive Type */}
          <div className="im-modal-field">
            <label>Incentive Type:</label>
            <div className="im-radio-group">
              <label>
                <input
                  type="radio"
                  name="incentiveType"
                  value="ctc"
                  checked={incentivesModal.incentiveType === "ctc"}
                  onChange={(e) =>
                    setIncentivesModal({
                      ...incentivesModal,
                      incentiveType: e.target.value,
                      error: "",
                    })
                  }
                />
                On CTC (%)
              </label>
              <label>
                <input
                  type="radio"
                  name="incentiveType"
                  value="sales"
                  checked={incentivesModal.incentiveType === "sales"}
                  onChange={(e) =>
                    setIncentivesModal({
                      ...incentivesModal,
                      incentiveType: e.target.value,
                      error: "",
                    })
                  }
                />
                Sales Margin Amount
              </label>
            </div>
          </div>

          {/* Conditional fields */}
          {incentivesModal.incentiveType === "ctc" && (
            <div className="im-modal-field">
              <label>CTC Percentage (%):</label>
              <input
                type="number"
                value={incentivesModal.ctcPercentage}
                onChange={(e) =>
                  setIncentivesModal({
                    ...incentivesModal,
                    ctcPercentage: e.target.value,
                    error: "",
                  })
                }
                placeholder="Enter percentage"
                min="0"
                max="100"
              />
            </div>
          )}

          {incentivesModal.incentiveType === "sales" && (
            <div className="im-modal-field">
              <label>Sales Margin Amount (₹):</label>
              <input
                type="number"
                value={incentivesModal.salesAmount}
                onChange={(e) =>
                  setIncentivesModal({
                    ...incentivesModal,
                    salesAmount: e.target.value,
                    error: "",
                  })
                }
                placeholder="Enter amount"
                min="0"
              />
            </div>
          )}

          {/* Applicable Month */}
          <div className="im-modal-field">
            <label>Applicable Month:</label>
            <select
              value={incentivesModal.applicableMonth}
              onChange={(e) =>
                setIncentivesModal({
                  ...incentivesModal,
                  applicableMonth: e.target.value,
                  error: "",
                })
              }
            >
              <option value="">Select Month and Year</option>
              {availableMonths.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="im-modal-actions">
            <button
              className="im-modal-cancel"
              onClick={() =>
                setIncentivesModal({ ...incentivesModal, isVisible: false })
              }
            >
              Cancel
            </button>
            <button
              className="im-modal-submit"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncentivesModal;