import PropTypes from "prop-types";
import { useEffect, useState } from "react";
//import alerts from "../Alerts";
import { faFile } from "@fortawesome/free-solid-svg-icons";
//import http from "../Http";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
//import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "dayjs";

const CustomerModalContent = ({ onClose, customerId }) => {
  const [isLoading, setIsLoading] = useState(false);
  // Validación para evitar errores si customer o policy no existen

  console.log("informacion del cliente en el modal: ", customerId);
  if (!customerId || !customerId.policies) {
    return null;
  }
  /*
  if (customerId && customerId.policies && customerId.policies.company) {
    console.log("compañia de if: ", customerId.policies.company[0].companyName);
  } else {
    console.error("No se pudo acceder a la propiedad company");
  }
  const companyName = customerId.policies[0].company.companyName;
  console.log(companyName);

  console.log("Tipo de policies:", typeof customerId.policies);
  console.log("Tipo de customerId:", typeof customerId);
  console.log("Contenido completo de policies:", customerId.policies);
  console.log("¿Es array?", Array.isArray(customerId.policies));

  const companyName2 = customerId.policies[0].company.companyName || "N/A";
  console.log("compañias 2: ", companyName2);

  if (!Array.isArray(customerId.policies)) {
    console.error(
      "customerId.policies no es un array. Contenido:",
      customerId.policies
    );
    return null;
  }*/

  return (
    <>
      <>
        <div className="modal d-flex justify-content-center align-items-center mx-auto ">
          <article className="modal-content text-center px-5 py-4">
            <div className="d-flex justify-content-center align-items-center conten-title py-4 mb-3 rounded">
              <h3 className="text-white">
                Pólizas a nombre de {customerId.firstName}{" "}
                {customerId.secondName} {customerId.surname}{" "}
                {customerId.secondSurname}
              </h3>
              <h3 className="text-white">Cédula: {customerId.ci_ruc}</h3>
            </div>

            <table className="table table-striped">
              <thead>
                <tr>
                  <th>N° Index</th>
                  <th>Número de Póliza</th>
                  <th>Compañía</th>
                  <th>Tipo de Póliza</th>
                  <th>Fecha de Inicio</th>
                  <th>Fecha de Fin</th>
                  <th>Método de Pago</th>
                  <th>Banco (si aplica)</th>
                  <th>Frecuencia de Pago</th>
                  <th> Comisión por renovación</th>
                  <th>Número de renovaciones</th>
                </tr>
              </thead>

              <tbody>
                {customerId.policies.map((policy, index) => (
                  <tr key={policy.id}>
                    <td>{index + 1}</td>
                    <td>{policy.numberPolicy}</td>

                    <td>{policy.company?.companyName || "N/A"}</td>
                    <td>{policy.policyType?.policyName || "N/A"}</td>
                    <td>
                      {dayjs(policy.startDate).format("DD/MM/YYYY") || "N/A"}
                    </td>
                    <td>
                      {dayjs(policy.endDate).format("DD/MM/YYYY") || "N/A"}
                    </td>
                    <td>{policy.paymentMethod?.methodName || "N/A"}</td>
                    <td>
                      {policy.bankAccount?.bank?.bankName ||
                        policy.creditCard?.bank?.bankName ||
                        "NO APLICA"}
                    </td>
                    <td>{policy.paymentFrequency?.frequencyName || "N/A"}</td>
                    <td>{policy.renewalCommission ? "SÍ" : "NO"}</td>
                    <td>{policy.renewals?.length || 0}</td>
                  </tr>
                ))}
              </tbody>

              <thead>
                <tr>
                  <th>Póliza correspondiente</th>
                  <th>Monto de Cobertura</th>
                  <th>Porcentaje de la Agencia</th>
                  <th>Porcentaje del Asesor</th>
                  <th>Valor de la Póliza</th>
                  <th>Número de Pagos</th>
                  <th>Pagos realizados</th>
                  <th>Derecho de Póliza</th>
                  <th>Pagos de comisiones al asesor</th>
                  <th>Estado</th>
                  <th colSpan="2" scope="row">
                    Observaciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {customerId.policies.map((policy) => (
                  <tr key={policy.id}>
                    <td>{policy.numberPolicy}</td>
                    <td>{policy.coverageAmount}</td>
                    <td>{policy.agencyPercentage}</td>
                    <td>{policy.advisorPercentage}</td>
                    <td>{policy.policyValue}</td>
                    <td>{policy.numberOfPayments}</td>
                    <td>{policy.payments?.length || 0}</td>
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
                ))}
              </tbody>
            </table>
            {/*
            <div className="d-flex justify-content-center align-items-center conten-title rounded mb-2 mt-2">
              <h3 className="text-white">Historial de pagos</h3>
            </div>
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Número de Pago</th>
                  <th>Valor</th>
                  <th>Abono</th>
                  <th>Saldo</th>
                  <th>Total</th>
                  <th>Fecha de pago</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {customerId.policies.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.number_payment}</td>
                    <td>{payment.value || "0.00"}</td>
                    <td>{payment.credit || "0.00"}</td>
                    <td>{payment.balance || "0.00"}</td>
                    <td>{payment.total}</td>
                    <td>{dayjs(payment.createdAt).format("DD/MM/YYYY")}</td>
                    <td>{payment.observations || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="d-flex justify-content-center align-items-center conten-title rounded mb-2 mt-2">
              <h3 className="text-white">Historial de renovaciones</h3>
            </div>
            {!customerId.policies.renewals ? (
              <div className="my-1">
                <span>Aun no se han registrado renovaciones</span>
              </div>
            ) : (
              <>
                <table className="table table-striped">
                  <thead>
                    <tr className="table-header">
                      <th>Numero de renovacion</th>
                      <th>Fecha de renovacion</th>
                      <th>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerId.policies.renewals.map((renewal) => (
                      <tr key={renewal.id}>
                        <td>{renewal.renewalNumber}</td>
                        <td>{dayjs(renewal.createdAt).format("DD/MM/YYYY")}</td>
                        <td>{renewal.observations || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
*/}
            <div className="d-flex justify-content-around mt-1">
              <div className="">
                <button
                  type="submit"
                  //onClick={generateReport}
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
    </>
  );
};
CustomerModalContent.propTypes = {
  customerId: PropTypes.shape({
    //id: PropTypes.number.isRequired,
    ci_ruc: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    secondName: PropTypes.string,
    surname: PropTypes.string.isRequired,
    secondSurname: PropTypes.string,
    policies: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        numberPolicy: PropTypes.string.isRequired,
        coverageAmount: PropTypes.string.isRequired,
        agencyPercentage: PropTypes.string.isRequired,
        advisorPercentage: PropTypes.string.isRequired,
        policyValue: PropTypes.string.isRequired,
        numberOfPayments: PropTypes.number,
        startDate: PropTypes.string.isRequired,
        endDate: PropTypes.string.isRequired,
        paymentsToAdvisor: PropTypes.string.isRequired,
        policyFee: PropTypes.string.isRequired,
        observations: PropTypes.string.isRequired,
        renewalCommission: PropTypes.bool.isRequired,
        policyType: PropTypes.shape({
          policyName: PropTypes.string.isRequired,
        }).isRequired,
        company: PropTypes.shape({
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
          bank_id: PropTypes.number.isRequired,
          bank: PropTypes.shape({
            bankName: PropTypes.string.isRequired,
          }).isRequired,
        }),
        creditCard: PropTypes.shape({
          bank_id: PropTypes.number.isRequired,
          bank: PropTypes.shape({
            bankName: PropTypes.string.isRequired,
          }).isRequired,
        }),
        policyStatus: PropTypes.shape({
          id: PropTypes.number.isRequired,
          statusName: PropTypes.string.isRequired,
        }).isRequired,
        paymentFrequency: PropTypes.shape({
          frequencyName: PropTypes.string.isRequired,
        }).isRequired,
        payments: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number.isRequired,
            number_payment: PropTypes.number.isRequired,
            value: PropTypes.string.isRequired,
            credit: PropTypes.string.isRequired,
            balance: PropTypes.string.isRequired,
            total: PropTypes.string.isRequired,
            observations: PropTypes.string,
            createdAt: PropTypes.string.isRequired,
            updatedAt: PropTypes.string.isRequired,
          })
        ).isRequired,
        renewals: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number.isRequired,
            renewalNumber: PropTypes.string.isRequired,
            createdAt: PropTypes.string.isRequired,
          })
        ),
      }).isRequired
    ),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CustomerModalContent;
