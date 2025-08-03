import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import PaymentModalContent from "./PaymentModalContent";
import ListPolicyModal from "./ListPolicyModal";
import CustomerModalContent from "./CustomerModalContent";
import PolicyStatusModal from "./PolicyStatusModal";
import CardsModal from "./CardsModal";
import PaymentByStatusModal from "./PaymentByStatusModal";
import RegisterAdvanceModal from "./RegisterAdvanceModal";
import UpdateCustomerModal from "./UpdateCustomerModal";
import UpdateAdvisorModal from "./UpdateAdvisorModal";
import UpdatePolicyModal from "./UpdatePolicyModal";
import RenewallPolicyModal from "./RenewallPolicyModal";
import CommissionHistoryModal from "./CommissionHistoryModal";
import RegisterCommissionRefunds from "./RegisterCommissionRefunds";
import EditPolicyValuesModal from "./EditPolicyValuesModal";
import CreateTaskModal from "./CreateTaskModal";
import TaskModal from "./TaskModal";
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
  onCustomerUpdated,
  onAdvisorUpdated,
  onPolicyUpdated,
  commissionHistory,
  commissionRefunds,
  editPoliciesValues,
  userId,
  onTaskCreated,
  tasks,
  onTaskDeleted,
}) {
  if (!isOpen) return null;

  const getModalContent = () => {
    switch (modalType) {
      case "payment":
        return (
          <PaymentModalContent
            onClose={onClose}
            policy={policy} //onPaymentUpdate={onPaymentUpdate}
          />
        );
      case "info":
        return (
          <ListPolicyModal
            onClose={onClose}
            policy={policy} //onPaymentUpdate={onPaymentUpdate}
          />
        );
      case "renewal":
        return (
          <RenewallPolicyModal
            onClose={onClose}
            policy={policy}
            onPolicyUpdated={onPolicyUpdated}
          />
        );
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
      case "advisor":
        return <RegisterAdvanceModal onClose={onClose} advisorId={advisorId} />;
      case "updateCustomer":
        return (
          <UpdateCustomerModal
            onClose={onClose}
            customerId={customerId}
            onCustomerUpdated={onCustomerUpdated}
          />
        );
      case "updateAdvisor":
        return (
          <UpdateAdvisorModal
            onClose={onClose}
            advisorId={advisorId}
            onAdvisorUpdated={onAdvisorUpdated}
          />
        );
      case "updatePolicy":
        return (
          <UpdatePolicyModal
            onClose={onClose}
            policy={policy}
            onPolicyUpdated={onPolicyUpdated}
          ></UpdatePolicyModal>
        );
      case "commissionHistory":
        return (
          <CommissionHistoryModal
            onClose={onClose}
            advisorId={advisorId}
            commissionHistory={commissionHistory}
          ></CommissionHistoryModal>
        );

      case "commissionRefunds":
        return (
          <RegisterCommissionRefunds
            onClose={onClose}
            advisorId={advisorId}
            commissionRefunds={commissionRefunds}
          ></RegisterCommissionRefunds>
        );
      case "editPoliciesValues":
        return (
          <EditPolicyValuesModal
            onClose={onClose}
            policy={policy}
            editPoliciesValues={editPoliciesValues}
            onPolicyUpdated={onPolicyUpdated}
          />
        );
      case "task":
        return (
          <CreateTaskModal
            onClose={onClose}
            userId={userId}
            onTaskCreated={onTaskCreated}
          />
        );
      case "taskList":
        return (
          <TaskModal
            onClose={onClose}
            tasks={tasks}
            onTaskDeleted={onTaskDeleted}
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
  customerId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.object,
  ]),
  modalType: PropTypes.string.isRequired,
  policies: PropTypes.array.isRequired,
  cards: PropTypes.array.isRequired,
  payments: PropTypes.array.isRequired,
  advisorId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.object,
  ]),
  editPoliciesValues: PropTypes.array.isRequired,
  onAdvisorUpdated: PropTypes.func.isRequired,
  onCustomerUpdated: PropTypes.func.isRequired,
  onPolicyUpdated: PropTypes.func.isRequired,
  onPaymentUpdated: PropTypes.func.isRequired,
  commissionHistory: PropTypes.func.isRequired,
  commissionRefunds: PropTypes.func.isRequired,
  tasks: PropTypes.shape({
    id: PropTypes.number.isRequired,
    description: PropTypes.string.isRequired,
    estatusTask: PropTypes.string.isRequired,
  }).isRequired,
  userId: PropTypes.string,
  onTaskCreated: PropTypes.func,
  onTaskDeleted: PropTypes.func.isRequired,
};
