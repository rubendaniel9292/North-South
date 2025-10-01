import PropTypes from "prop-types";
import { useState } from "react";
//import alerts from "../Alerts";
import { 
  faFile,
  faRectangleXmark,
  faHashtag,
  faBarcode,
  faBuilding,
  faFileContract,
  faCalendarAlt,
  faCreditCard,
  faUniversity,
  faSync,
  faPercent,
  faDollarSign,
  faMoneyBillWave,
  faCheckCircle,
  faStickyNote,
  faClipboardList
} from "@fortawesome/free-solid-svg-icons";
//import http from "../Http";
//import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "dayjs";
import useAuth from "../../hooks/useAuth";
const CustomerModalContent = ({ onClose, customerId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { auth } = useAuth();
  // ✅ Función para manejar la generación del reporte PDF
  const handleGenerateReport = async () => {
    try {
      setIsLoading(true);

      // Aquí iría la lógica para generar el reporte PDF
      // Por ejemplo, llamada a una API o generación con jsPDF

      // Simulación de delay para mostrar el loading (pendiente de implementar)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // TODO: Implementar la generación real del PDF
      console.log("Generando reporte para cliente:", customerId);

      // Ejemplo de lo que podría ir aquí:
      // const response = await http.post('/api/generate-report', { customerId: customerId.id });
      // descargar el archivo o mostrar éxito

    } catch (error) {
      console.error("Error al generar el reporte:", error);
      // TODO: Mostrar alerta de error
    } finally {
      setIsLoading(false);
    }
  };

  //const isLoading = false; // Validación para evitar errores si customer o policy no existen
  // Validación para evitar errores si customer o policy no existen

  console.log("informacion del cliente en el modal: ", customerId);
  if (!customerId || !customerId.policies) {
    return null;
  }
  const Badge = ({ text, color = "secondary" }) => (
    <span className={`badge rounded-pill fw-bold fs-6 bg-${color} fw-semibold`}>
      {text}
    </span>
  );
  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto">
        <article className="modal-content text-center px-5 py-4">
          <div className="d-flex justify-content-center align-items-center conten-title py-4 mb-3 rounded">
            <h3 className="text-white">
              Pólizas a nombre de {customerId.firstName} {customerId.secondName}{" "}
              {customerId.surname} {customerId.secondSurname}
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
                  <th>
                    <FontAwesomeIcon icon={faHashtag} className="me-2" />
                    N° Index
                  </th>
                  <th>
                    <FontAwesomeIcon icon={faBarcode} className="me-2" />
                    Número de Póliza
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
                  <th>
                    <FontAwesomeIcon icon={faHashtag} className="me-2" />
                    Número de renovaciones
                  </th>
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
                    <td>
                      <Badge
                        className=""
                        text={policy.renewalCommission === true ? "SI" : "NO"}
                        color={
                          policy.renewalCommission === true ? "dark" : "danger"
                        }
                      />
                    </td>
                    <td>{policy.renewals?.length || 0}</td>
                  </tr>
                ))}
              </tbody>

              <thead>
                <tr>
                  <th>
                    <FontAwesomeIcon icon={faBarcode} className="me-2" />
                    Póliza correspondiente
                  </th>
                  <th>
                    <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
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
                    <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                    Pagos realizados
                  </th>
                  <th>
                    <FontAwesomeIcon icon={faDollarSign} className="me-2" />
                    Derecho de Póliza
                  </th>
                  <th>
                    <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                    Pagos de comisiones al asesor
                  </th>
                  <th>
                    <FontAwesomeIcon icon={faClipboardList} className="me-2" />
                    Estado
                  </th>
                  <th colSpan="2" scope="row">
                    <FontAwesomeIcon icon={faStickyNote} className="me-2" />
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
                    <td>{policy.payments?.filter(payment => payment.status_payment_id == 2).length || 0}</td>
                    <td>{policy.policyFee || "NO APLICA"}</td>
                    <td>{policy.paymentsToAdvisor}</td>
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
                ))}
              </tbody>
            </table>
          </div> {/* ✅ Cerrar div position-relative */}

          <div className="d-flex justify-content-around mt-1">
            <div className="">
              {auth?.role !== "ELOPDP" && (<>
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
              </>)}

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
            status_payment_id : PropTypes.number.isRequired,
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
