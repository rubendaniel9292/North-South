import PropTypes from "prop-types";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { faRectangleXmark, faFile } from "@fortawesome/free-solid-svg-icons";
import { useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import http from "../../helpers/Http";
import UserForm from "../../hooks/UserForm";
import alerts from "../../helpers/Alerts";

export const CommissionHistoryModal = ({ onClose, advisorId }) => {
  const [isLoading, setIsLoading] = useState(false);
  if (!advisorId) return null;

  // Helper: Comisiones totales (hasta la fecha)
  const calculateCommissionValue = useCallback((policy) => {
    if (!policy) return 0;
    if (policy.renewalCommission === false) {
      return Number(policy.paymentsToAdvisor) || 0;
    }
    const perPeriod =
      Number(policy.paymentsToAdvisor) /
      Number(policy.numberOfPaymentsAdvisor || 1);
    return perPeriod * (policy.payments ? policy.payments.length : 0);
  }, []);

  // Helper: Comisiones liberadas (solo pagos AL DÍA)
  const calculateReleasedCommissions = useCallback((policy) => {
    if (!policy || !Array.isArray(policy.payments)) return 0;
    const agencyPercentage = Number(policy.agencyPercentage || 0) / 100;
    const advisorPercentage = Number(policy.advisorPercentage || 0) / 100;
    // Solo pagos con paymentStatus.id === 2 ("AL DÍA")
    const releasedPayments = policy.payments.filter(
      (payment) => payment.paymentStatus && payment.paymentStatus.id == 2
    );
    return releasedPayments.reduce((total, payment) => {
      const value = Number(payment.value || 0);
      const agencyCommission = value * agencyPercentage;
      const advisorCommission = agencyCommission * advisorPercentage;
      return total + advisorCommission;
    }, 0);
  }, []);

  return (
    <div className="modal d-flex justify-content-center align-items-center mx-auto">
      <article className="modal-content text-center px-5 py-4">
        <div className="d-flex justify-content-center align-items-center conten-title mb-3 rounded">
          <h3 className="text-white">
            Historial de comisiones o anticipos de {advisorId.firstName}{" "}
            {advisorId.surname} {advisorId.secondSurname}{" "}
            {advisorId.secondSurname}
          </h3>
        </div>
        <div className="row pt-2">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>N° de póliza</th>
                <th>Cliente </th>
                <th>
                  Comisiones totales <span>(hasta la fecha)</span>
                </th>
                <th>Comisiones liberadas</th>
                <th>Comisiones pagadas</th>
                <th>Comisiones a favor</th>
              </tr>
            </thead>
            <tbody>
              {/* Anticipos generales */}
              {advisorId.commissions &&
                advisorId.commissions.filter((c) => !c.policy_id).length >
                  0 && (
                  <>
                    <tr>
                      <td className="fw-bold">ANTICIPO</td>
                      <td className="fw-bold">-</td>
                      <td colSpan={4} className="fw-bold">
                        Anticipos generales sin póliza asignada
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={6}>
                        <table className="table table-sm table-bordered mb-0">
                          <thead>
                            <tr>
                              <th>Fecha de pago</th>
                              <th>Número de recibo</th>
                              <th>Monto abonado</th>
                              <th>Observaciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {advisorId.commissions
                              .filter((c) => !c.policy_id)
                              .map((anticipo) => (
                                <tr key={anticipo.id}>
                                  <td>
                                    <span>
                                      {anticipo.createdAt
                                        ? dayjs(anticipo.createdAt).format(
                                            "DD/MM/YYYY"
                                          )
                                        : "-"}
                                    </span>
                                  </td>
                                  <td>{anticipo.receiptNumber}</td>
                                  <td>
                                    $
                                    <span>
                                      {Number(anticipo.advanceAmount).toFixed(
                                        2
                                      )}
                                    </span>
                                  </td>
                                  <td>{anticipo.observations || "-"}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </>
                )}
              {/* Historial por póliza */}
              {advisorId.policies.map((policy) => {
                // --- Cálculos consistentes con el modal de registro ---
                const commissionValue = calculateCommissionValue(policy);
                const released = calculateReleasedCommissions(policy);
                const maxLiberated = Math.min(released, commissionValue);
                const commissionsPaid = Array.isArray(
                  policy.commissionsPayments
                )
                  ? policy.commissionsPayments.reduce(
                      (total, payment) =>
                        total + (Number(payment.advanceAmount) || 0),
                      0
                    )
                  : 0;
                const maxPaid = Math.min(commissionsPaid, maxLiberated);
                const commissionsAfavor = Math.max(0, maxLiberated - maxPaid);

                return (
                  <tr key={policy.id}>
                    <td className="fw-bold">{policy.numberPolicy}</td>
                    <td className="fw-bold">
                      {policy.customer
                        ? [
                            policy.customer.firstName,
                            policy.customer.secondName,
                            policy.customer.surname,
                            policy.customer.secondSurname,
                          ]
                            .filter(Boolean)
                            .join(" ")
                        : "N/A"}
                    </td>
                    <td className="bg-info fw-bold">
                      ${Number(commissionValue).toFixed(2)}
                    </td>
                    <td className="fw-bold bg-warning">
                      ${Number(maxLiberated).toFixed(2)}
                    </td>
                    <td className="fw-bold bg-primary text-white">
                      ${Number(maxPaid).toFixed(2)}
                    </td>
                    <td className="bg-success-subtle fw-bold">
                      ${Number(commissionsAfavor).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {/* Subtabla de historial de pagos para cada póliza */}
              {advisorId.policies.map((policy) =>
                Array.isArray(policy.commissionsPayments) &&
                policy.commissionsPayments.length > 0 ? (
                  <tr key={`payments-${policy.id}`}>
                    <td colSpan={6}>
                      <table className="table table-sm table-bordered mb-0">
                        <thead>
                          <tr>
                            <th>Fecha de pago</th>
                            <th>Número de recibo</th>
                            <th>Monto abonado</th>
                            <th>Observaciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {policy.commissionsPayments.map((payment) => (
                            <tr key={payment.id}>
                              <td>
                                {payment.createdAt
                                  ? dayjs(payment.createdAt).format(
                                      "DD/MM/YYYY"
                                    )
                                  : "-"}
                              </td>
                              <td>{payment.receiptNumber}</td>
                              <td>
                                ${Number(payment.advanceAmount).toFixed(2)}
                              </td>
                              <td>{payment.observations || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                ) : null
              )}
            </tbody>
          </table>
        </div>
        <div className="d-flex justify-content-center align-items-center">
          <div>
            <button
              type="button"
              id="btnc"
              className="btn bg-success mx-5 text-white fw-bold"
              disabled={isLoading}
              //onClick={generateReport}
            >
              {isLoading ? (
                <div className="spinner-border text-light" role="status">
                  <span className="visually-hidden">Generando reporte...</span>
                </div>
              ) : (
                "Generar reporte PDF"
              )}
              <FontAwesomeIcon className="mx-2" beat icon={faFile} />
            </button>
            <button
              type="button"
              onClick={onClose}
              id="btnc"
              className="btn bg-danger mx-5 text-white fw-bold"
            >
              Cerrar
              <FontAwesomeIcon className="mx-2" beat icon={faRectangleXmark} />
            </button>
          </div>
        </div>
      </article>
    </div>
  );
};

CommissionHistoryModal.propTypes = {
  advisorId: PropTypes.shape({
    id: PropTypes.number.isRequired,
    firstName: PropTypes.string.isRequired,
    secondName: PropTypes.string,
    surname: PropTypes.string.isRequired,
    secondSurname: PropTypes.string,
    commissions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        receiptNumber: PropTypes.string.isRequired,
        company_id: PropTypes.number.isRequired,
        payment_method_id: PropTypes.number.isRequired,
        advanceAmount: PropTypes.number.isRequired,
        createdAt: PropTypes.string.isRequired,
        observations: PropTypes.string,
        policy_id: PropTypes.number,
      })
    ),
    policies: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        numberPolicy: PropTypes.string.isRequired,
        payment_frequency_id: PropTypes.string.isRequired,
        numberOfPaymentsAdvisor: PropTypes.number.isRequired,
        paymentsToAdvisor: PropTypes.number.isRequired,
        renewalCommission: PropTypes.bool.isRequired,
        advisorPercentage: PropTypes.number.isRequired,
        agencyPercentage: PropTypes.number.isRequired,
        totalCommission: PropTypes.number.isRequired,
        company_id: PropTypes.number.isRequired,
        commissionsPayments: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number.isRequired,
            receiptNumber: PropTypes.string.isRequired,
            company_id: PropTypes.number.isRequired,
            payment_method_id: PropTypes.number.isRequired,
            advanceAmount: PropTypes.number.isRequired,
            createdAt: PropTypes.string.isRequired,
            observations: PropTypes.string,
          })
        ),
        payments: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number.isRequired,
            paymentDate: PropTypes.string.isRequired,
            paymentAmount: PropTypes.number.isRequired,
            paymentStatus: PropTypes.shape({
              id: PropTypes.number.isRequired,
              statusName: PropTypes.string.isRequired,
            }),
            value: PropTypes.number, // Para el cálculo de liberadas
          })
        ),
        customer: PropTypes.shape({
          firstName: PropTypes.string,
          secondName: PropTypes.string,
          surname: PropTypes.string,
          secondSurname: PropTypes.string,
        }),
      })
    ),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CommissionHistoryModal;
