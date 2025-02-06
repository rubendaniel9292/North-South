import PropTypes from "prop-types";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
import { faFile } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import generateReport from "../GenerateReportPDF";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import usePagination from "../../hooks/usePagination";
const ListPolicyModal = ({ policy, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  if (!policy) return null;
  const itemsPerPage = 5; // Número de items por página

  const handleGenerateReport = (e) => {
    e.preventDefault();
    console.log("Generating report with policy data:", policy);
    generateReport(
      policy,
      "generate-report-pdf/download-policy",
      `data-report.pdf`,
      setIsLoading
    );
  };

  // Usar el hook personalizado para la paginación de pagos
  const {
    currentPage: currentPaymentsPage,
    currentItems: currentPayments,
    totalPages: totalPaymentsPages,
    paginate: paginatePayments,
  } = usePagination(policy.payments, itemsPerPage);

  // Usar el hook personalizado para la paginación de renovaciones
  const {
    currentPage: currentRenewalsPage,
    currentItems: currentRenewals,
    totalPages: totalRenewalsPages,
    paginate: paginateRenewals,
  } = usePagination(policy.renewals || [], itemsPerPage);

  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto ">
        <article className="modal-content text-center px-5 py-4">
          <div className="d-flex justify-content-center align-items-center conten-title mb-3 rounded">
            <h3 className="text-white">
              Información completa de la póliza {policy.numberPolicy}
            </h3>
          </div>

          <table className="table table-striped">
            <thead>
              <tr>
                <th>Número de Póliza</th>
                <th>Cliente</th>
                <th>Compañía</th>
                <th>Tipo de Póliza</th>
                <th>Fecha de Inicio</th>
                <th>Fecha de Fin</th>
                <th>Método de Pago</th>
                <th>Banco (si aplica)</th>
                <th>Frecuencia de Pago</th>
                <th>Comisión por renovación</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{policy.numberPolicy}</td>
                <td>
                  {policy.customer.firstName} {policy.customer.surname}
                </td>
                <td>{policy.company.companyName}</td>
                <td>{policy.policyType.policyName}</td>
                <td>{dayjs(policy.startDate).format("DD/MM/YYYY")}</td>
                <td>{dayjs(policy.endDate).format("DD/MM/YYYY")}</td>
                <td>{policy.paymentMethod.methodName}</td>
                <td>
                  {policy.bankAccount && policy.bankAccount.bank
                    ? policy.bankAccount.bank.bankName
                    : policy.creditCard && policy.creditCard.bank
                    ? policy.creditCard.bank.bankName
                    : "NO APLICA"}
                </td>
                <td>{policy.paymentFrequency.frequencyName}</td>
                <td>{policy.renewalCommission === true ? "SÍ" : "NO"}</td>
              </tr>
            </tbody>

            <thead>
              <tr>
                <th>Monto de Cobertura</th>
                <th>Porcentaje de la Agencia</th>
                <th>Porcentaje del Asesor</th>
                <th>Valor de la Póliza</th>
                <th>Número de Pagos</th>
                <th>Derecho de Póliza</th>
                <th>Comisiones al asesor</th>
                <th>Estado</th>
                <th colSpan="2" scope="row">
                  Observaciones
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{policy.coverageAmount}</td>
                <td>{policy.agencyPercentage}</td>
                <td>{policy.advisorPercentage}</td>
                <td>{policy.policyValue}</td>
                <td>{policy.numberOfPayments}</td>
                <td>{policy.policyFee || "NO APLICA"}</td>
                <td>{policy.paymentsToAdvisor}</td>
                <td
                  className={
                    policy.policyStatus.id == 4
                      ? "bg-warning text-white fw-bold"
                      : policy.policyStatus.id == 3
                      ? "bg-danger text-white fw-bold"
                      : "bg-success-subtle"
                  }
                >
                  {policy.policyStatus.statusName}
                </td>

                <td colSpan="2" scope="row">
                  {policy.observations || "N/A"}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="d-flex justify-content-center align-items-center conten-title rounded mb-2 mt-2">
            <h3 className="text-white">Historial de pagos</h3>
          </div>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Orden</th>
                <th>N° de Pago</th>
                <th>Saldo Pendiente</th>
                <th>Valor</th>
                <th>Abono</th>
                <th>Saldo</th>
                <th>Total</th>
                <th>Fecha de pago</th>
                <th>Estado</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {currentPayments
                //slice(0, policy.numberOfPayments) // Mostrar solo los pagos permitidos
                .map((payment, index) => (
                <tr key={payment.id}>
                  <td>
                    {(currentPaymentsPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td>{payment.number_payment}</td>
                  <td>{payment.pending_value}</td>
                  <td>{payment.value || "0.00"}</td>
                  <td>{payment.credit || "0.00"}</td>
                  <td>{payment.balance || "0.00"}</td>
                  <td>{payment.total}</td>
                  <td>{dayjs(payment.createdAt).format("DD/MM/YYYY")}</td>

                  <td
                    className={
                      payment.paymentStatus.id == 1
                        ? "bg-warning"
                        : payment.paymentStatus.id == 2
                        ? "bg-success-subtle "
                        : ""
                    }
                  >
                    {payment.paymentStatus.statusNamePayment}
                  </td>
                  <td>{payment.observations || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPaymentsPages > 1 && (
            <nav aria-label="Page navigation example">
              <ul className="pagination">
                <li
                  className={`page-item${
                    currentPaymentsPage === 1 ? " disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => paginatePayments(currentPaymentsPage - 1)}
                  >
                    Anterior
                  </button>
                </li>
                {Array.from(
                  { length: totalPaymentsPages },
                  (_, i) => i + 1
                ).map((number) => (
                  <li
                    key={number}
                    className={`page-item${
                      currentPaymentsPage === number ? " active" : ""
                    }`}
                  >
                    <button
                      onClick={() => paginatePayments(number)}
                      className="page-link"
                    >
                      {number}
                    </button>
                  </li>
                ))}
                <li
                  className={`page-item${
                    currentPaymentsPage === totalPaymentsPages
                      ? " disabled"
                      : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => paginatePayments(currentPaymentsPage + 1)}
                  >
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
          )}
          <div className="d-flex justify-content-center align-items-center conten-title rounded mb-2 mt-2">
            <h3 className="text-white">Historial de renovaciones</h3>
          </div>

          <table className="table table-striped">
            <thead>
              <tr className="table-header">
                <th>Numero de renovacion</th>
                <th>Fecha de renovacion</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            {currentRenewals.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan="3" className="text-center">
                    Aún no se han registrado renovaciones
                  </td>
                </tr>
              </tbody>
            ) : (
              <>
                <tbody>
                  {currentRenewals.map((renewal) => (
                    <tr key={renewal.id}>
                      <td>
                        {(currentRenewalsPage - 1) * itemsPerPage + index + 1}
                      </td>

                      <td>{renewal.renewalNumber}</td>
                      <td>{dayjs(renewal.createdAt).format("DD/MM/YYYY")}</td>
                      <td>{renewal.observations || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </table>
          {totalRenewalsPages > 1 && (
            <nav aria-label="Page navigation example">
              <ul className="pagination">
                <li
                  className={`page-item${
                    currentRenewalsPage === 1 ? " disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => paginateRenewals(currentRenewalsPage - 1)}
                  >
                    Anterior
                  </button>
                </li>
                {Array.from(
                  { length: totalRenewalsPages },
                  (_, i) => i + 1
                ).map((number) => (
                  <li
                    key={number}
                    className={`page-item${
                      currentRenewalsPage === number ? " active" : ""
                    }`}
                  >
                    <button
                      onClick={() => paginateRenewals(number)}
                      className="page-link"
                    >
                      {number}
                    </button>
                  </li>
                ))}
                <li
                  className={`page-item${
                    currentRenewalsPage === totalRenewalsPages
                      ? " disabled"
                      : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => paginateRenewals(currentRenewalsPage + 1)}
                  >
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
          )}

          <div className="d-flex justify-content-around mt-1">
            <div className="">
              <button
                type="submit"
                onClick={handleGenerateReport}
                id="btnc"
                className="btn bg-success mx-5 text-white fw-bold "
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="spinner-border text-light" role="status">
                    <span className="visually-hidden">Registrando...</span>
                  </div>
                ) : (
                  "Generar reporte PDF"
                )}
                <FontAwesomeIcon className="mx-2" beat icon={faFile} />
              </button>

              <button
                type="submit"
                onClick={onClose}
                id="btnc"
                className="btn bg-danger mx-5 text-white fw-bold"
              >
                Cerrar
                <FontAwesomeIcon
                  className="mx-2"
                  beat
                  icon={faRectangleXmark}
                />
              </button>
            </div>
          </div>
        </article>
      </div>
    </>
  );
};

ListPolicyModal.propTypes = {
  policy: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Hacer opcional y permitir string o number
    numberPolicy: PropTypes.string.isRequired,
    coverageAmount: PropTypes.string.isRequired,
    agencyPercentage: PropTypes.string.isRequired,
    advisorPercentage: PropTypes.string,
    policyValue: PropTypes.string.isRequired,
    numberOfPayments: PropTypes.number,
    startDate: PropTypes.string, // o PropTypes.instanceOf(Date) si es un objeto Date
    endDate: PropTypes.string,
    paymentsToAdvisor: PropTypes.string,
    policyFee: PropTypes.string,
    observations: PropTypes.string,
    renewalCommission: PropTypes.bool,

    policyType: PropTypes.shape({
      policyName: PropTypes.string.isRequired,
    }).isRequired,

    customer: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Hacer opcional y permitir string o number
      ci_ruc: PropTypes.string.isRequired,
      firstName: PropTypes.string.isRequired,
      secondName: PropTypes.string,
      surname: PropTypes.string.isRequired,
      secondSurname: PropTypes.string,
    }).isRequired,

    company: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Hacer opcional y permitir string o number
      companyName: PropTypes.string.isRequired,
    }).isRequired,

    advisor: PropTypes.shape({
      firstName: PropTypes.string.isRequired,
      secondName: PropTypes.string,
      surname: PropTypes.string.isRequired,
      secondSurname: PropTypes.string,
    }).isRequired,

    paymentMethod: PropTypes.shape({
      methodName: PropTypes.string.isRequired,
    }).isRequired,

    bankAccount: PropTypes.shape({
      bank_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Hacer opcional y permitir string o number
      bank: PropTypes.shape({
        bankName: PropTypes.string.isRequired,
      }).isRequired,
    }),

    creditCard: PropTypes.shape({
      bank_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Hacer opcional y permitir string o number
      bank: PropTypes.shape({
        bankName: PropTypes.string.isRequired,
      }).isRequired,
    }),

    policyStatus: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Hacer opcional y permitir string o number
      statusName: PropTypes.string.isRequired,
    }).isRequired,

    paymentFrequency: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Hacer opcional y permitir string o number
      frequencyName: PropTypes.string.isRequired,
    }).isRequired,

    payments: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired, // Hacer opcional y permitir string o number
        pending_value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired,
        number_payment: PropTypes.number.isRequired,
        value: PropTypes.string.isRequired,
        credit: PropTypes.string.isRequired,
        balance: PropTypes.string.isRequired,
        total: PropTypes.string.isRequired,
        observations: PropTypes.string,
        createdAt: PropTypes.string.isRequired,
        status_payment_id: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.number,
        ]).isRequired, // Hacer opcional y permitir string o number
        paymentStatus: PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired, // Hacer opcional y permitir string o number
          statusNamePayment: PropTypes.string.isRequired,
        }).isRequired,
        updatedAt: PropTypes.string.isRequired,
      })
    ).isRequired,

    renewals: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired, // Hacer opcional y permitir string o number
        renewalNumber: PropTypes.string.isRequired,
        createdAt: PropTypes.string.isRequired,
      }).isRequired
    ),
  }).isRequired,

  onClose: PropTypes.func.isRequired,
};

export default ListPolicyModal;
