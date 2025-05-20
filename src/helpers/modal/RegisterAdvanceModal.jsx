import PropTypes, { number } from "prop-types";
import { useEffect, useState } from "react";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import http from "../../helpers/Http";
import UserForm from "../../hooks/UserForm";

const RegisterAdvanceModal = ({ advisorId, onClose }) => {
  if (!advisorId) return null;
  const [isLoading, setIsLoading] = useState(false);
  // Manejar el caso de datos no disponibles, pero después de llamar a los hooks
  const [isDataValid, setIsDataValid] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const { form, changed } = UserForm({});
  const option = "Escoja una opción";
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companyResponse, paymentMethodResponse] = await Promise.all([
          http.get("company/get-all-company"),
          http.get("policy/get-payment-method"),
        ]);
        setCompanies(companyResponse.data.allCompanies);
        setFilteredCompanies(companyResponse.data.allCompanies);
        setPaymentMethod(paymentMethodResponse.data.allPaymentMethod);
      } catch (error) {
        //alerts("Error", "Error fetching data.", error);
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Función para manejar el cambio de póliza
  const handlePolicyChange = (e) => {
    const selectedPolicyId = e.target.value;

    // Si se selecciona "Anticipio" (valor vacío), mostramos todas las compañías
    if (!selectedPolicyId) {
      changed(e); // Procesamos el cambio normalmente
      setFilteredCompanies(companies); // Restauramos todas las compañías
      return;
    }

    // Buscamos la póliza seleccionada
    const selectedPolicy = advisorId.policies.find(
      (policy) => policy.id === selectedPolicyId
    );
    // Buscamos la póliza seleccionada
    const policyFound = advisorId.policies.find(
      (policy) => policy.id === selectedPolicyId
    );
    if (policyFound) {
      setSelectedPolicy(policyFound);
    }
    if (selectedPolicy) {
      // Actualizamos el formulario con el cambio de la póliza
      changed(e);

      // Filtramos las compañías para mostrar solo la que corresponde a la póliza
      const companyId = selectedPolicy.company_id;
      const companyForPolicy = companies.filter(
        (company) => company.id === companyId
      );
      setFilteredCompanies(companyForPolicy);

      // Actualizamos la compañía automáticamente en el formulario
      const companyEvent = {
        target: {
          name: "company_id",
          value: companyId,
        },
      };

      // Actualizamos el formulario con el cambio de compañía
      changed(companyEvent);
    }
  };

  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto">
        <article className="modal-content text-center px-5 py-5">
          <div className="d-block  conten-title rounded mb-3">
            <h3 className="text-white fw-bold">
              Registro de anticipio a: {advisorId.firstName} {advisorId.surname}
            </h3>
            {selectedPolicy ? (
              <h4 className="text-white fw-bold">
                Comisiones generadas para esta poliza:{" "}
                {selectedPolicy.renewalCommission === false
                  ? selectedPolicy.paymentsToAdvisor
                  : (
                      selectedPolicy.paymentsToAdvisor /
                      selectedPolicy.numberOfPaymentsAdvisor
                    ).toFixed(2) * selectedPolicy.payments.length.toFixed(2)}
              </h4>
            ) : (
              <h4 className="text-white fw-bold">
                Seleccione una póliza para ver sus comisiones
              </h4>
            )}
          </div>
          <div className="d-flex justify-content-around mt-5">
            <form onSubmit={""} id="user-form">
              <div className="row">
                <div className="mb-4  d-none">
                  <label htmlFor="advisor_id" className="form-label">
                    Id Asesor
                  </label>
                  <input
                    required
                    type="number"
                    className="form-control"
                    id="advisor_id"
                    name="advisor_id"
                    //onChange={handleChange}
                    value={advisorId.id}
                    readOnly
                  />
                </div>
                <div className="mb-3 col-4">
                  <label htmlFor="advance" className="form-label">
                    Anticipio o comisión por póliza
                  </label>
                  <select
                    required
                    className="form-select"
                    id="advance"
                    name="advance"
                    defaultValue={option}
                    onChange={handlePolicyChange}
                  >
                    <option disabled>{option}</option>
                    <option value="">Anticipio</option>
                    {Array.isArray(advisorId.policies) &&
                    advisorId.policies.length > 0 ? (
                      advisorId.policies.map((policy) => {
                        console.log("Renderizando política:", policy);
                        return (
                          <option key={policy.id} value={policy.id}>
                            {policy.numberPolicy ||
                              policy.policyNumber ||
                              "Póliza sin número"}
                          </option>
                        );
                      })
                    ) : (
                      <option disabled>No hay pólizas disponibles</option>
                    )}
                  </select>
                </div>
                <div className="mb-3 col-4">
                  <label htmlFor="receiptNumber" className="form-label">
                    Número de Recibo
                  </label>
                  <input
                    required
                    onChange={changed}
                    id="receiptNumber"
                    type="string"
                    className="form-control"
                    name="receiptNumber"

                    //onChange={handleChange}
                  />
                </div>
                <div className="mb-3 col-4">
                  <label htmlFor="company_id" className="form-label">
                    Compañía
                  </label>
                  <select
                    className="form-select"
                    id="company_id"
                    name="company_id"
                    onChange={changed}
                    defaultValue={option}
                    value={form.company_id || ""}
                  >
                    <option disabled>{option}</option>
                    {filteredCompanies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.companyName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3 col-4">
                  <label htmlFor="payment_method_id" className="form-label">
                    Metodo de abono
                  </label>
                  <select
                    className="form-select"
                    id="payment_method_id"
                    name="payment_method_id"
                    //onChange={handlePaymentMethodChange} // Cambiado aquí
                    defaultValue={option}
                  >
                    <option disabled>{option}</option>
                    {paymentMethod.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.methodName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3 col-4">
                  <label htmlFor=" advanceValue" className="form-label">
                    Valor del anticipio
                  </label>
                  <input
                    required
                    type="number"
                    className="form-control"
                    id=" advanceValue"
                    name=" advanceValue"
                    step="0.01"
                    //value={Number(form.value).toFixed(2)}
                    //onChange={handleChange}
                    readOnly
                  />
                </div>

                <div className="mb-3 col-4">
                  <label htmlFor="balance" className="form-label">
                    Fecha del anticipo
                  </label>
                  <input
                    required
                    type="date"
                    className="form-control"
                    id="createdAt"
                    name="createdAt"
                    //value={form.createdAt}
                    //onChange={handleChange}
                  />
                </div>

                <div className="mb-3 col-4">
                  <label htmlFor="observations" className="form-label">
                    Observaciones
                  </label>
                  <textarea
                    type="text"
                    className="form-control"
                    id="observations"
                    name="observations"
                    //onChange={handleChange}
                  />
                </div>
                <div className="mt-4 col-12">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn bg-success fw-bold text-white "
                  >
                    {isLoading ? (
                      <div className="spinner-border text-light" role="status">
                        <span className="visually-hidden">Registrando...</span>
                      </div>
                    ) : (
                      "Registrar Pago"
                    )}

                    <FontAwesomeIcon
                      className="mx-2 "
                      icon={faFloppyDisk}
                      beat
                    />
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
            </form>
          </div>
        </article>
      </div>
    </>
  );
};

RegisterAdvanceModal.propTypes = {
  advisorId: PropTypes.shape({
    id: PropTypes.number.isRequired,
    firstName: PropTypes.string.isRequired,
    secondName: PropTypes.string,
    surname: PropTypes.string.isRequired,
    secondSurname: PropTypes.string,

    policies: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        policyNumber: PropTypes.string.isRequired,
        payment_frequency_id: PropTypes.string.isRequired,
        numberOfPaymentsAdvisor: PropTypes.number.isRequired,
        paymentsToAdvisor: PropTypes.number.isRequired,
        renewalCommission: PropTypes.bool.isRequired,
        payments: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number.isRequired,
          })
        ),
      })
    ),
  }).isRequired,
};
export default RegisterAdvanceModal;
