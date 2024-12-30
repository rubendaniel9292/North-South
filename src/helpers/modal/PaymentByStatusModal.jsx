import PropTypes from "prop-types";
import { useState } from "react";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
import { faFile } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "dayjs";
import generateReport from "../GenerateReportPDF";

const PaymentByStatusModal = ({ payments, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!payments) return null;

  const handleGenerateReport = (e) => {
    e.preventDefault();
    generateReport(
      payments,
      "generate-report-pdf/download-payment",
      `data-report.pdf`,
      setIsLoading
    );
  };
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
                <th colSpan="4" scope="row">
                  Cliente
                </th>
                <th>Compañía</th>
                <th>Asesor</th>
                <th>Valor Pendiente</th>
                <th>Valor de la Póliza</th>
                <th>Saldo de Póliza</th>
                <th>Fecha de pago</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => (
                <tr key={payment.id}>
                  <td>{index + 1}</td>
                  <td>{payment.policies.numberPolicy}</td>
                  <td>{payment.policies.customer.numberPhone}</td>
                  <td>{payment.policies.customer.firstName}</td>
                  <td> {payment.policies.customer.secondName}</td>
                  <td>{payment.policies.customer.surname}</td>
                  <td>{payment.policies.customer.secondSurname}</td>
                  <td>{payment.policies.company.companyName}</td>
                  <td>
                    {payment.policies.advisor.firstName}{" "}
                    {payment.policies.advisor.surname}
                  </td>
                  <td className="bg-warning text-white fw-bold">{payment.value}</td>
                  <td>{payment.policies.policyValue}</td>
                  <td >{payment.pending_value}</td>
                  <td>
                    {dayjs(payment.createdAt).format("MM/YYYY").toString()}
                  </td>
                  <td className={"bg-warning text-white fw-bold"}>
                    {payment.paymentStatus.statusNamePayment}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="d-flex justify-content-around mt-1">
            <div className="">
              <button
                type="submit"
                onClick={handleGenerateReport}
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
      value: PropTypes.string.isRequired,
      pending_value: PropTypes.string.isRequired,
      observations: PropTypes.string,
      createdAt: PropTypes.string.isRequired,
      policies: PropTypes.shape({
        numberPolicy: PropTypes.string.isRequired,
        policyValue: PropTypes.string.isRequired,
        customer: PropTypes.shape({
          numberPhone: PropTypes.string.isRequired,
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
