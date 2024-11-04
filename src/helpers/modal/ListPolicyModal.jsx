import PropTypes from "prop-types";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
import { faFile } from "@fortawesome/free-solid-svg-icons";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
const ListPolicyModal = ({ policy, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  if (!policy) return null;
  console.log("info completa de la poliza: ", policy);
  const generateReport = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      console.log("Generando PDF para póliza:", policy.numberPolicy);
      /*
      const response = await http.get(`policy/download-policy/${policy.id}`, {
        responseType: "blob",
        headers: {
          Accept: "application/pdf",
        },
      });*/

      const response = await http.post(
        `generate-report-pdf/download-policy`,
        policy,
        {
          responseType: "blob", //objeto Blob, que es la representación binaria del PDF.
          headers: {
            Accept: "application/pdf", //encabezado "Accept" para indicar que estás esperando una respuesta en formato PDF.
          },
        }
      );

      console.log("Respuesta recibida:", response.status);

      // Crear el nombre del archivo
      const fileName = `poliza-${policy.numberPolicy}-test.pdf`;

      // Crear un URL para el blob
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );

      // Crear elemento de descarga
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);

      // Descargar el archivo
      document.body.appendChild(link);
      link.click();

      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alerts("Éxito", "PDF de prueba generado correctamente", "success");
    } catch (error) {
      console.error("Error durante la generación del PDF:", error);
      alerts("Error", "No se pudo generar el PDF de prueba", "error");
    } finally {
      setIsLoading(false);
    }
  };

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
                <th>Pagos de comisiones al asesor</th>
                <th>Estado</th>
                <th>Observaciones</th>
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
                <td>{policy.observations || "N/A"}</td>
              </tr>
            </tbody>
          </table>
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
              {policy.payments.map((payment) => (
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
          {!policy.renovals ? (
            <div className="my-1">
              <span>Aun no se han registrado renovaciones</span>
            </div>
          ) : (
            <><thead>
                <tr className="table-header">
                  <th>Numero de renovacion</th>
                  <th>Fecha de renovacion</th>
                  <th>Observaciones</th>
                </tr>
              </thead><tbody>
                  {policy.renovals.map((renoval) => (
                    <tr key={renoval.id}>
                      <td>{renoval.renewalNumber}</td>
                      <td>{renoval.total}</td>
                      <td>{dayjs(renoval.createdAt).format("DD/MM/YYYY")}</td>
                      <td>{renoval.observations || "N/A"}</td>
                    </tr>
                  ))}
                </tbody></>
          )}

          <div className="d-flex justify-content-around mt-1">
            <div className="">
              <button
                type="submit"
                onClick={generateReport}
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
    id: PropTypes.number.isRequired,
    numberPolicy: PropTypes.number.isRequired,
    coverageAmount: PropTypes.number,
    agencyPercentage: PropTypes.number,
    advisorPercentage: PropTypes.number,
    policyValue: PropTypes.number.isRequired,
    numberOfPayments: PropTypes.number,
    startDate: PropTypes.string, // o PropTypes.instanceOf(Date) si es un objeto Date
    endDate: PropTypes.string,
    paymentsToAdvisor: PropTypes.number,
    policyFee: PropTypes.number,
    observations: PropTypes.string,

    // Relación con policyType
    policyType: PropTypes.shape({
      policyName: PropTypes.string.isRequired,
    }).isRequired,

    // Relación con customer
    customer: PropTypes.shape({
      ci_ruc: PropTypes.string.isRequired,
      firstName: PropTypes.string.isRequired,
      secondName: PropTypes.string,
      surname: PropTypes.string.isRequired,
      secondSurname: PropTypes.string,
    }).isRequired,

    // Relación con company
    company: PropTypes.shape({
      companyName: PropTypes.string.isRequired,
    }).isRequired,

    // Relación con advisor
    advisor: PropTypes.shape({
      firstName: PropTypes.string.isRequired,
      secondName: PropTypes.string,
      surname: PropTypes.string.isRequired,
      secondSurname: PropTypes.string,
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
    // Relación con paymentFrequency
    paymentFrequency: PropTypes.shape({
      frequencyName: PropTypes.string.isRequired,
    }).isRequired,
    // Validación del array de pagos dentro de 'policy'
    payments: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired, // Si 'id' es numérico
        number_payment: PropTypes.number.isRequired, // Número del pago dentro de la serie de pagos
        value: PropTypes.string.isRequired, // Valor del pago (si llega como string)
        credit: PropTypes.string.isRequired, // Crédito del pago (si llega como string)
        balance: PropTypes.string.isRequired, // Balance restante (si llega como string)
        total: PropTypes.string.isRequired, // Total del pago (si llega como string)
        observations: PropTypes.string, // Puede ser null o string
        createdAt: PropTypes.string.isRequired, // Fecha de creación (formato ISO string)
        updatedAt: PropTypes.string.isRequired, // Fecha de actualización (formato ISO string)
      })
    ).isRequired, // Es obligatorio que haya pagos en este array
    renovals: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        renewalNumber: PropTypes.string.isRequired,
        createdAt: PropTypes.string.isRequired,
      })
    ),
  }).isRequired,

  onClose: PropTypes.func.isRequired,
};

export default ListPolicyModal;
