// "use client";

// import React, { useMemo, useState } from "react";
// import { useAuth } from "../../context/AuthProvider.client";
// import useLeaveRequest from "./useLeaveRequest.client";
// import VennBalances from "./VennBalances.client";
// import FiltersPanel from "./FiltersPanel.client";
// import LeaveFormModal from "./LeaveFormModal.client";
// import TeamTable from "./TeamTable.client";
// import SelfTable from "./SelfTable.client";
// import LopModal from "./LopModal.client";
// import AlertConfirmModals from "./AlertConfirmModals.client";
// import CompensationPopup from "./CompensationPopup.client";
// import { defaultLeaveSettings } from "./leaveUtils.client";
// import "./LeaveRequest.css";

// export default function LeaveRequest() {
//   const hook = useLeaveRequest();
//   const { user } = useAuth();

//   const [vennStartIndex, setVennStartIndex] = useState(0);
//   const [vennVisibleCount, setVennVisibleCount] = useState(() => {
//     if (typeof window === "undefined") return 6;
//     const w = window.innerWidth;
//     if (w < 600) return 1;
//     if (w < 900) return 2;
//     return 5;
//   });

//   const prevVenn = () =>
//     setVennStartIndex((s) => Math.max(0, s - vennVisibleCount));
//   const nextVenn = () =>
//     setVennStartIndex((s) =>
//       Math.min(
//         Math.max(0, (hook.balances || []).length - vennVisibleCount),
//         s + vennVisibleCount,
//       ),
//     );

//   const leaveTypeOptions = useMemo(() => {
//     if (
//       hook.activePolicy &&
//       Array.isArray(hook.activePolicy.leave_settings) &&
//       hook.activePolicy.leave_settings.length > 0
//     ) {
//       return hook.activePolicy.leave_settings
//         .filter((s) => s && (s.enabled === undefined ? true : s.enabled))
//         .map((s) => {
//           const key = (s.type || s.type_key || "").toString();
//           const label =
//             s.label ||
//             key
//               .replace(/[_-]+/g, " ")
//               .replace(/\b\w/g, (ch) => ch.toUpperCase());
//           return { type: key, label, disabled: !s.enabled ? true : false };
//         });
//     }

//     const fromHook = (hook.leaveTypes || []).map((t) => {
//       const key = t.key || t.type || String(t).trim();
//       const label = t.label || t.name || String(key).replace(/_/g, " ");
//       const disabled = !!t.disabled;
//       const reason = t.reason || null;
//       return { type: key, label, disabled, reason };
//     });
//     if (fromHook && fromHook.length > 0) return fromHook;

//     const settings =
//       hook.activePolicy?.leave_settings?.length > 0
//         ? hook.activePolicy.leave_settings
//         : defaultLeaveSettings;
//     return settings
//       .filter((s) => s && (s.enabled === undefined ? true : s.enabled))
//       .map((s) => ({
//         type: s.type,
//         label:
//           s.type === "casual"
//             ? "Casual Leave"
//             : s.type === "earned"
//               ? "Earned Leave"
//               : s.type.charAt(0).toUpperCase() + s.type.slice(1),
//       }));
//   }, [hook.leaveTypes, hook.activePolicy, hook.userProfile, user]);

//   const [isLopModalOpen, setIsLopModalOpen] = useState(false);
//   const prevLopMonth = () => {
//     if (hook.lopMonth === 1) {
//       hook.setLopMonth(12);
//       hook.setLopYear((y) => y - 1);
//     } else {
//       hook.setLopMonth((m) => m - 1);
//     }
//   };
//   const nextLopMonth = () => {
//     const cur = new Date();
//     const curMonth = cur.getMonth() + 1;
//     const curYear = cur.getFullYear();
//     if (
//       hook.lopYear > curYear ||
//       (hook.lopYear === curYear && hook.lopMonth >= curMonth)
//     )
//       return;
//     if (hook.lopMonth === 12) {
//       hook.setLopMonth(1);
//       hook.setLopYear((y) => y + 1);
//     } else {
//       hook.setLopMonth((m) => m + 1);
//     }
//   };

//   return (
//     <div className="leave-container">
//       <div className="lv-policy-header">
//         <h2 className="lv-title">Leave Queries</h2>
//       </div>

//       <VennBalances
//         balances={hook.balances}
//         activePolicy={hook.activePolicy}
//         vennStartIndex={vennStartIndex}
//         vennVisibleCount={vennVisibleCount}
//         prevVenn={prevVenn}
//         nextVenn={nextVenn}
//         setIsLopModalOpen={setIsLopModalOpen}
//       />

//       <FiltersPanel
//         filters={hook.filters}
//         setFilters={hook.setFilters}
//         canViewTeam={hook.canViewTeam}
//         teamSearch={hook.teamSearch}
//         setTeamSearch={hook.setTeamSearch}
//         teamStatus={hook.teamStatus}
//         setTeamStatus={hook.setTeamStatus}
//         onSearch={hook.fetchLeaveRequests}
//         onOpenForm={hook.openForm}
//       />

//       <LeaveFormModal
//         isVisible={hook.isFormVisible}
//         onClose={hook.closeForm}
//         formData={hook.formData}
//         setFormData={hook.setFormData}
//         handleInputChange={hook.handleInputChange}
//         handleSubmit={hook.handleSubmit}
//         leaveTypeOptions={leaveTypeOptions}
//         editingId={hook.editingId}
//         showAlert={hook.showAlert}
//         activePolicy={hook.activePolicy}
//         defaultLeaveSettings={hook.defaultLeaveSettings}
//         leaveTypes={hook.leaveTypes}
//         userProfile={hook.userProfile}
//         attachments={hook.attachments}
//         setAttachments={hook.setAttachments}
//       />

//       <TeamTable
//         leaveRequests={hook.leaveRequests}
//         statusUpdates={hook.statusUpdates}
//         handleStatusChange={hook.handleStatusChange}
//         onUpdate={hook.handleUpdate}
//         canViewTeam={hook.canViewTeam}
//         policies={hook.policies}
//         activePolicy={hook.activePolicy}
//         loadLeaveBalance={hook.loadLeaveBalance}
//         lopModal={hook.lopModal}
//         setLopModal={hook.setLopModal}
//       />

//       <SelfTable
//         leaveRequests={hook.leaveRequests}
//         onEdit={hook.handleEdit}
//         onCancel={hook.handleCancel}
//       />

//       <CompensationPopup
//         lopModal={hook.lopModal}
//         setLopModal={hook.setLopModal}
//       />

//       <AlertConfirmModals
//         alertModal={hook.alertModal}
//         closeAlert={hook.closeAlert}
//         confirmModal={hook.confirmModal}
//         closeConfirm={hook.closeConfirm}
//       />

//       <LopModal
//         isVisible={isLopModalOpen}
//         onClose={() => setIsLopModalOpen(false)}
//         lopMonth={hook.lopMonth}
//         lopYear={hook.lopYear}
//         monthlyLop={hook.monthlyLop}
//         prevMonth={prevLopMonth}
//         nextMonth={nextLopMonth}
//         onRecompute={() => hook.computeMonthlyLop(hook.lopMonth, hook.lopYear)}
//       />
//     </div>
//   );
// }

"use client";

import React, { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthProvider.client";
import useLeaveRequest from "./useLeaveRequest.client";
import VennBalances from "./VennBalances.client";
import FiltersPanel from "./FiltersPanel.client";
import LeaveFormModal from "./LeaveFormModal.client";
import TeamTable from "./TeamTable.client";
import SelfTable from "./SelfTable.client";
import LopModal from "./LopModal.client";
import AlertConfirmModals from "./AlertConfirmModals.client";
import CompensationPopup from "./CompensationPopup.client";
import { defaultLeaveSettings } from "./leaveUtils.client";
import "./LeaveRequest.css";

export default function LeaveRequest() {
  const hook = useLeaveRequest();
  const { user } = useAuth();

  const [vennStartIndex, setVennStartIndex] = useState(0);
  const [vennVisibleCount, setVennVisibleCount] = useState(() => {
    if (typeof window === "undefined") return 6;
    const w = window.innerWidth;
    if (w < 600) return 1;
    if (w < 900) return 2;
    return 5;
  });

  const prevVenn = () =>
    setVennStartIndex((s) => Math.max(0, s - vennVisibleCount));
  const nextVenn = () =>
    setVennStartIndex((s) =>
      Math.min(
        Math.max(0, (hook.balances || []).length - vennVisibleCount),
        s + vennVisibleCount,
      ),
    );

  const leaveTypeOptions = useMemo(() => {
    const gender = (hook.userProfile?.gender || user?.gender || user?.sex || "")
      .toString()
      .toLowerCase();
    const dob = hook.userProfile?.dob || user?.date_of_birth || user?.dob;
    const age = dob ? new Date(dob) : null;
    const ageYears =
      age && !Number.isNaN(age.getTime())
        ? (() => {
            const now = new Date();
            let years = now.getFullYear() - age.getFullYear();
            const monthDiff = now.getMonth() - age.getMonth();
            if (
              monthDiff < 0 ||
              (monthDiff === 0 && now.getDate() < age.getDate())
            )
              years -= 1;
            return years;
          })()
        : null;

    const isAllowed = (typeValue = "") => {
      const key = String(typeValue || "").toLowerCase();
      if (key.includes("maternity")) return gender === "female";
      if (key.includes("menstrual")) {
        if (gender !== "female") return false;
        return ageYears === null || (ageYears >= 18 && ageYears <= 52);
      }
      if (key.includes("paternity")) return gender === "male";
      return true;
    };

    if (
      hook.activePolicy &&
      Array.isArray(hook.activePolicy.leave_settings) &&
      hook.activePolicy.leave_settings.length > 0
    ) {
      return hook.activePolicy.leave_settings
        .filter((s) => s && (s.enabled === undefined ? true : s.enabled))
        .filter((s) => isAllowed(s.type || s.type_key || s.key || ""))
        .map((s) => {
          const key = (s.type || s.type_key || "").toString();
          const label =
            s.label ||
            key
              .replace(/[_-]+/g, " ")
              .replace(/\b\w/g, (ch) => ch.toUpperCase());
          return { type: key, label, disabled: !s.enabled ? true : false };
        });
    }

    const fromHook = (hook.leaveTypes || [])
      .map((t) => {
        const key = t.key || t.type || String(t).trim();
        const label = t.label || t.name || String(key).replace(/_/g, " ");
        const disabled = !!t.disabled;
        const reason = t.reason || null;
        return { type: key, label, disabled, reason };
      })
      .filter((t) => isAllowed(t.type || ""));
    if (fromHook && fromHook.length > 0) return fromHook;

    const settings =
      hook.activePolicy?.leave_settings?.length > 0
        ? hook.activePolicy.leave_settings
        : defaultLeaveSettings;
    return settings
      .filter((s) => s && (s.enabled === undefined ? true : s.enabled))
      .filter((s) => isAllowed(s.type || ""))
      .map((s) => ({
        type: s.type,
        label:
          s.type === "casual"
            ? "Casual Leave"
            : s.type === "earned"
              ? "Earned Leave"
              : s.type.charAt(0).toUpperCase() + s.type.slice(1),
      }));
  }, [hook.leaveTypes, hook.activePolicy, hook.userProfile, user]);

  const [isLopModalOpen, setIsLopModalOpen] = useState(false);
  const prevLopMonth = () => {
    if (hook.lopMonth === 1) {
      hook.setLopMonth(12);
      hook.setLopYear((y) => y - 1);
    } else {
      hook.setLopMonth((m) => m - 1);
    }
  };
  const nextLopMonth = () => {
    const cur = new Date();
    const curMonth = cur.getMonth() + 1;
    const curYear = cur.getFullYear();
    if (
      hook.lopYear > curYear ||
      (hook.lopYear === curYear && hook.lopMonth >= curMonth)
    )
      return;
    if (hook.lopMonth === 12) {
      hook.setLopMonth(1);
      hook.setLopYear((y) => y + 1);
    } else {
      hook.setLopMonth((m) => m + 1);
    }
  };

  return (
    <div className="leave-container">
      <div className="lv-policy-header">
        <h2 className="lv-title">Leave Queries</h2>
      </div>

      <VennBalances
        balances={hook.balances}
        activePolicy={hook.activePolicy}
        vennStartIndex={vennStartIndex}
        vennVisibleCount={vennVisibleCount}
        prevVenn={prevVenn}
        nextVenn={nextVenn}
        setIsLopModalOpen={setIsLopModalOpen}
      />

      <FiltersPanel
        filters={hook.filters}
        setFilters={hook.setFilters}
        canViewTeam={hook.canViewTeam}
        teamSearch={hook.teamSearch}
        setTeamSearch={hook.setTeamSearch}
        teamStatus={hook.teamStatus}
        setTeamStatus={hook.setTeamStatus}
        onSearch={hook.fetchLeaveRequests}
        onOpenForm={hook.openForm}
      />

      <LeaveFormModal
        isVisible={hook.isFormVisible}
        onClose={hook.closeForm}
        formData={hook.formData}
        setFormData={hook.setFormData}
        handleInputChange={hook.handleInputChange}
        handleSubmit={hook.handleSubmit}
        leaveTypeOptions={leaveTypeOptions}
        editingId={hook.editingId}
        showAlert={hook.showAlert}
        activePolicy={hook.activePolicy}
        defaultLeaveSettings={hook.defaultLeaveSettings}
        leaveTypes={hook.leaveTypes}
        userProfile={hook.userProfile}
        attachments={hook.attachments}
        setAttachments={hook.setAttachments}
      />

      <TeamTable
        leaveRequests={hook.leaveRequests}
        statusUpdates={hook.statusUpdates}
        handleStatusChange={hook.handleStatusChange}
        onUpdate={hook.handleUpdate}
        canViewTeam={hook.canViewTeam}
        policies={hook.policies}
        activePolicy={hook.activePolicy}
        loadLeaveBalance={hook.loadLeaveBalance}
        lopModal={hook.lopModal}
        setLopModal={hook.setLopModal}
      />

      <SelfTable
        leaveRequests={hook.leaveRequests}
        onEdit={hook.handleEdit}
        onCancel={hook.handleCancel}
      />

      <CompensationPopup
        lopModal={hook.lopModal}
        setLopModal={hook.setLopModal}
      />

      <AlertConfirmModals
        alertModal={hook.alertModal}
        closeAlert={hook.closeAlert}
        confirmModal={hook.confirmModal}
        closeConfirm={hook.closeConfirm}
      />

      <LopModal
        isVisible={isLopModalOpen}
        onClose={() => setIsLopModalOpen(false)}
        lopMonth={hook.lopMonth}
        lopYear={hook.lopYear}
        monthlyLop={hook.monthlyLop}
        prevMonth={prevLopMonth}
        nextMonth={nextLopMonth}
        onRecompute={() => hook.computeMonthlyLop(hook.lopMonth, hook.lopYear)}
      />
    </div>
  );
}
