import UserForm from "../../hooks/UserForm";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { useEffect, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { useLocation } from "react-router-dom";
const CreatePolicy = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { form, changed } = UserForm({
    numberOfPayments: "",
    numberOfPaymentsAdvisor: "",
    payment_frequency_id: 0,
  });
  const [types, setType] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [frequency, setFrequency] = useState([]);
  const [selectedFrequencyId, setSelectedFrequencyId] = useState(0);
  const [customers, setCustomer] = useState([]);
  const [advisor, setAdvisor] = useState([]);
  const [cards, setCards] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [filteredCard, setFilteredCard] = useState([]);
  const [filteredAccount, setFilteredAccount] = useState([]);
  const [errorAdvisorPercentage, setErrorAdvisorPercentage] = useState("");

  const location = useLocation();
  // Obtenemos el cliente pasado por NavLink, si lo hay
  const customerFromNav = location.state?.customer;
  const isEditable = location.state?.isEditable ?? true; // Editabilidad según el state

  // Estado inicial del cliente seleccionado
  const option = "Escoja una opción";
  const [selectedCustomer, setSelectedCustomer] = useState(option);

  // Si hay un cliente pasado por NavLink, actualizamos el estado
  useEffect(() => {
    if (customerFromNav) {
      setSelectedCustomer(customerFromNav.id);
      // Actualizar el form con el ID del cliente
      changed({
        target: {
          name: "customers_id",
          value: parseInt(customerFromNav.id),
        },
      });

      // evento sintético para handleCard_Accunt
      const syntheticEvent = {
        target: {
          name: "customers_id",
          value: customerFromNav.id,
        },
      };

      // Llamamos a handleCard_Accunt después de actualizar el estado
      handleCard_Accunt(syntheticEvent);
    }
  }, [customerFromNav, customers, cards, accounts]);

  //handleSelectChange para manejar la selección manual del cliente
  const handleSelectChange = (e) => {
    handleCard_Accunt(e);
    if (isEditable) {
      setSelectedCustomer(e.target.value);
      // Asegurar que se guarde como número
      changed({
        target: {
          name: "customers_id",
          value: parseInt(e.target.value),
        },
      });
    }
    handleCard_Accunt(e);
  };

  //filtro de tarjeta por clienes
  const handleCard_Accunt = (e) => {
    const selectedCustomerId = e.target.value;
    const selectedCustomer = customers.find(
      (customer) => customer.id === selectedCustomerId
    );
    if (selectedCustomer) {
      const customerCiRuc = selectedCustomer.ci_ruc;
      //console.log("customerCiRuc:", customerCiRuc);
      //console.log("cards:", cards.cardNumber);
      //console.log("accounts:", accounts);

      if (cards && cards.length > 0) {
        const filteredCards = cards.filter(
          (card) => card.customer.ci_ruc === customerCiRuc
        );
        setFilteredCard(filteredCards);
      }
      if (accounts && accounts.length > 0) {
        const filteredAccount = accounts.filter(
          (account) => account.customer.ci_ruc === customerCiRuc
        );
        setFilteredAccount(filteredAccount);
      }
    }

    changed(e);
  };

  // Calcula el pago al asesor con usecallback,  evita la recreación innecesaria de la función en cada renderizado
  const calculateAdvisorPayment = useCallback(() => {
    // Función auxiliar para agregar clase de manera segura
    const addClassSafely = (id, className) => {
      const element = document.getElementById(id);
      if (element) element.classList.add(className);
    };

    const percentageAdvisor = Number(form.advisorPercentage);
    const percentageAgency = Number(form.agencyPercentage);
    const policyFee = Number(form.policyFee);
    const value = Number(form.policyValue) - policyFee;
    let paymentAvisor = 0;
    let paymentAgency = 0;
    if (!isNaN(value) && !isNaN(percentageAdvisor) && !isNaN(policyFee)) {
      paymentAgency = parseFloat(((value * percentageAgency) / 100).toFixed(2));
      paymentAvisor = parseFloat(((value * percentageAdvisor) / 100).toFixed(2));
     
      changed({
        target: {
          name: "paymentsToAgency",
          value: paymentAgency - paymentAvisor,
          //value: paymentAvisor,
        },
      });

      changed({
        target: {
          name: "paymentsToAdvisor",
          value: paymentAvisor,
        },
      });
      // Agregar clase is-valid a los campos calculados automáticamente de manera segura
      addClassSafely("paymentsToAgency", "is-valid");
      addClassSafely("paymentsToAdvisor", "is-valid");
      addClassSafely("numberOfPayments", "is-valid");
      addClassSafely("numberOfPaymentsAdvisor", "is-valid");
    }
  }, [
    form.policyValue,
    form.advisorPercentage,
    form.policyFee,
    form.agencyPercentage,
  ]);

  const handlePaymentMethodChange = (e) => {
    const paymentMetohd = e.target.value;
    setSelectedPaymentMethod(paymentMetohd); // Actualiza el estado con el nuevo método de pago seleccionado
    changed(e);
  };

  // Maneja el cambio de frecuencia de pago
  const handleFrequencyChange = (e) => {
    const selectedFrequencyId = Number(e.target.value); // ID de la frecuencia seleccionada
    console.log(
      "selectedFrequencyId:",
      selectedFrequencyId && typeof selectedFrequencyId
    );
    const frequencyMap = {
      1: 12, // Mensual
      2: 4, // Trimestral
      3: 2, // Semestral
      4: 1, // Anual (default)
      5: "", //otro
    };
    const calculatedPayments = frequencyMap[selectedFrequencyId]; // Número de pagos calculado

    // Actualiza los campos relacionados en el formulario
    changed([
      {
        name: "payment_frequency_id",
        value: selectedFrequencyId,
      },
      {
        name: "numberOfPayments",
        value: calculatedPayments,
      },
      {
        name: "numberOfPaymentsAdvisor",
        value: calculatedPayments,
      },
    ]);

    setSelectedFrequencyId(selectedFrequencyId);
  };

  const handlePaymentsChange = (e) => {
    const { value } = e.target;
    changed([
      {
        name: "numberOfPayments",
        value,
      },
      {
        name: "numberOfPaymentsAdvisor",
        value,
      },
    ]);
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          typeResponse,
          companyResponse,
          frecuencyResponse,
          customerResponse,
          advisorResponse,
          paymentMethodResponse,
          creditCardResponse,
          accountResponse,
        ] = await Promise.all([
          http.get("policy/get-types"),
          http.get("company/get-all-company"),
          http.get("policy/get-frecuency"),
          http.get("customers/get-all-customer"),
          http.get("advisor/get-all-advisor"),
          http.get("policy/get-payment-method"),
          http.get(`creditcard/all-cards-rp`),
          http.get("bankaccount/get-all-account"),
        ]);
        setType(typeResponse.data.allTypePolicy);
        setCompanies(companyResponse.data.allCompanies);
        setFrequency(frecuencyResponse.data.allFrecuency);
        setCustomer(customerResponse.data.allCustomer);
        setAdvisor(advisorResponse.data.allAdvisors);
        setPaymentMethod(paymentMethodResponse.data.allPaymentMethod);
        setCards(creditCardResponse.data.allCards);
        setAccounts(accountResponse.data.allBankAccounts);
      } catch (error) {
        alerts("Error", "Error fetching data.", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    calculateAdvisorPayment();
  }, [form.policyValue, form.advisorPercentage, calculateAdvisorPayment]);

  //handler especial para el campo advisorPercentage
  const handleAdvisorPercentageChange = (e) => {
    changed(e); // Actualiza el form normalmente
    const advisorVal = Number(e.target.value);
    const agencyVal = Number(form.agencyPercentage);

    if (agencyVal === 0) {
      setErrorAdvisorPercentage("Primero ingrese el porcentaje de la agencia");
      el;
    } else if (advisorVal >= agencyVal) {
      setErrorAdvisorPercentage(
        "El porcentaje del asesor debe ser menor que el de la agencia"
      );
    } else if (advisorVal === "") {
      setErrorAdvisorPercentage("Por favor ingrese el porcentaje del asesor");
    } else {
      setErrorAdvisorPercentage("");
    }
  };
  const savedPolicy = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Obtener el elemento del formulario
    const formElement = e.target;

    // Verificar la validez del formulario
    if (!formElement.checkValidity()) {
      e.stopPropagation();
    }

    // Agregar la clase was-validated para mostrar los mensajes de error
    formElement.classList.add("was-validated");
    try {
      // Si el formulario es válido, procede con el envío
      if (formElement.checkValidity()) {
        // Aquí iría tu lógica de envío
        console.log("Formulario válido, enviando datos...");
        const request = await http.post("policy/register-policy", form);
        if (request.data.status === "success") {
          console.log("Poliza registrada: ", request.data);
          alerts(
            "Registro exitoso",
            "Póliza registrada correctamente",
            "success"
          );
          document.querySelector("#user-form").reset();
        } else {
          alerts(
            "Error",
            "Póliza no registrada correctamente. Verificar que no haya campos vacios  números de pólzias duplicados",
            "error"
          );
        }
      }
    } catch (error) {
      alerts(
        "Error",
        "No se registró la póliza, revise los campos e intente nuevamente.",
        "error"
      );
      console.error("Error fetching policy:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form
        onSubmit={savedPolicy}
        id="user-form"
        className="needs-validation was-validated"
        noValidate
      >
        <div className="row pt-3 fw-bold">
          <div className="mb-3 col-3">
            <label htmlFor="numberPolicy" className="form-label">
              Número de póliza
            </label>
            <input
              required
              type="text"
              className="form-control"
              id="numberPolicy"
              name="numberPolicy"
              onChange={changed}
            />{" "}
            <div className="invalid-feedback">
              Por favor ingrese el número de póliza.
            </div>
          </div>

          <div className="mb-3 col-3">
            <label htmlFor="policy_type_id" className="form-label">
              Tipo
            </label>
            <select
              className="form-select"
              id="policy_type_id"
              name="policy_type_id"
              onChange={changed}
              defaultValue={option}
              required
              aria-label="select example"
            >
              <option selected value={""} disabled>
                {option}
              </option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.policyName}
                </option>
              ))}
            </select>
            <div className="invalid-feedback">
              Por favor escooja un tipo de póliza.
            </div>
          </div>

          <div className="mb-3 col-3">
            <label htmlFor="company_id" className="form-label">
              Compañía
            </label>
            <select
              className="form-select"
              id="company_id"
              name="company_id"
              onChange={changed}
              defaultValue={option}
              aria-label="select example"
              required
            >
              <option selected value={""} disabled>
                {option}
              </option>
              {companies.map((copmany) => (
                <option key={copmany.id} value={copmany.id}>
                  {copmany.companyName}
                </option>
              ))}
            </select>
            <div className="invalid-feedback">
              Por favor escoja una compañía.
            </div>
          </div>

          <div className="mb-3 col-3">
            <label htmlFor="payment_frequency_id" className="form-label">
              Frecuencia de pago
            </label>
            <select
              className="form-select"
              id="payment_frequency_id"
              name="payment_frequency_id"
              onChange={handleFrequencyChange}
              defaultValue={option}
              required
              aria-label="select example"
            >
              <option selected value={""} disabled>
                {option}
              </option>
              {frequency.map((frequency) => (
                <option key={frequency.id} value={frequency.id}>
                  {frequency.frequencyName}
                </option>
              ))}
            </select>
            <div className="invalid-feedback">
              Por favor escoja la frecuencia de pago.
            </div>
          </div>
          <div className="mb-3 col-3">
            <label htmlFor="customers_id" className="form-label">
              Cliente Beneficiario
            </label>
            <select
              className="form-select"
              id="customers_id"
              name="customers_id"
              value={selectedCustomer} // Seleccionamos el cliente automáticamente o se setea en vacio
              onChange={handleSelectChange}
              disabled={!isEditable} // Deshabilitar el select si isEditable es false
              required
              aria-label="select example"
            >
              <option selected disabled>
                {option}
              </option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {`${customer.firstName} ${customer.secondName || ""} ${
                    customer.surname
                  } ${customer.secondSurname || ""}`.trim()}
                </option>
              ))}
            </select>
            <div className="invalid-feedback">Por favor escoja un cliente.</div>
          </div>
          <div className="mb-3 col-3">
            <label htmlFor="advisor_id" className="form-label">
              Asesor
            </label>
            <select
              className="form-select"
              id="advisor_id"
              name="advisor_id"
              onChange={changed}
              defaultValue={option}
              aria-label="select example"
              required
            >
              <option selected value={""} disabled>
                {option}
              </option>
              {advisor.map((item) => (
                <option key={item.id} value={item.id}>
                  {`${item.firstName} ${item.secondName || ""} ${
                    item.surname
                  } ${item.secondSurname || ""}`.trim()}
                </option>
              ))}
            </select>
            <div className="invalid-feedback">Por favor escoja un asesor.</div>
          </div>
          <div className="mb-3 col-3">
            <label htmlFor="payment_method_id" className="form-label">
              Metodo de Pago
            </label>
            <select
              className="form-select"
              id="payment_method_id"
              name="payment_method_id"
              onChange={handlePaymentMethodChange} // Cambiado aquí
              defaultValue={option}
              required
              aria-label="select example"
            >
              <option disabled value={""} selected>
                {option}
              </option>
              {paymentMethod.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.methodName}
                </option>
              ))}
            </select>
            <div className="invalid-feedback">
              Por favor escoja un método de pago.
            </div>
          </div>
          {selectedPaymentMethod === "9" && (
            <div className="mb-3 col-3">
              <label htmlFor="account_type_id" className="form-label">
                Cuenta Bancaria
              </label>
              <select
                className="form-select"
                id="bank_account_id"
                name="bank_account_id"
                onChange={changed}
                defaultValue={option}
                required
                aria-label="select example"
              >
                {filteredAccount.length > 0 ? (
                  <>
                    <option disabled value={""} selected>
                      {" "}
                      {option}
                    </option>
                    {filteredAccount.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.accountNumber} - {account.bank?.bankName}
                      </option>
                    ))}
                  </>
                ) : (
                  <option className="bs-danger-bg-subtle">
                    No hay cuentas asociadas a este cliente.
                  </option>
                )}
              </select>
              <div className="invalid-feedback">
                Por favor escoja una cuenta
              </div>
            </div>
          )}

          {selectedPaymentMethod === "6" && (
            <div className="mb-3 col-3">
              <label htmlFor="credit_card_id" className="form-label">
                Tarjeta de Crédito
              </label>
              <select
                className="form-select"
                id="credit_card_id"
                name="credit_card_id"
                onChange={changed}
                defaultValue={option}
                required
                aria-label="select example"
              >
                {filteredCard.length > 0 ? (
                  <>
                    <option disabled selected value={""}>
                      {" "}
                      {option}
                    </option>
                    {filteredCard.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.cardNumber} - {card.bank?.bankName}
                      </option>
                    ))}
                  </>
                ) : (
                  <option disabled selected className="bs-danger-bg-subtle">
                    No hay tarjetas asociadas a este cliente.
                  </option>
                )}
              </select>
              <div className="invalid-feedback">
                Por favor escoja una tarjeta.
              </div>
            </div>
          )}
          <div className="mb-3 col-3">
            <label htmlFor="coverageAmount" className="form-label">
              Monto de Cobertura
            </label>
            <input
              required
              type="number"
              className="form-control"
              id="coverageAmount"
              name="coverageAmount"
              onChange={changed}
            />
            <div className="invalid-feedback">
              Por favor ingrese el monto de cobertura.
            </div>
          </div>
          <div className="mb-3 col-3">
            <label htmlFor="policyValue" className="form-label">
              Valor de la Póliza
            </label>
            <input
              required
              type="number"
              className="form-control"
              id="policyValue"
              name="policyValue"
              value={form.policyValue}
              onChange={changed} // Llamada a la función
            />
            <div className="invalid-feedback">
              Por favor ingrese el valor de la póliza.
            </div>
          </div>
          <div className="mb-3 col-3">
            <label htmlFor="policyFee" className="form-label">
              Derecho de póliza (opcional)
            </label>
            <input
              type="number"
              className="form-control"
              id="policyFee"
              name="policyFee"
              value={form.policyFee}
              onChange={changed} // Llamada a la función
              required
            />
            <div className="invalid-feedback">Ingrese 0 sino aplica</div>
          </div>
          <div className="mb-3 col-3">
            <label htmlFor="agencyPercentage" className="form-label">
              Procentaje de la Agencia
            </label>
            <input
              required
              type="number"
              className="form-control"
              id="agencyPercentage"
              name="agencyPercentage"
              onChange={changed}
              value={form.agencyPercentage}
            />
            <div className="invalid-feedback">
              Por favor ingrese un porcentaje de la agencia.
            </div>
          </div>
          <div className="mb-3 col-3">
            <label htmlFor="advisorPercentage" className="form-label">
              Porcentaje del Asesor
            </label>
            <input
              required
              type="number"
              className={`form-control ${
                !form.advisorPercentage ||
                Number(form.advisorPercentage) >= Number(form.agencyPercentage)
                  ? "is-invalid"
                  : "is-valid"
              }`}
              id="advisorPercentage"
              name="advisorPercentage"
              onChange={handleAdvisorPercentageChange}
              value={form.advisorPercentage}
            />

            {errorAdvisorPercentage && (
              <>
                <div className="invalid-feedback">{errorAdvisorPercentage}</div>
              </>
            )}

            <div className="invalid-feedback">
              Por favor ingrese un porcentaje del asesor.
            </div>
          </div>

          <div className="mb-3 col-3 ">
            <label htmlFor="flexRadioDefault7" className="form-check-label">
              Comisión por renovación
            </label>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="renewalCommission"
                id="flexRadioDefault7"
                value="true"
                onChange={changed}
                required
              ></input>
              <label className="form-check-label" htmlFor="flexRadioDefault7">
                Si
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="renewalCommission"
                id="flexRadioDefault8"
                value="false"
                onChange={changed}
                required
              />
              <label className="form-check-label" htmlFor="flexRadioDefault8">
                No
              </label>
              <div className="invalid-feedback">
                Por favor escoja una opción.
              </div>
            </div>
          </div>
          <div className="mb-3 col-3">
            <label className="form-label">
              Frecuencia de pago de comisiones
            </label>
            <div className="form-check">
              <input
                required
                className="form-check-input"
                type="radio"
                name="isCommissionAnnualized"
                id="commissionAnnualized"
                value="true"
                onChange={changed}
              />
              <label
                className="form-check-label"
                htmlFor="commissionAnnualized"
              >
                Anualizada
              </label>
            </div>
            <div className="form-check">
              <input
                required
                className="form-check-input"
                type="radio"
                name="isCommissionAnnualized"
                id="commissionNormal"
                value="false"
                onChange={changed}
              />
              <label className="form-check-label" htmlFor="commissionNormal">
                Normal (según frecuencia de pago)
              </label>
              <div className="invalid-feedback">
                Por favor escoja una opción.
              </div>
            </div>
          </div>
          <div className="mb-3 col-3">
            <label htmlFor="numberOfPayments" className="form-label">
              Número de pagos de póliza
            </label>
            <input
              required
              type="number"
              className={`form-control ${
                form.numberOfPayments ? "is-valid" : ""
              }`}
              id="numberOfPayments"
              name="numberOfPayments"
              value={form.numberOfPayments}
              readOnly={selectedFrequencyId !== 5}
              onChange={
                selectedFrequencyId === 5 ? handlePaymentsChange : undefined
              }
            />
          </div>
          <div className="mb-3 col-3">
            <label htmlFor="startDate" className="form-label">
              Fecha de Inicio de la póliza
            </label>
            <input
              required
              type="date"
              className="form-control"
              id="startDate"
              name="startDate"
              onChange={changed}
            />
            <div className="invalid-feedback">
              Por favor ingrese una fecha de inicio.
            </div>
          </div>
          <div className="mb-3 col-3">
            <label htmlFor="endDate" className="form-label">
              Fecha de Finalización de la póliza
            </label>
            <input
              required
              type="date"
              className="form-control"
              id="endDate"
              name="endDate"
              onChange={changed}
            />
            <div className="invalid-feedback">
              Por favor ingrese una fecha de finalización.
            </div>
          </div>
          <div className="mb-3 col-3">
            <label htmlFor="paymentsToAgency" className="form-label">
              Comisiones de la agencia
            </label>
            <input
              readOnly
              required
              type="number"
              className={`form-control ${
                form.paymentsToAgency ? "is-valid" : ""
              }`}
              id="paymentsToAgency"
              name="paymentsToAgency"
              value={form.paymentsToAgency || 0}
            />
          </div>
          <div className="mb-3 col-3">
            <label htmlFor="paymentsToAdvisor" className="form-label">
              Comisiones de asesor
            </label>
            <input
              readOnly
              required
              type="number"
              className={`form-control ${
                form.paymentsToAdvisor ? "is-valid" : ""
              }`}
              id="paymentsToAdvisor"
              name="paymentsToAdvisor"
              value={form.paymentsToAdvisor || 0}
            />
          </div>

          <div className="mb-3 col-3">
            <label htmlFor="numberOfPaymentsAdvisor" className="form-label">
              Número de pagos al Asesor
            </label>
            <input
              required
              type="number"
              className={`form-control ${
                form.numberOfPaymentsAdvisor ? "is-valid" : ""
              }`}
              id="numberOfPaymentsAdvisor"
              name="numberOfPaymentsAdvisor"
              value={form.numberOfPaymentsAdvisor}
              readOnly={selectedFrequencyId !== 5}
              onChange={
                selectedFrequencyId === 5 ? handlePaymentsChange : undefined
              }
            />
          </div>

          <div className="mb-3 col-3">
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
            <div className="valid-feedback">
              Campo opcional: ingrese cualquier inforación adicional.
            </div>
          </div>

          <div className="mt-4 col-3">
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-success fw-bold"
            >
              {isLoading ? (
                <div className="spinner-border text-light" role="status">
                  <span className="visually-hidden">Registrando...</span>
                </div>
              ) : (
                "Registrar Póliza"
              )}

              <FontAwesomeIcon className="mx-2 " icon={faFloppyDisk} beat />
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default CreatePolicy;
