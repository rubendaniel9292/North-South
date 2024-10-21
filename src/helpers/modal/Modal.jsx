import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import PaymentModalContent from "./PaymentModalContent";
import ListPolicyModal from "./ListPolicyModal";

export default function Modal({ isOpen, onClose, policy, payment, modalType }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-container d-flex justify-content-center align-items-center">
      {modalType === "payment" ? (
        <PaymentModalContent
          onClose={onClose}
          policy={policy}
          payment={payment}
        />
      ) : modalType === "info" ? (
        <ListPolicyModal onClose={onClose} policy={policy} />
      ) : null}
    </div>,

    document.body
  );
}
Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  policy: PropTypes.object.isRequired,
  payment: PropTypes.object.isRequired,
  modalType: PropTypes.string.isRequired,
};
