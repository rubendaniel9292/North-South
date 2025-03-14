import PropTypes from "prop-types";
import UserForm from "../../hooks/UserForm";
import { useEffect, useState } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { useCallback } from "react";

const UpdatePolicyModal = ({ policy, onClose, onPolicyUpdated }) => {
  if (!policy) return null;
  console.log("poliza obtenida: ", policy);
  const [isLoading, setIsLoading] = useState(false);
  const { form, changed, setForm } = UserForm({
    numberPolicy: policy.numberPolicy,
    coverageAmount: policy.coverageAmount,
    agencyPercentage: policy.agencyPercentage,
    advisorPercentage: policy.advisorPercentage,
    coverageAmount: policy.coverageAmount,
    policyValue: policy.policyValue,
    startDate: dayjs.utc(policy.startDate).format("YYYY-MM-DD").toString(),
    endDate: dayjs.utc(policy.endDate).format("YYYY-MM-DD").toString(),
    paymentsToAdvisor: policy.paymentsToAdvisor,
    paymentsToAgency: policy.paymentsToAgency,
    policyFee: policy.policyFee,
    observations: policy.observations,
    renewalCommission: policy.renewalCommission,
    policy_type_id: policy.policyType.id,
    company_id: policy.company.id,
    customers_id: policy.customer.id,
    advisor_id: policy.advisor.id,
    payment_method_id: policy.paymentMethod.id,
    credit_card_id: policy.creditCard?.id,
    bank_account_id: policy.bankAccount?.id,
    payment_frequency_id: policy.payment?.paymentFrequency.id,
    numberOfPayments: policy.numberOfPayments,
    numberOfPaymentsAdvisor: policy.numberOfPayments,
    payment_frequency_id: policy.paymentFrequency.id,
    policy_status_id: policy.policyStatus.id,
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
  const [statusPolicy, setStatusPolicy] = useState({});
  const [allStatusPolicy, setAllStatusPolicy] = useState([]);

  //const location = useLocation();
  // Obtenemos el cliente pasado por NavLink, si lo hay
  //const customerFromNav = location.state?.customer;
  //const isEditable = location.state?.isEditable ?? true; // Editabilidad según el state

  // Estado inicial del cliente seleccionado
  const option = "Escoja una opción";
  //const [selectedCustomer, setSelectedCustomer] = useState(option);

  useEffect(() => {
    if (policy) {
      setForm((prev) => ({
        ...prev,
      }));
    }
  }, [policy]);

  //handleSelectChange para manejar la selección manual del cliente

  const handleSelectChange = (e) => {
    handleCard_Accunt(e);
    setSelectedCustomer(e.target.value);
    // Asegurar que se guarde como número
    changed({
      target: {
        name: "customers_id",
        value: parseInt(e.target.value),
      },
    });
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
    const value = Number(form.policyValue);
    const percentageAdvisor = Number(form.advisorPercentage);
    const percentageAgency = Number(form.agencyPercentage);
    const policyFee = Number(form.policyFee);
    let paymentAvisor = 0;
    let paymentAgency = 0;
    if (!isNaN(value) && !isNaN(percentageAdvisor) && !isNaN(policyFee)) {
      paymentAgency = Number(
        (value * percentageAgency) / 100 - policyFee
      ).toFixed(2);

      paymentAvisor = Number((paymentAgency * percentageAdvisor) / 100).toFixed(
        2
      );
      changed({
        target: {
          name: "paymentsToAgency",
          value: paymentAgency - paymentAvisor,
        },
      });

      changed({
        target: {
          name: "paymentsToAdvisor",
          value: paymentAvisor,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          statuspolicyResponse,
        ] = await Promise.all([
          http.get("policy/get-types"),
          http.get("company/get-all-company"),
          http.get("policy/get-frecuency"),
          http.get("customers/get-all-customer"),
          http.get("advisor/get-all-advisor"),
          http.get("policy/get-payment-method"),
          http.get("creditcard/all-cards-rp"),
          http.get("bankaccount/get-all-account"),
          http.get("policy/get-all-satus-policy"),
        ]);
        setType(typeResponse.data.allTypePolicy);
        setCompanies(companyResponse.data.allCompanies);
        setFrequency(frecuencyResponse.data.allFrecuency);
        setCustomer(customerResponse.data.allCustomer);
        setAdvisor(advisorResponse.data.allAdvisors);
        setPaymentMethod(paymentMethodResponse.data.allPaymentMethod);
        setCards(creditCardResponse.data.allCards);
        setAccounts(accountResponse.data.allBankAccounts);
        setAllStatusPolicy(statuspolicyResponse.data.allStatusPolicy);
      } catch (error) {
        alerts("Error", "Error fetching data.", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    calculateAdvisorPayment();
  }, [form.policyValue, form.advisorPercentage, calculateAdvisorPayment]);

  const updatePolicy = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let newPolicy = { ...form };
      const request = await http.post(
        `policy/update-policy/${policy.id}`,
        newPolicy
      );

      if (request.data.status === "success") {
        console.log("Poliza actualizada: ", request.data);
        alerts(
          "Actualización exitoso",
          "Póliza actualizada correctamente",
          "success"
        );
        //document.querySelector("#user-form").reset();
        // Llamar a la función de callback para propagar el cambio
        onPolicyUpdated(request.data.policyUpdate);
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        alerts(
          "Error",
          "Póliza no actualizada correctamente. Verificar que no haya campos vacios  números de pólzias duplicados",
          "error"
        );
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
      <div className="modal d-flex justify-content-center align-items-center mx-auto">
        <article className="modal-content text-center px-5 py-5">
          <div className="d-flex justify-content-center align-items-center conten-title rounded mb-3">
            <h3 className="text-white fw-bold">
              Poliza selecionada: {policy.numberPolicy}
            </h3>
          </div>
          <div className="justify-content-around mt-1">
            <form onSubmit={updatePolicy} id="user-form">
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
                    value={form.numberPolicy}
                  />
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
                    value={form.policy_type_id} // Establece el valor predeterminado
                  >
                    <option disabled>{option}</option>
                    {types.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.policyName}
                      </option>
                    ))}
                  </select>
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
                    value={form.company_id} // Establece el valor predeterminado
                  >
                    <option disabled>{option}</option>
                    {companies.map((copmany) => (
                      <option key={copmany.id} value={copmany.id}>
                        {copmany.companyName}
                      </option>
                    ))}
                  </select>
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
                    value={form.payment_frequency_id} // Establece el valor predeterminado
                  >
                    <option disabled>{option}</option>
                    {frequency.map((frequency) => (
                      <option key={frequency.id} value={frequency.id}>
                        {frequency.frequencyName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3 col-3">
                  <label htmlFor="customers_id" className="form-label">
                    Cliente Beneficiario
                  </label>
                  <select
                    className="form-select"
                    id="customers_id"
                    name="customers_id"
                    value={form.customers_id} // Seleccionamos el cliente automáticamente o se setea en vacio
                    onChange={handleSelectChange}
                    //disabled={!isEditable} // Deshabilitar el select si isEditable es false
                  >
                    {customers
                      .filter((item) => item.id === form.customers_id)
                      .map((customer) => (
                        <option key={customer.id} value={customer.id} disabled>
                          {`${customer.firstName} ${
                            customer.secondName || ""
                          } ${customer.surname} ${
                            customer.secondSurname || ""
                          }`.trim()}
                        </option>
                      ))}
                  </select>
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
                    value={form.advisor_id} // Establece el valor predeterminado
                  >
                    {advisor
                      .filter((item) => item.id === form.advisor_id)
                      .map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                          disabled={item.id == form.advisor_id}
                        >
                          {`${item.firstName} ${item.secondName || ""} ${
                            item.surname
                          } ${item.secondSurname || ""}`.trim()}
                        </option>
                      ))}
                  </select>
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
                    value={form.payment_method_id} // Establece el valor predeterminado
                  >
                    <option disabled>{option}</option>
                    {paymentMethod.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.methodName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3 col-3">
                  <label htmlFor="policy_status_id" className="form-label">
                    Estado de la Póliza (opcional)
                  </label>
                  <select
                    className="form-select"
                    id="policy_status_id"
                    name="policy_status_id"
                    onChange={changed}
                    value={form.policy_status_id}
                  >
                    {allStatusPolicy
                      .filter((status) => status.id != 3 && status.id != 4)
                      .map((status) => (
                        <option
                          key={status.id}
                          value={status.id}
                          disabled={status.id == form.policy_status_id}
                        >
                          {status.statusName}
                        </option>
                      ))}
                  </select>
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
                    >
                      {filteredAccount.length > 0 ? (
                        <>
                          <option disabled> {option}</option>
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
                    >
                      {filteredCard.length > 0 ? (
                        <>
                          <option disabled> {option}</option>
                          {filteredCard.map((card) => (
                            <option key={card.id} value={card.id}>
                              {card.cardNumber} - {card.bank?.bankName}
                            </option>
                          ))}
                        </>
                      ) : (
                        <option className="bs-danger-bg-subtle">
                          No hay tarjetas asociadas a este cliente.
                        </option>
                      )}
                    </select>
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
                    value={form.coverageAmount}
                  />
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
                  />
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
                </div>
                <div className="mb-3 col-3">
                  <label htmlFor="advisorPercentage" className="form-label">
                    Porcentaje del Asesor
                  </label>
                  <input
                    required
                    type="number"
                    className="form-control"
                    id="advisorPercentage"
                    name="advisorPercentage"
                    onChange={changed} // Llamada a la función
                    value={form.advisorPercentage}
                  />
                </div>

                <div className="mb-3 col-3 ">
                  <label htmlFor="flexRadioDefault7" className="form-label">
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
                      checked={form.renewalCommission === true}
                    ></input>
                    <label
                      className="form-check-label"
                      htmlFor="flexRadioDefault8"
                    >
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
                      checked={form.renewalCommission === false}
                    ></input>
                    <label
                      className="form-check-label"
                      htmlFor="flexRadioDefault8"
                    >
                      No
                    </label>
                  </div>
                </div>
                <div className="mb-3 col-3">
                  <label htmlFor="numberOfPayments" className="form-label">
                    Número de pagos de póliza
                  </label>
                  <input
                    required
                    type="number"
                    className="form-control"
                    id="numberOfPayments"
                    name="numberOfPayments"
                    value={form.numberOfPayments}
                    readOnly={selectedFrequencyId !== 5}
                    onChange={
                      selectedFrequencyId === 5
                        ? handlePaymentsChange
                        : undefined
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
                    value={form.startDate}
                  />
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
                    value={form.endDate}
                  />
                </div>
                <div className="mb-3 col-3">
                  <label htmlFor="paymentsToAgency" className="form-label">
                    Comisiones de la agencia
                  </label>
                  <input
                    readOnly
                    required
                    type="number"
                    className="form-control"
                    id=" paymentsToAgency"
                    name=" paymentsToAgency"
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
                    className="form-control"
                    id="paymentsToAdvisor"
                    name="paymentsToAdvisor"
                    value={form.paymentsToAdvisor || 0}
                  />
                </div>

                <div className="mb-3 col-3">
                  <label
                    htmlFor="numberOfPaymentsAdvisor"
                    className="form-label"
                  >
                    Número de pagos al Asesor
                  </label>
                  <input
                    required
                    type="number"
                    className="form-control"
                    id="numberOfPaymentsAdvisor"
                    name="numberOfPaymentsAdvisor"
                    value={form.numberOfPaymentsAdvisor}
                    readOnly={selectedFrequencyId !== 5}
                    onChange={
                      selectedFrequencyId === 5
                        ? handlePaymentsChange
                        : undefined
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
                    value={form.observations || ""}
                  />
                </div>

                <div className="mt-2 col-12">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn bg-success mx-5 text-white fw-bold "
                  >
                    {isLoading ? (
                      <div className="spinner-border text-light" role="status">
                        <span className="visually-hidden">Registrando...</span>
                      </div>
                    ) : (
                      "Actualizar Póliza"
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
UpdatePolicyModal.propTypes = {
  policy: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Hacer opcional y permitir string o number
    numberPolicy: PropTypes.string.isRequired,
    coverageAmount: PropTypes.string.isRequired,
    agencyPercentage: PropTypes.string.isRequired,
    advisorPercentage: PropTypes.string,
    policyValue: PropTypes.string.isRequired,
    numberOfPayments: PropTypes.number,
    startDate: PropTypes.string, // o PropTypes.instanceOf(Date) si es un objeto Date
    endDate: PropTypes.string,
    paymentsToAdvisor: PropTypes.string,
    paymentsToAgency: PropTypes.string,
    policyFee: PropTypes.string,
    observations: PropTypes.string,
    renewalCommission: PropTypes.bool,
    policyType: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      policyName: PropTypes.string.isRequired,
    }).isRequired,

    customer: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Hacer opcional y permitir string o number
      ci_ruc: PropTypes.string.isRequired,
      firstName: PropTypes.string.isRequired,
      secondName: PropTypes.string,
      surname: PropTypes.string.isRequired,
      secondSurname: PropTypes.string,
    }).isRequired,

    company: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Hacer opcional y permitir string o number
      companyName: PropTypes.string.isRequired,
    }).isRequired,

    advisor: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      firstName: PropTypes.string.isRequired,
      secondName: PropTypes.string,
      surname: PropTypes.string.isRequired,
      secondSurname: PropTypes.string,
    }).isRequired,

    paymentMethod: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Hacer opcional y permitir string o number
      methodName: PropTypes.string.isRequired,
    }).isRequired,

    bankAccount: PropTypes.shape({
      bank_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Hacer opcional y permitir string o number
      bank: PropTypes.shape({
        bankName: PropTypes.string.isRequired,
      }).isRequired,
    }),

    creditCard: PropTypes.shape({
      bank_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Hacer opcional y permitir string o number
      bank: PropTypes.shape({
        bankName: PropTypes.string.isRequired,
      }).isRequired,
    }),

    policyStatus: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Hacer opcional y permitir string o number
      statusName: PropTypes.string.isRequired,
    }).isRequired,

    paymentFrequency: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Hacer opcional y permitir string o number
      frequencyName: PropTypes.string.isRequired,
    }).isRequired,

    payments: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired, // Hacer opcional y permitir string o number
        pending_value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired,
        number_payment: PropTypes.number.isRequired,
        value: PropTypes.string.isRequired,
        credit: PropTypes.string.isRequired,
        balance: PropTypes.string.isRequired,
        total: PropTypes.string.isRequired,
        observations: PropTypes.string,
        createdAt: PropTypes.string.isRequired,
        status_payment_id: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.number,
        ]).isRequired, // Hacer opcional y permitir string o number
        paymentStatus: PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired, // Hacer opcional y permitir string o number
          statusNamePayment: PropTypes.string.isRequired,
        }).isRequired,
        updatedAt: PropTypes.string.isRequired,
      })
    ).isRequired,

    renewals: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired, // Hacer opcional y permitir string o number
        renewalNumber: PropTypes.string.isRequired,
        createdAt: PropTypes.string.isRequired,
      }).isRequired
    ),
  }).isRequired,

  onClose: PropTypes.func.isRequired,
};
export default UpdatePolicyModal;
