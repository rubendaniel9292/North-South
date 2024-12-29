import PropTypes from "prop-types";
import { useState } from "react";
//import alerts from "../../helpers/Alerts";
//import http from "../../helpers/Http";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
//import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { faFile } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "dayjs";

const PolicyStatusModal = ({ policies, onClose }) => {
  if (!policies) return null;
  // eslint-disable-next-line react-hooks/rules-of-hooks, no-unused-vars
  const [isLoading, setIsLoading] = useState(false);
  //const [isDataValid, setIsDataValid] = useState(true);

  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto ">
        <article className="modal-content text-center px-5 py-4">
          <div className="d-flex justify-content-center align-items-center conten-title mb-3 rounded">
            <h3 className="text-white">
              Listado de todas las póilzas terminadas o por terminar
            </h3>
          </div>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>N°</th>
                <th>Número de Póliza</th>
                <th>Cliente</th>
                <th>Compañía</th>
                <th>Tipo de Póliza</th>
                <th>Fecha de Inicio</th>
                <th>Fecha de Fin</th>
                <th>Método de Pago</th>
                <th>Banco (si aplica)</th>
                <th>Frecuencia de Pago</th>
                <th>Monto de Cobertura</th>
                <th>Valor de la Póliza</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy, index) => (
                <tr key={policy.id}>
                  <td>{index + 1}</td>
                  <td>{policy.numberPolicy}</td>
                  <td>
                    {policy.customer.firstName}{" "}
                    {policy.customer.secondName || ""} {policy.customer.surname}{" "}
                    {policy.customer.secondSurname || ""}
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
                  <td>{policy.coverageAmount}</td>
                  <td>{policy.policyValue}</td>
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
                  {/*    <td>
                    <button className="btn btn-success text-white fw-bold">
                      Ver información completa
                    </button>
                  </td>*/}
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

PolicyStatusModal.propTypes = {
  policies: PropTypes.arrayOf(
    PropTypes.shape({
      numberPolicy: PropTypes.string.isRequired,
      coverageAmount: PropTypes.string.isRequired,
      policyValue: PropTypes.string.isRequired,
      startDate: PropTypes.string, // o PropTypes.instanceOf(Date) si es un objeto Date
      endDate: PropTypes.string,
      observations: PropTypes.string,
      // Relación con policyType
      policyType: PropTypes.shape({
        policyName: PropTypes.string.isRequired,
      }).isRequired,

      // Relación con customer
      customer: PropTypes.shape({
        firstName: PropTypes.string.isRequired,
        secondName: PropTypes.string,
        surname: PropTypes.string.isRequired,
        secondSurname: PropTypes.string,
      }).isRequired,

      // Relación con company
      company: PropTypes.shape({
        companyName: PropTypes.string.isRequired,
      }).isRequired,

      // Relación con paymentMethod
      paymentMethod: PropTypes.shape({
        methodName: PropTypes.string.isRequired,
      }).isRequired,

      // Relación con bankAccount y su relación anidada bank
      bankAccount: PropTypes.shape({
        bank_id: PropTypes.number.isRequired,
        bank: PropTypes.shape({
          bankName: PropTypes.string.isRequired,
        }).isRequired,
      }),

      // Relación con creditCard y su relación anidada bank
      creditCard: PropTypes.shape({
        bank_id: PropTypes.number.isRequired,
        bank: PropTypes.shape({
          bankName: PropTypes.string.isRequired,
        }).isRequired,
      }),
      // Relación con policyStatus
      policyStatus: PropTypes.shape({
        id: PropTypes.number.isRequired,
        statusName: PropTypes.string.isRequired,
      }).isRequired,


    }).isRequired
  ).isRequired,

  onClose: PropTypes.func.isRequired,
};

export default PolicyStatusModal;
