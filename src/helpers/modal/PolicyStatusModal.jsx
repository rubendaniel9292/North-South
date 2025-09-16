import PropTypes from "prop-types";
import { useState } from "react";
//import alerts from "../../helpers/Alerts";
//import http from "../../helpers/Http";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
//import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { faFile } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "dayjs";
import useAuth from "../../hooks/useAuth";
const PolicyStatusModal = ({ policies, onClose }) => {
  if (!policies) return null;
  
  const [isLoading, setIsLoading] = useState(false);
  const { auth } = useAuth();
  
  // ✅ Función para manejar la generación del reporte PDF
  const handleGenerateReport = async () => {
    try {
      setIsLoading(true);
      
      // Aquí iría la lógica para generar el reporte PDF de las pólizas filtradas
      // Por ejemplo, llamada a una API o generación con jsPDF
      
      // Simulación de delay para mostrar el loading (remover en producción)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // TODO: Implementar la generación real del PDF
      console.log("Generando reporte de pólizas:", policies);
      
      // Ejemplo de lo que podría ir aquí:
      // const response = await http.post('/api/generate-policies-report', { policies });
      // descargar el archivo o mostrar éxito
      
    } catch (error) {
      console.error("Error al generar el reporte:", error);
      // TODO: Mostrar alerta de error
    } finally {
      setIsLoading(false);
    }
  };

  //const [isDataValid, setIsDataValid] = useState(true);

  // ✅ Constantes para estados de póliza
  const POLICY_STATUS = {
    COMPLETED: "3",
    TO_COMPLETE: "4"
  };

  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto">
        <article className="modal-content text-center px-5 py-4">
          <div className="d-flex justify-content-center align-items-center conten-title mb-3 rounded">
            <h3 className="text-white">
              Listado de todas las pólizas terminadas o por terminar
            </h3>
          </div>
          
          {/* ✅ Tabla con estado de loading */}
          <div className="position-relative">
            {/* ✅ Overlay de loading cuando se genera el reporte */}
            {isLoading && (
              <div 
                className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.8)', 
                  zIndex: 10,
                  borderRadius: '8px'
                }}
              >
                <div className="text-center">
                  <div className="spinner-border text-primary mb-2" role="status">
                    <span className="visually-hidden">Generando reporte...</span>
                  </div>
                  <p className="fw-bold text-primary mb-0">Generando reporte PDF...</p>
                </div>
              </div>
            )}

            <table className={`table table-striped ${isLoading ? 'opacity-50' : ''}`}>
            <thead>
              <tr>
                <th>N°</th>
                <th>Número de Póliza</th>
                <th colSpan="2" scope="row">Cliente</th>
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
                    {policy.customer?.firstName}{" "}
                    {policy.customer?.secondName || ""}
                  </td>
                  <td>{policy.customer?.surname}{" "}
                    {policy.customer?.secondSurname || ""}</td>
                  <td>{policy.company?.companyName}</td>
                  <td>{policy.policyType?.policyName}</td>

                  <td>{dayjs(policy.startDate).format("DD/MM/YYYY")}</td>
                  <td>{dayjs(policy.endDate).format("DD/MM/YYYY")}</td>
                  <td>{policy.paymentMethod?.methodName}</td>

                  <td>
                    {policy.bankAccount && policy.bankAccount.bank
                      ? policy.bankAccount?.bank.bankName
                      : policy.creditCard && policy.creditCard.bank
                        ? policy.creditCard?.bank.bankName
                        : "NO APLICA"}
                  </td>
                  <td>{policy.paymentFrequency?.frequencyName}</td>
                  <td>{policy.coverageAmount}</td>
                  <td>{policy.policyValue}</td>
                  <td>
                    <span
                      className={`badge fw-bold fs-6 ${policy.policyStatus?.id == POLICY_STATUS.COMPLETED
                        ? "bg-secondary text-white" // ✅ Culminada - Gris
                        : policy.policyStatus?.id == POLICY_STATUS.TO_COMPLETE
                          ? "bg-warning text-dark" // ✅ Por Culminar - Amarillo con texto oscuro
                          : "bg-light text-dark" // ✅ Default - Claro
                        }`}
                    >
                      {policy.policyStatus?.statusName}
                    </span>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
          </div> {/* ✅ Cerrar div position-relative */}

          <div className="d-flex justify-content-around mt-1">
            {/* ✅ Botón de generar reporte solo para roles autorizados */}
            {auth?.role !== "ELOPDP" ? (
              <button
                type="button"
                onClick={handleGenerateReport}
                id="btnc"
                className="btn bg-success mx-5 text-white fw-bold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="spinner-border spinner-border-sm text-light me-2" role="status">
                      <span className="visually-hidden">
                        Generando reporte...
                      </span>
                    </div>
                    Generando...
                  </>
                ) : (
                  <>
                    Generar reporte PDF
                    <FontAwesomeIcon className="mx-2" beat icon={faFile} />
                  </>
                )}
              </button>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              id="btnc"
              className="btn bg-danger mx-5 text-white fw-bold"
              disabled={isLoading}
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
