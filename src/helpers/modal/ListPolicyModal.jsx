import PropTypes from "prop-types";
import dayjs from "dayjs";
import http from "../../helpers/Http";
import "dayjs/locale/es";

import { useState } from "react";
import generateReport from "../GenerateReportPDF";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFloppyDisk,
  faCircleCheck,
  faRectangleXmark,
  faFile,
  faBarcode,
  faUser,
  faBuilding,
  faFileContract,
  faCalendarAlt,
  faCreditCard,
  faUniversity,
  faSync,
  faPercent,
  faShield,
  faDollarSign,
  faCheckCircle,
  faMoneyBillWave,
  faHashtag,
  faBalanceScale,
  faPlus,
  faMinus
} from "@fortawesome/free-solid-svg-icons";
import usePagination from "../../hooks/usePagination";
import alerts from "../../helpers/Alerts";
import useAuth from "../../hooks/useAuth";
const ListPolicyModal = ({ policy, onClose }) => {
  const [reportLoading, setReportLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState({});
  const [localPolicy, setLocalPolicy] = useState(policy);
  const { auth } = useAuth();
  if (!localPolicy) return null;
  const itemsPerPage = 3; // Número de items por página
  //metodo para generacion de reporte
  const handleGenerateReport = (e) => {
    e.preventDefault();
    console.log("Generating report with policy data:", localPolicy);
    generateReport(
      { type: "policy", data: localPolicy }, // Para reporte de póliza
      "generate-report-pdf/download",
      "policy-report.pdf",
      setReportLoading
    );
  };

  // Usar el hook personalizado para la paginación de pagos
  const {
    currentPage: currentPaymentsPage,
    currentItems: currentPayments,
    totalPages: totalPaymentsPages,
    paginate: paginatePayments,
  } = usePagination(localPolicy.payments, itemsPerPage);

  // Usar el hook personalizado para la paginación de renovaciones
  const {
    currentPage: currentRenewalsPage,
    currentItems: currentRenewals,
    totalPages: totalRenewalsPages,
    paginate: paginateRenewals,
  } = usePagination(localPolicy.renewals || [], itemsPerPage);

  // Función para determinar si un botón de pago debe estar habilitado
  const isPaymentButtonEnabled = (currentPayment, allPayments) => {
    // ✅ Cambiar === por == para comparación flexible
    if (currentPayment.paymentStatus.id == 2) return false;

    // Si está cargando, deshabilitado
    if (paymentLoading[currentPayment.id]) return false;

    // Ordenar pagos por número para verificar secuencia
    const sortedPayments = [...allPayments].sort(
      (a, b) => a.number_payment - b.number_payment
    );

    // Encontrar el primer pago que NO esté al día
    const firstPendingPayment = sortedPayments.find(
      (payment) => payment.paymentStatus.id != 2 // ✅ Cambiar !== por !=
    );

    // Solo habilitar si es el primer pago pendiente
    return firstPendingPayment && firstPendingPayment.id === currentPayment.id;
  };

  //metodo de para actualzar pagos
  const updatePaymentStatus = async (payment) => {
    setPaymentLoading((prev) => ({ ...prev, [payment.id]: true }));
    try {
      //e.preventDefault();
      // Solo actualizamos el estado del pago a "al día" y la fecha de actualización
      // será automática en el servidor
      const updatedPayment = {
        status_payment_id: 2, // ID que corresponde a "al día"
        policy_id: policy.id,
        credit: Number(payment.value), // El abono será igual al valor total
        balance: 0, // El saldo pendiente debe quedar en 0
        total: Number(payment.value), // El total será igual al valor original del pago
      };

      const response = await http.put(
        `payment/update-payment/${payment.id}`,
        updatedPayment
      );

      if (response.data.status === "success") {
        // Llamar después de actualizar exitosamente
        // Actualizar el estado local del pago
        const updatedPayments = localPolicy.payments.map((p) => {
          if (p.id === payment.id) {
            return {
              ...p,
              paymentStatus: {
                id: 2,
                statusNamePayment: "Al día",
              },
              credit: payment.value, // El abono será igual al valor del pago
              balance: "0.00", // El saldo queda en 0 porque ya está pagado
              // ✅ CORREGIR: NO cambiar pending_value, mantener el valor original
              // pending_value: "0.00", // ❌ ELIMINAR esta línea
              total: String(payment.value), // ✅ ASEGURAR: Mantener como string para consistencia
              updatedAt: new Date().toISOString(),
            };
          }
          return p;
        });

        setTimeout(() => {
          // Actualizar el estado local de la póliza con los pagos actualizados
          setLocalPolicy((prevPolicy) => ({
            ...prevPolicy,
            payments: updatedPayments,
          }));
          alerts(
            "Actualización exitosa",
            "Pago actualizado correctamente",
            "success"
          );
        }, 100); // ✅ REDUCIR: Tiempo mínimo para evitar problemas de renderizado

        if (
          payment.pending_value <= 0 &&
          payment.number_payment >= policy.numberOfPayments
        ) {
          alerts(
            "Pagos Completados",
            "Todos los pagos para este periodo han sido completados.",
            "info"
          );
        }
      } else {
        alerts(
          "Error",
          "Pago no actualizado correctamente. Verificar que no haya campos vacíos o datos incorrectos",
          "error"
        );
      }
    } catch (error) {
      alerts("Error", "Error actualizando el pago.", "error");
      console.error("Error actualizando el pago:", error);
    } finally {
      setPaymentLoading((prev) => ({ ...prev, [payment.id]: false }));
    }
  };
  // Badge Bootstrap helper
  const Badge = ({ text, color = "secondary" }) => (
    <span className={`badge rounded-pill fw-bold fs-6 bg-${color} fw-semibold`}>
      {text}
    </span>
  );
  // Función para obtener la fecha del próximo pago pendiente
  const getNextPaymentDate = (policy) => {
    // Encuentra el último pago realizado
    const lastPayment = policy.payments?.length
      ? policy.payments.reduce((latest, p) => {
        const date = new Date(p.createdAt);
        return date > new Date(latest.createdAt) ? p : latest;
      }, policy.payments[0])
      : null;

    if (!lastPayment) return "Sin pagos registrados";

    const lastDate = new Date(lastPayment.createdAt);

    // Suma el intervalo según la frecuencia
    switch (policy.paymentFrequency?.frequencyName) {
      case "Mensual":
        lastDate.setMonth(lastDate.getMonth() + 1);
        break;
      case "Trimestral":
        lastDate.setMonth(lastDate.getMonth() + 3);
        break;
      case "Semestral":
        lastDate.setMonth(lastDate.getMonth() + 6);
        break;
      case "Anual":
        lastDate.setFullYear(lastDate.getFullYear() + 1);
        break;
      default:
        lastDate.setMonth(lastDate.getMonth() + 1); // Por defecto mensual
    }

    return lastDate.toLocaleDateString();
  };

  // obtener último periodo registrado (por año mayor):
  const lastPeriod = policy.periods.reduce((a, b) => (a.year > b.year ? a : b));
  console.log("periods:", policy.periods);
  console.log("lastPeriod:", lastPeriod);
  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto ">
        <article className="modal-content text-center px-5 py-4">
          <div className="d-flex justify-content-center align-items-center conten-title mb-3 rounded">
            <h3 className="text-white">
              <FontAwesomeIcon icon={faFileContract} className="me-2" />
              Información completa de la póliza {policy.numberPolicy}
            </h3>
          </div>

          <table className="table table-striped">
            <thead>
              <tr>
                <th>
                  <FontAwesomeIcon icon={faBarcode} className="me-2" />
                  Número de Póliza
                </th>
                <th colSpan={2}>
                  <FontAwesomeIcon icon={faUser} className="me-2" />
                  Cliente
                </th>
                <th>
                  <FontAwesomeIcon icon={faBuilding} className="me-2" />
                  Compañía
                </th>
                <th>
                  <FontAwesomeIcon icon={faFileContract} className="me-2" />
                  Tipo de Póliza
                </th>
                <th>
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  Fecha de Inicio
                </th>
                <th>
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  Fecha de Fin
                </th>
                <th>
                  <FontAwesomeIcon icon={faCreditCard} className="me-2" />
                  Método de Pago
                </th>
                <th>
                  <FontAwesomeIcon icon={faUniversity} className="me-2" />
                  Banco (si aplica)
                </th>
                <th>
                  <FontAwesomeIcon icon={faSync} className="me-2" />
                  Frecuencia de Pago
                </th>
                <th>
                  <FontAwesomeIcon icon={faPercent} className="me-2" />
                  Comisión por renovación
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{policy.numberPolicy}</td>
                <td colSpan={2}>
                  {policy.customer.firstName} {policy.customer.secondName}{" "}
                  {policy.customer.surname} {policy.customer.secondSurname}
                </td>
                <td>{policy.company.companyName}</td>
                <td>{policy.policyType.policyName}</td>
                <td>{dayjs.utc(policy.startDate).format("DD-MM-YYYY")}</td>
                <td>{dayjs.utc(policy.endDate).format("DD-MM-YYYY")}</td>
                <td>{policy.paymentMethod.methodName}</td>
                <td>
                  {policy.bankAccount && policy.bankAccount.bank
                    ? policy.bankAccount.bank.bankName
                    : policy.creditCard && policy.creditCard.bank
                      ? policy.creditCard.bank.bankName
                      : "NO APLICA"}
                </td>
                <td>{policy.paymentFrequency.frequencyName}</td>
                <td>
                  <Badge
                    className=""
                    text={policy.renewalCommission === true ? "SI" : "NO"}
                    color={
                      policy.renewalCommission === true ? "dark" : "danger"
                    }
                  />
                </td>
              </tr>
            </tbody>

            <thead>
              <tr>
                <th>
                  <FontAwesomeIcon icon={faSync} className="me-2" />
                  Frecuencia de Comisiones
                </th>
                <th>
                  <FontAwesomeIcon icon={faShield} className="me-2" />
                  Monto de Cobertura
                </th>
                <th>
                  <FontAwesomeIcon icon={faPercent} className="me-2" />
                  Porcentaje de la Agencia
                </th>
                <th>
                  <FontAwesomeIcon icon={faPercent} className="me-2" />
                  Porcentaje del Asesor
                </th>
                <th>
                  <FontAwesomeIcon icon={faDollarSign} className="me-2" />
                  Valor de la Póliza
                </th>
                <th>
                  <FontAwesomeIcon icon={faHashtag} className="me-2" />
                  Número de Pagos
                </th>
                <th>
                  <FontAwesomeIcon icon={faDollarSign} className="me-2" />
                  Derecho de Póliza
                </th>
                <th>
                  <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                  Comisiones de la agencia
                </th>
                <th>
                  <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                  Comisiones del asesor
                </th>
                <th>
                  <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                  Estado
                </th>
                <th colSpan="2" scope="row">
                  <FontAwesomeIcon icon={faFile} className="me-2" />
                  Observaciones
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <Badge
                    className="fw-bold fs-6"
                    text={
                      policy.isCommissionAnnualized === false
                        ? "Normal"
                        : "Anualizada"
                    }
                    color={
                      policy.isCommissionAnnualized === false
                        ? "info"
                        : "secondary"
                    }
                  />
                </td>
                <td>{policy.coverageAmount}</td>
                {/* Asegurarse de que los porcentajes sean cadenas o números 
                <td>{policy.agencyPercentage}</td>
                <td>{policy.advisorPercentage}</td>
                <td>{policy.policyValue}</td>
                <td>{policy.numberOfPayments}</td>
                <td>{policy.policyFee || "NO APLICA"}</td>
                <td>{policy.paymentsToAgency}</td>
                <td>{policy.paymentsToAdvisor}</td>*/}
                <td>{lastPeriod.agencyPercentage}</td>
                <td>{lastPeriod.advisorPercentage}</td>
                <td>{lastPeriod.policyValue}</td>
                <td>{policy.numberOfPayments}</td>
                <td>{lastPeriod.policyFee}</td>

                <td>
                  {(
                    ((lastPeriod.policyValue - lastPeriod.policyFee) *
                      lastPeriod.agencyPercentage) /
                    100 -
                    ((lastPeriod.policyValue - lastPeriod.policyFee) *
                      lastPeriod.advisorPercentage) /
                    100
                  ).toFixed(2)}
                </td>
                <td>
                  {(
                    ((lastPeriod.policyValue - lastPeriod.policyFee) *
                      lastPeriod.advisorPercentage) /
                    100
                  ).toFixed(2)}
                </td>
                <td>
                  <span
                    className={`badge fw-bold fs-6 ${policy.policyStatus?.id == 1
                      ? "bg-success" // Activa - Verde
                      : policy.policyStatus?.id == 2
                        ? "bg-danger" // Cancelada - Rojo
                        : policy.policyStatus?.id == 3
                          ? "bg-secondary" // Culminada - Gris
                          : policy.policyStatus?.id == 4
                            ? "bg-warning text-dark" // Por Culminar - Amarillo
                            : "bg-light text-dark" // Default - Claro
                      }`}
                  >
                    {policy.policyStatus.statusName}
                  </span>
                </td>

                <td colSpan="2" scope="row">
                  {policy.observations || "N/A"}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="d-flex  justify-content-center align-items-center conten-title rounded mb-2 mt-2">
            <h3 className="text-white">
              <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
              Historial de pagos:
            </h3>

            <span className="badge  fs-5">
              <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
              Próxima fecha tentativa de cobro: {getNextPaymentDate(policy)}
            </span>
          </div>
          <table className="table table-striped">
            <thead>
              <tr>
                {/*<th>Orden</th>*/}
                <th>
                  <FontAwesomeIcon icon={faHashtag} className="me-2" />
                  N° de Pago
                </th>
                <th>
                  <FontAwesomeIcon icon={faBalanceScale} className="me-2" />
                  Saldo Pendiente
                </th>
                <th>
                  <FontAwesomeIcon icon={faDollarSign} className="me-2" />
                  Valor
                </th>
                <th>
                  <FontAwesomeIcon icon={faPlus} className="me-2" />
                  Abono
                </th>
                <th>
                  <FontAwesomeIcon icon={faMinus} className="me-2" />
                  Saldo
                </th>
                <th>
                  <FontAwesomeIcon icon={faDollarSign} className="me-2" />
                  Total
                </th>
                <th>
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  Fecha de pago fija
                </th>
                <th>
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  Fecha de actualizacion
                </th>
                <th>
                  <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                  Estado
                </th>
                <th>
                  <FontAwesomeIcon icon={faFile} className="me-2" />
                  Observaciones
                </th>
                <th>
                  <FontAwesomeIcon icon={faFloppyDisk} className="me-2" />
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {currentPayments
                //slice(0, policy.numberOfPayments) // Mostrar solo los pagos permitidos
                .map((payment) => {
                  // Busca el periodo por año, si payment.year existe
                  const period = policy.periods.find(
                    (p) => p.year === payment.year
                  );
                  return (
                    <tr key={payment.id}>
                      {/*
                    <td>
                      {(currentPaymentsPage - 1) * itemsPerPage + index + 1}
                    </td>*/}
                      <td>{payment.number_payment}</td>
                      <td>{payment.pending_value}</td>
                      <td>{payment.value || "0.00"}</td>
                      <td>{payment.credit || "0.00"}</td>
                      <td>{payment.balance || "0.00"}</td>
                      <td>{payment.total}</td>
                      <td>
                        {dayjs.utc(payment.createdAt).format("DD/MM/YYYY")}
                      </td>

                      {payment.paymentStatus.id == 1 ? (
                        <td>{""}</td>
                      ) : (
                        <td>
                          {dayjs.utc(payment.updatedAt).format("DD/MM/YYYY")}
                        </td>
                      )}

                      <td>
                        <span
                          className={`badge fw-bold fs-6 ${payment.paymentStatus.id == 1
                            ? "bg-warning text-dark" // Pendiente - Amarillo
                            : payment.paymentStatus.id == 2
                              ? "bg-success" // Al día - Verde
                              : "bg-light text-dark" // Default - Claro
                            }`}
                        >
                          {payment.paymentStatus.statusNamePayment}
                        </span>
                      </td>

                      <td>{payment.observations || "N/A"}</td>
                      <td>
                        <button
                          type="button"
                          disabled={
                            !isPaymentButtonEnabled(
                              payment,
                              localPolicy.payments
                            )
                          }
                          className={`btn ${payment.paymentStatus.id == 2
                            ? "bg-secondary"
                            : isPaymentButtonEnabled(
                              payment,
                              localPolicy.payments
                            )
                              ? "bg-success"
                              : "bg-secondary" // Deshabilitado si no es el siguiente en la secuencia
                            } fw-bold text-white w-100`}
                          onClick={() => updatePaymentStatus(payment)}
                        >
                          {paymentLoading[payment.id] ? (
                            <>
                              <div
                                className="spinner-border spinner-border-sm text-light me-2"
                                role="status"
                              >
                                <span className="visually-hidden">
                                  Loading...
                                </span>
                              </div>
                              <span>Actualizando...</span>
                            </>
                          ) : payment.paymentStatus.id == 2 ? (
                            "Pago al día"
                          ) : isPaymentButtonEnabled(
                            payment,
                            localPolicy.payments
                          ) ? (
                            "Actualizar Pago"
                          ) : (
                            "Pendiente de orden" // Texto para botones deshabilitados
                          )}
                          {payment.paymentStatus.id == 2 ? (
                            <FontAwesomeIcon
                              className="mx-2"
                              icon={faCircleCheck}
                            />
                          ) : isPaymentButtonEnabled(
                            payment,
                            localPolicy.payments
                          ) ? (
                            <FontAwesomeIcon
                              className="mx-2"
                              icon={faFloppyDisk}
                              beat
                            />
                          ) : (
                            <FontAwesomeIcon
                              className="mx-2"
                              icon={faFloppyDisk}
                            />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          {totalPaymentsPages > 1 && (
            <nav aria-label="Page navigation example">
              <ul className="pagination">
                <li
                  className={`page-item${currentPaymentsPage === 1 ? " disabled" : ""
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
                    className={`page-item${currentPaymentsPage === number ? " active" : ""
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
                  className={`page-item${currentPaymentsPage === totalPaymentsPages
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
            <h3 className="text-white">
              <FontAwesomeIcon icon={faSync} className="me-2" />
              Historial de renovaciones
            </h3>
          </div>

          <table className="table table-striped">
            <thead>
              <tr className="table-header">
                <th>
                  <FontAwesomeIcon icon={faHashtag} className="me-2" />
                  Numero de renovacion
                </th>
                <th>
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  Fecha de renovacion
                </th>
                <th>
                  <FontAwesomeIcon icon={faFile} className="me-2" />
                  Observaciones
                </th>
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
                  {currentRenewals.map((renewal, index) => (
                    <tr key={renewal.id}>
                      {/*
                         <td>
                        {(currentRenewalsPage - 1) * itemsPerPage + index + 1}
                      </td>
                      */}

                      <td>{renewal.renewalNumber}</td>
                      <td>
                        {dayjs.utc(renewal.createdAt).format("DD/MM/YYYY")}
                      </td>
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
                  className={`page-item${currentRenewalsPage === 1 ? " disabled" : ""
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
                    className={`page-item${currentRenewalsPage === number ? " active" : ""
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
                  className={`page-item${currentRenewalsPage === totalRenewalsPages
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
            {auth?.role !== "ELOPDP" && (
              <>
                <button
                  type="submit"
                  onClick={handleGenerateReport}
                  id="btnc"
                  className="btn bg-success mx-5 text-white fw-bold "
                  disabled={reportLoading}
                >
                  {reportLoading ? (
                    <>
                      <div
                        className="spinner-border spinner-border-sm text-light me-2"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span>Generando...</span>
                    </>
                  ) : (
                    "Generar reporte PDF"
                  )}
                  <FontAwesomeIcon className="mx-2" beat icon={faFile} />
                </button>
              </>
            )}

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
    numberOfPayments: PropTypes.number.isRequired,
    startDate: PropTypes.string.isRequired, // o PropTypes.instanceOf(Date) si es un objeto Date
    endDate: PropTypes.string.isRequired,
    paymentsToAdvisor: PropTypes.string.isRequired,
    paymentsToAgency: PropTypes.string.isRequired,
    policyFee: PropTypes.string,
    observations: PropTypes.string,
    renewalCommission: PropTypes.bool.isRequired,
    isCommissionAnnualized: PropTypes.bool.isRequired,

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

    periods: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired,
        year: PropTypes.number.isRequired,
        policy_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired,
        advisorPercentage: PropTypes.number.isRequired,
        agencyPercentage: PropTypes.number.isRequired,
        policyValue: PropTypes.number.isRequired,
        policyFee: PropTypes.number,
      })
    ).isRequired,
  }).isRequired,

  onClose: PropTypes.func.isRequired,
};

export default ListPolicyModal;
