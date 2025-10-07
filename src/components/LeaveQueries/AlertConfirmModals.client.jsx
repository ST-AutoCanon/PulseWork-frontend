"use client";

import React from "react";
import Modal from "../Modal/Modal.client";

export default function AlertConfirmModals({
  alertModal,
  closeAlert,
  confirmModal,
  closeConfirm,
}) {
  return (
    <>
      <Modal
        title={alertModal.title}
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        buttons={[{ label: "OK", onClick: closeAlert }]}
      >
        <p>{alertModal.message}</p>
      </Modal>

      <Modal
        isVisible={confirmModal.isVisible}
        onClose={closeConfirm}
        buttons={[
          { label: "Cancel", onClick: closeConfirm },
          { label: "Confirm", onClick: confirmModal.onConfirm },
        ]}
      >
        <p>{confirmModal.message}</p>
      </Modal>
    </>
  );
}
