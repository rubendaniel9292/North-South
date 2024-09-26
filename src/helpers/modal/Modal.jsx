import { createPortal } from "react-dom";
import PaymetnModalContent from "./PaymentModalContent";
import PropTypes from "prop-types";

export default function Modal({ isOpen, onClose, policy }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-container d-flex justify-content-center align-items-center">
      <PaymetnModalContent onClose={onClose} policy={policy} />
    </div>,
    document.body
  );
}
Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  policy: PropTypes.object.isRequired,
};
