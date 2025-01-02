import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import PaymentModalContent from "./PaymentModalContent";
import ListPolicyModal from "./ListPolicyModal";
import RegisterRenewalsModal from "./RegisterRenewalsModal";
import CustomerModalContent from "./CustomerModalContent";
import PolicyStatusModal from "./PolicyStatusModal";
import CardsModal from "./CardsModal";
import PaymentByStatusModal from "./PaymentByStatusModal";
import RegisterAdvanceModal from "./RegisterAdvanceModal";

export default function Modal({
  isOpen,
  onClose,
  policy,
  modalType,
  customerId,
  policies,
  cards,
  payments,
  advisorId,
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
          <CustomerModalContent onClose={onClose} customerId={customerId} />
        );
      case "policyByStatus":
        return <PolicyStatusModal onClose={onClose} policies={policies} />;
      case "cardsByStatus":
        return <CardsModal onClose={onClose} cards={cards} />;
      case "paymentByStatus":
        return <PaymentByStatusModal onClose={onClose} payments={payments} />;
      case  "advisor": return <RegisterAdvanceModal onClose={onClose} advisorId={advisorId} />;
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
  customerId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.object,
  ]),
  modalType: PropTypes.string.isRequired,
  policies: PropTypes.array.isRequired,
  cards: PropTypes.array.isRequired,
  payments: PropTypes.array.isRequired,
  advisorId: PropTypes.object.isRequired,
};
