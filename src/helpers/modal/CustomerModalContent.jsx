import PropTypes from "prop-types";
import { useState } from "react";
//import alerts from "../Alerts";
import { faFile } from "@fortawesome/free-solid-svg-icons";
//import http from "../Http";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
//import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "dayjs";

const CustomerModalContent = ({ onClose, customerId }) => {

  const [isLoading, setIsLoading] = useState(false);
  //const isLoading = false; // Validación para evitar errores si customer o policy no existen
  // Validación para evitar errores si customer o policy no existen

  console.log("informacion del cliente en el modal: ", customerId);
  if (!customerId || !customerId.policies) {
    return null;
  }

  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto ">
        <article className="modal-content text-center px-5 py-4">
          <div className="d-flex justify-content-center align-items-center conten-title py-4 mb-3 rounded">
            <h3 className="text-white">
              Pólizas a nombre de {customerId.firstName} {customerId.secondName}{" "}
              {customerId.surname} {customerId.secondSurname}
            </h3>
           
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
                  <td>{dayjs(policy.endDate).format("DD/MM/YYYY") || "N/A"}</td>
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
                    <span className="visually-hidden">
                      Generando reporte...
                    </span>
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
