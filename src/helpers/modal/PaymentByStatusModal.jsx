import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
import { faFile } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "dayjs";
import generateReport from "../GenerateReportPDF";
import http from "../../helpers/Http";
const PaymentByStatusModal = ({ payments, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  if (!payments) return null;

  const [filteredPayments, setFilteredPayments] = useState(payments);
  const [selectedCompanyId, setSelectedCompanyId] = useState("General");

  const [searchByName, setSearchByName] = useState(false);
  const [nameQuery, setNameQuery] = useState("");

  //console.log("polizas con pagos atarsados:", payments);
  //array de compañias
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companyResponse] = await Promise.all([
          http.get("company/get-all-company"),
        ]);
        console.log(companyResponse.data.allCompanies);
        setCompanies(companyResponse.data.allCompanies);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Filter payments baseda en la compañia selecionada

  useEffect(() => {
    const fetchFilteredPayments = async () => {
      console.log(`Selected company ID: ${selectedCompanyId}`);
      if (selectedCompanyId === "General") {
        setFilteredPayments(payments);
      } else {
        try {
          // Filtra los pagos basándote en el ID de la compañía
          const filteredPayments = payments.filter(
            (payment) => payment.policies.company.id === selectedCompanyId
          );

          console.log("Filtered payments: ", filteredPayments);

          // Si hay registros filtrados, actualízalos directamente
          if (filteredPayments.length > 0) {
            setFilteredPayments(filteredPayments);
          } else {
            // Si no hay registros, realiza una consulta para asegurar datos actualizados
            const response = await http.get(
              `payment/get-payment-by-status?companyId=${selectedCompanyId}`
            );
            setFilteredPayments(response.data.paymentByStatus || []);
          }
        } catch (error) {
          console.error("Error fetching payments:", error);
          setFilteredPayments([]); // Evita que `filteredPayments` sea undefined
        }
      }
    };

    fetchFilteredPayments();
  }, [selectedCompanyId, payments]);

  const handleGenerateReport = (e) => {
    e.preventDefault();
    generateReport(
      filteredPayments,
      "generate-report-pdf/download-payment",
      `payment-data-report.pdf`,
      setIsLoading
    );
  };

  // Handle name query change
  useEffect(() => {
    if (searchByName && nameQuery) {
      const filtered = payments.filter((payment) =>
        `${payment.policies.customer.firstName} ${payment.policies.customer.surname}`
          .toLowerCase()
          .includes(nameQuery.toLowerCase())
      );
      setFilteredPayments(filtered);
    } else if (searchByName && !nameQuery) {
      setFilteredPayments([]);
    }
  }, [nameQuery, searchByName, payments]);

  const handleSelectionChange = (e) => {
    const value = e.target.value;
    setSelectedCompanyId(value);
    setSearchByName(value === "name");
    setNameQuery("");
  };
  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto">
        <article className="modal-content text-center px-5 py-4">
          <div className="d-flex justify-content-center align-items-center conten-title mb-3 rounded">
            <h3 className="text-white">Lista de pólizas por estado</h3>
          </div>
          <div className="d-flex justify-content-around my-1">
            <div className="mb-3 col-4">
              <label htmlFor="company_id" className="form-label">
                Por compañía o búsqueda general
              </label>
              <select
                className="form-select"
                id="company_id"
                name="company_id"
                value={selectedCompanyId}
                //onChange={(e) => setSelectedCompanyId(e.target.value)}
                onChange={handleSelectionChange}
              >
                <option value="General">General</option>
                {companies.map((copmany) => (
                  <option key={copmany.id} value={copmany.id}>
                    {copmany.companyName}
                  </option>
                ))}
                <option value="name">Buscar por nombre o apellido</option>
              </select>
              {searchByName && (
                <div className="mb-3 my-2">
                  <label htmlFor="nameQuery" className="form-label">
                    Nombre o Apellido
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="nameQuery"
                    value={nameQuery}
                    onChange={(e) => setNameQuery(e.target.value)}
                  />
                </div>
              )}
            </div>
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
                <th>Fecha de pago</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="13" className="text-center">
                    No se encontraron resultados
                  </td>
                </tr>
              ) : (
                <>
                  {filteredPayments.map((payment, index) => (
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
                      <td className="bg-warning text-white fw-bold">
                        {payment.value}
                      </td>
                      <td>{payment.policies.policyValue}</td>
                      <td>
                        {dayjs(payment.createdAt).format("MM/YYYY").toString()}
                      </td>
                      <td className={"bg-warning text-white fw-bold"}>
                        {payment.paymentStatus.statusNamePayment}
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>

          <div className="d-flex justify-content-around mt-1">
            <div className="">
              {filteredPayments.length === 0 ? (
                <button
                  className="btn bg-success mx-5 text-white fw-bold"
                  disabled
                >
                  Generar reporte PDF
                  <FontAwesomeIcon className="mx-2" beat icon={faFile} />
                </button>
              ) : (
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
          id: PropTypes.number.isRequired,
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
