import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import PaymentModalContent from "./PaymentModalContent";
import ListPolicyModal from "./ListPolicyModal";
import RegisterRenewalsModal from "./RegisterRenewalsModal";

export default function Modal({
  isOpen,
  onClose,
  policy,
  payment,
  modalType,
  renewal,
}) {
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
      ) : modalType === "renewal" ? (
        <RegisterRenewalsModal
          onClose={onClose}
          policy={policy}
          renewal={renewal}
        />
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
  renewal: PropTypes.object.isRequired,
};
