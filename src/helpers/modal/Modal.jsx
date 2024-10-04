import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import PaymentModalContent from "./PaymentModalContent";

export default function Modal({ isOpen, onClose, policy, payment }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-container d-flex justify-content-center align-items-center">
      <PaymentModalContent
        onClose={onClose}
        policy={policy}
        payment={payment}
      />
    </div>,
    document.body
  );
}
Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  policy: PropTypes.object.isRequired,
  payment: PropTypes.object.isRequired,
};
