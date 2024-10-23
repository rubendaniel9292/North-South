import PropTypes from "prop-types";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
import { faFile } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
const ListPolicyModal = ({ policy, onClose }) => {
  if (!policy) return null;
  console.log("info completa de la poliza: ", policy);

  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto ">
        <article className="modal-content text-center px-5 py-4">
          <div className="conten-title mb-3">
            <h2 className="">Información completa de la póliza</h2>
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
          <div className="conten-title mb-3">
            <h3 className="">Hitorial de pagos</h3>
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
                  <td>{dayjs(payment.startDate).format("DD/MM/YYYY")}</td>
                  <td>{payment.observations || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="modal-footer mt-4">
            <button
              type="submit"
              onClick={""}
              id="btnc"
              className="btn bg-success mx-5 text-white fw-bold "
            >
              Generar reporte PDF
              <FontAwesomeIcon className="mx-2" beat icon={faFile} />
            </button>

            <button
              type="submit"
              onClick={onClose}
              id="btnc"
              className="btn bg-danger mx-5 text-white fw-bold"
            >
              Cerrar
              <FontAwesomeIcon className="mx-2" beat icon={faRectangleXmark} />
            </button>
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
  }).isRequired,

  onClose: PropTypes.func.isRequired,
};

export default ListPolicyModal;
