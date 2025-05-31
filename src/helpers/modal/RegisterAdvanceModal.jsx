import PropTypes from "prop-types";
import { useEffect, useCallback, useState } from "react";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import http from "../../helpers/Http";
import UserForm from "../../hooks/UserForm";
import alerts from "../../helpers/Alerts";

const RegisterAdvanceModal = ({ advisorId, onClose, refreshAdvisor }) => {
  if (!advisorId) {
    console.error("advisorId es undefined en RegisterAdvanceModal");
    return null;
  }
  const [isLoading, setIsLoading] = useState(false);
  // Manejar el caso de datos no disponibles, pero después de llamar a los hooks
  const [isDataValid, setIsDataValid] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [advanceValue, setAdvanceValue] = useState();
  const [remainingValue, setRemainingValue] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [availableCommissions, setAvalaibleCommissions] = useState(0);
  const { form, changed } = UserForm({
    advisor_id: advisorId.id,
    policy_id: advisorId.policies.id || null,
  });
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
  /*
  useEffect(() => {
    console.log("Advisor completo:", advisorId);
    console.log("Políticas del asesor:", advisorId.policies);
  }, [advisorId]);
*/

  // Función para calcular el total de comisiones generadas para la póliza (incluyendo renovaciones)
  const calculateCommissionValue = useCallback((policy) => {
    if (!policy) return 0;
    if (policy.renewalCommission === false) {
      return Number(policy.paymentsToAdvisor) || 0;
    }
    const perPeriod =
      Number(policy.paymentsToAdvisor) /
      Number(policy.numberOfPaymentsAdvisor || 1);
    return perPeriod * (policy.payments ? policy.payments.length : 0);
  }, []);

  // Función auxiliar para calcular comisiones disponibles
  const calculateAvailableCommissions = useCallback(
    (policy) => {
      if (!policy) return 0;
      const commissionValue = calculateCommissionValue(policy);
      let commissionsPaid = 0;
      if (Array.isArray(policy.commissionsPayments)) {
        commissionsPaid = policy.commissionsPayments.reduce(
          (total, payment) => total + (Number(payment.advanceAmount) || 0),
          0
        );
      }
      return Math.max(0, commissionValue - commissionsPaid);
    },
    [calculateCommissionValue]
  );

  // Función para manejar el cambio de póliza
  /*
  const handlePolicyChange = (e) => {
    const selectedPolicyId = e.target.value;

    // Si se selecciona "Anticipio" (valor vacío), mostramos todas las compañías
    if (!selectedPolicyId) {
      changed(e);
      setFilteredCompanies(companies);
      setSelectedPolicy(null);
      setRemainingValue(0);

      const companyEvent = {
        target: {
          name: "company_id",
          value: "",
        },
      };
      changed(companyEvent);
      return;
    } else {
      changed(e); // Procesamos el cambio normalmente
    }

    // Buscamos la póliza seleccionada
    const selectedPolicy = advisorId.policies.find(
      (policy) => policy.id === selectedPolicyId
    );
    console.log("poliza seleccionada: ", selectedPolicy);
    if (selectedPolicy) {
      // Actualizamos el formulario con el cambio de la póliza
      setSelectedPolicy(selectedPolicy);

      // Cálculo correcto total de comisiones
      const commissionValue = calculateCommissionValue(selectedPolicy);

      // Comisiones ya pagadas
      const commissionsPaid = Array.isArray(selectedPolicy.commissionsPayments)
        ? selectedPolicy.commissionsPayments.reduce(
            (total, payment) => total + (Number(payment.advanceAmount) || 0),
            0
          )
        : 0;

      setTotalCommission(commissionValue);
      const available = Math.max(0, commissionValue - commissionsPaid);
      setAvalaibleCommissions(available);
      setRemainingValue(available); // <-- aquí debe ser available

      console.log("comisiones pagadas: ", commissionsPaid);
      console.log("comisiones totales: ", commissionValue);
      console.log(
        "comisiones disponibles: ",
        commissionValue - commissionsPaid
      );

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
  };*/
  const handlePolicyChange = (e) => {
    const selectedPolicyId = e.target.value;

    if (!selectedPolicyId) {
      changed(e);
      setFilteredCompanies(companies);
      setSelectedPolicy(null);
      setRemainingValue(0);

      const companyEvent = {
        target: {
          name: "company_id",
          value: "",
        },
      };
      changed(companyEvent);
      return;
    } else {
      changed(e);
    }

    const selectedPolicyObj = advisorId.policies.find(
      (policy) => String(policy.id) === String(selectedPolicyId)
    );
    if (selectedPolicyObj) {
      setSelectedPolicy(selectedPolicyObj);

      const commissionValue = calculateCommissionValue(selectedPolicyObj);
      const commissionsPaid = Array.isArray(
        selectedPolicyObj.commissionsPayments
      )
        ? selectedPolicyObj.commissionsPayments.reduce(
            (total, payment) => total + (Number(payment.advanceAmount) || 0),
            0
          )
        : 0;

      setTotalCommission(commissionValue);
      const available = Math.max(0, commissionValue - commissionsPaid);
      setAvalaibleCommissions(available);
      setRemainingValue(available); // <-- aquí debe ser available

      const companyId = selectedPolicyObj.company_id;
      const companyForPolicy = companies.filter(
        (company) => company.id === companyId
      );
      setFilteredCompanies(companyForPolicy);

      const companyEvent = {
        target: {
          name: "company_id",
          value: companyId,
        },
      };

      changed(companyEvent);
    }
  };

  // Función para manejar el cambio en el valor del anticipo
  const handleAdvanceValueChange = (e) => {
    const inputValue = e.target.value;
    const inputElement = document.getElementById("advanceValue");
    // Si el campo está vacío, establecemos el estado como una cadena vacía
    if (inputValue === "") {
      setAdvanceValue("");

      if (selectedPolicy) {
        // Si no hay valor, el restante es igual al total
        //setRemainingValue(totalCommission);
        setRemainingValue(availableCommissions);
      }
      inputElement.setCustomValidity("");
    } else {
      // Si hay un valor, lo convertimos a número
      const value = parseFloat(inputValue);
      setAdvanceValue(value);

      if (selectedPolicy) {
        // Calculamos el valor restante
        const remaining = availableCommissions - value;
        setRemainingValue(remaining);

        // Validamos si el valor excede el total de comisiones
        const inputElement = document.getElementById("advanceValue");
        if (value > availableCommissions) {
          inputElement.setCustomValidity("Valor excede comisiones");
        } else {
          inputElement.setCustomValidity("");
        }
      }
    }

    // Procesamos el cambio normalmente
    changed(e);
  };

  // función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formElement = e.target;

    if (!formElement.checkValidity()) {
      e.stopPropagation();
      formElement.classList.add("was-validated");
      return;
    }

    try {
      // Crear un objeto con los datos del formulario
      const formData = {
        ...form,
        policy_id: selectedPolicy ? selectedPolicy.id : null, // Asegurarse de incluir el ID de la póliza
      };

      const response = await http.post(
        "commissions-payments/register-commissions",
        formData
      );
      console.log("Respuesta del servidor:", response);

      if (response.data.status === "success") {
        if (typeof refreshAdvisor === "function") {
          await refreshAdvisor(); // Refresca el asesor y la tabla
        }
        alerts(
          "Registro exitoso",
          "Asesor registrado registrado correctamente",
          "success"
        );

        setTimeout(() => {
          document.querySelector("#user-form").reset();
          onClose();
        }, 500);
      } else {
        alerts(
          "Error",
          "Avance/anticipo no registrado correctamente. Verificar que no haya campos vacios o cedulas o correos duplicados",
          "error"
        );
      }
    } catch (error) {
      alerts("Error", "Error durante el registro", "error");
      console.error("Error fetching asesor:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto">
        <article className="modal-content text-center px-5 py-5">
          <div className="d-block conten-title-com rounded ">
            <h3 className="text-white fw-bold ">
              Registro de anticipio a : {advisorId.firstName}{" "}
              {advisorId.surname} {advisorId.secondSurname}{" "}
              {advisorId.secondSurname}
            </h3>
          </div>
          <div className="row pt-2">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>N° de póliza</th>
                  <th>Cliente</th>
                  <th>Comisiones totales</th>
                  <th>Comisiones disponibles</th>
                  <th>Saldo</th>
                  <th>Comisiones liberadas</th>
                </tr>
              </thead>
              <tbody>
                {selectedPolicy ? (
                  <tr>
                    <td className="fw-bold">{selectedPolicy.numberPolicy}</td>
                    <td className="fw-bold">
                      {selectedPolicy.customer && selectedPolicy.customer
                        ? selectedPolicy.customer.firstName +
                          " " +
                          selectedPolicy.customer.secondName +
                          " " +
                          selectedPolicy.customer.surname +
                          " " +
                          selectedPolicy.customer.secondSurname
                        : "N/A"}
                    </td>
                    <td className="bg-info fw-bold">
                      ${Number(totalCommission).toFixed(2)}
                    </td>
                    <td className="bg-success-subtle fw-bold">
                      ${Number(availableCommissions).toFixed(2)}
                    </td>
                    <td
                      className={
                        remainingValue <= 0
                          ? "bg-danger  fw-bold"
                          : "fw-bold bg-balance-color"
                      }
                    >
                      ${Number(remainingValue).toFixed(2)}
                    </td>
                    <td className="fw-bold bg-warning">
                      $
                      {Array.isArray(selectedPolicy.commissionsPayments)
                        ? selectedPolicy.commissionsPayments
                            .reduce(
                              (total, payment) =>
                                total + (Number(payment.advanceAmount) || 0),
                              0
                            )
                            .toFixed(2)
                        : "0.00"}
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-success">
                      <p>
                        Escoja una póliza para ver detalles de las comisiones o
                        registre un anticipio
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-around mt-2">
            <form
              onSubmit={handleSubmit}
              id="user-form"
              className="needs-validation was-validated"
              noValidate
            >
              <div className="row">
                <div className="mb-4 d-none">
                  <label htmlFor="advisor_id" className="form-label">
                    Id Asesor
                  </label>
                  <input
                    required
                    type="number"
                    className="form-control"
                    id="advisor_id"
                    name="advisor_id"
                    onChange={changed}
                    value={advisorId.id}
                    readOnly
                  />
                </div>
                <div className="mb-3 col-4">
                  <label htmlFor="policy_id" className="form-label">
                    Anticipio o comisión por póliza
                  </label>
                  <select
                    required
                    className="form-select"
                    id="policy_id"
                    name="policy_id"
                    onChange={handlePolicyChange}
                  >
                    <option disabled selected value={""}>
                      {option}
                    </option>
                    <option value="">Anticipio</option>
                    {Array.isArray(advisorId.policies) &&
                    advisorId.policies.length > 0 ? (
                      advisorId.policies
                        .filter(
                          (policy) => calculateAvailableCommissions(policy) > 0
                        )
                        .map((policy) => (
                          <option key={policy.id} value={policy.id}>
                            {policy.numberPolicy}
                          </option>
                        ))
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
                    value={selectedPolicy ? form.company_id || "" : ""}
                    disabled={!selectedPolicy}
                  >
                    <option disabled value="">
                      {option}
                    </option>
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
                    onChange={changed}
                    defaultValue={option}
                    required
                  >
                    <option disabled selected value={""}>
                      {option}
                    </option>
                    {paymentMethod.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.methodName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3 col-4">
                  <label htmlFor="advanceValue" className="form-label">
                    Valor del anticipio
                  </label>
                  <input
                    required
                    type="number"
                    className="form-control "
                    id="advanceValue"
                    name="advanceAmount"
                    step="0.01"
                    onChange={handleAdvanceValueChange}
                    value={advanceValue}
                  />
                  <div className="invalid-feedback">
                    La comisión es mayor que la comisión de la póliza
                    seleccionada o el campo está vacío
                  </div>
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
                    onChange={changed}
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
                    onChange={changed}
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
                    type="button"
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
    commissions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        receiptNumber: PropTypes.string.isRequired,
        company_id: PropTypes.number.isRequired,
        payment_method_id: PropTypes.number.isRequired,
        advanceAmount: PropTypes.number.isRequired,
        createdAt: PropTypes.string.isRequired,
        observations: PropTypes.string,
      })
    ),

    policies: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        numberPolicy: PropTypes.string.isRequired,
        payment_frequency_id: PropTypes.string.isRequired,
        numberOfPaymentsAdvisor: PropTypes.number.isRequired,
        paymentsToAdvisor: PropTypes.number.isRequired,
        renewalCommission: PropTypes.bool.isRequired,
        commissionsPayments: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number.isRequired,
            receiptNumber: PropTypes.string.isRequired,
            company_id: PropTypes.number.isRequired,
            payment_method_id: PropTypes.number.isRequired,
            advanceAmount: PropTypes.number.isRequired,
            createdAt: PropTypes.string.isRequired,
            observations: PropTypes.string,
          })
        ),
        payments: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number.isRequired,
            paymentDate: PropTypes.string.isRequired,
            paymentAmount: PropTypes.number.isRequired,
          })
        ),
        customer: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number.isRequired,
            firstName: PropTypes.string.isRequired,
            secondName: PropTypes.string,
            surname: PropTypes.string.isRequired,
            secondSurname: PropTypes.string,
          })
        ),
      })
    ),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  refreshAdvisor: PropTypes.func.isRequired,
};
export default RegisterAdvanceModal;
