import PropTypes from "prop-types";
import { useState } from "react";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
import { faFile } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "dayjs";

const PaymentByStatusModal = ({ payments, onClose }) => {
  if (!payments) return null;
  // eslint-disable-next-line no-unused-vars, react-hooks/rules-of-hooks
  const [isLoading, setIsLoading] = useState(false);
  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto">
        <article className="modal-content text-center px-5 py-4">
          <div className="d-flex justify-content-center align-items-center conten-title mb-3 rounded">
            <h3 className="text-white">Lista de pólizas por estado</h3>
          </div>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>N°</th>
                <th>Número de póliza</th>
                <th>Teléfono</th>
                <th>Primer Nombre</th>
                <th>Segundo Nombre</th>
                <th>Primer Apellido</th>
                <th>Segundo Apellido</th>
                <th>Compañía</th>
                <th>Asesor</th>              
                <th>Valor</th>
                <th>Valor Pendiente</th>
                <th>Fecha de Creación</th>
                <th>Estado del Pago</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => (
                <tr key={payment.id}>
                  <td>{index + 1}</td>
                  <td>{payment.policies.numberPolicy}</td>
                  <td>{payment.policies.customer.numberPhone}</td>
                  <td>{payment.policies.customer.firstName}</td>
                  <td>{payment.policies.customer.secondName}</td>
                  <td>{payment.policies.customer.surname}</td>
                  <td>{payment.policies.customer.secondSurname}</td>
                  <td>{payment.policies.company.companyName}</td>
                  <td>
                    {payment.policies.advisor.firstName}{" "}
                    {payment.policies.advisor.surname}
                  </td>
                  <td
                    className={
                      payment.paymentStatus.id == 1
                        ? "bg-warning text-white fw-bold"
                        : payment.paymentStatus.id == 2
                        ? "bg-danger text-white fw-bold"
                        : ""
                    }
                  >
                    {payment.paymentStatus.statusNamePayment}
                  </td>
                  <td>{payment.value}</td>
                  <td>{payment.pending_value}</td>
                  <td>
                    {dayjs(payment.createdAt).format("MM/YYYY").toString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="d-flex justify-content-around mt-1">
            <div className="">
              <button
                type="submit"
                // onClick={generateReport}
                id="btnc"
                className="btn bg-success mx-5 text-white fw-bold"
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
PaymentByStatusModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  payments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      number_payment: PropTypes.number.isRequired,
      value: PropTypes.string.isRequired,
      pending_value: PropTypes.string.isRequired,
      credit: PropTypes.string.isRequired,
      balance: PropTypes.string.isRequired,
      total: PropTypes.string.isRequired,
      observations: PropTypes.string,
      policy_id: PropTypes.string.isRequired,
      status_payment_id: PropTypes.string.isRequired,
      createdAt: PropTypes.string.isRequired,
      updatedAt: PropTypes.string.isRequired,
      policies: PropTypes.shape({
        id: PropTypes.string.isRequired,
        numberPolicy: PropTypes.string.isRequired,
        customer: PropTypes.shape({
          ci_ruc: PropTypes.string.isRequired,
          firstName: PropTypes.string.isRequired,
          secondName: PropTypes.string,
          surname: PropTypes.string.isRequired,
          secondSurname: PropTypes.string,
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
      }).isRequired,
      paymentStatus: PropTypes.shape({
        id: PropTypes.string.isRequired,
        statusNamePayment: PropTypes.string.isRequired,
      }).isRequired,
    })
  ).isRequired,
};

export default PaymentByStatusModal;
