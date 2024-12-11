import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import PaymentModalContent from "./PaymentModalContent";
import ListPolicyModal from "./ListPolicyModal";
import RegisterRenewalsModal from "./RegisterRenewalsModal";
import CustomerModalContent from "./CustomerModalContent";

export default function Modal({
  isOpen,
  onClose,
  policy,
  modalType,
  customerId,
}) {
  if (!isOpen) return null;

  const getModalContent = () => {
    switch (modalType) {
      case "payment":
        return <PaymentModalContent onClose={onClose} policy={policy} />;
      case "info":
        return <ListPolicyModal onClose={onClose} policy={policy} />;
      case "renewal":
        return <RegisterRenewalsModal onClose={onClose} policy={policy} />;
      case "customerId":
        return (
          <CustomerModalContent
            onClose={onClose}
            customerId={customerId}
          />
        );
      default:
        return null;
    }
  };

  return createPortal(
    <div className="modal-container d-flex justify-content-center align-items-center">
      {getModalContent()}
    </div>,
    document.body
  );
}
Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  policy: PropTypes.object,
  modalType: PropTypes.string.isRequired,
  customerId: PropTypes.object.isRequired,
};
