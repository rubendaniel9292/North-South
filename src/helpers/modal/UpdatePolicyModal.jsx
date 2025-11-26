import PropTypes from "prop-types";
import UserForm from "../../hooks/UserForm";
import { useEffect, useState, useCallback } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { 
  faRectangleXmark,
  faFloppyDisk,
  faBarcode,
  faFileContract,
  faBuilding,
  faSync,
  faUser,
  faUserTie,
  faCreditCard,
  faUniversity,
  faDollarSign,
  faCalendarAlt,
  faPercent,
  faShield,
  faHashtag,
  faCheckSquare,
  faStickyNote,
  faMoneyBillWave,
  faCheckCircle
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { calculateAdvisorAndAgencyPayments } from "../../helpers/CommissionUtils";
const UpdatePolicyModal = ({ policy, onClose, onPolicyUpdated }) => {
  //pbeneres valor, % y derecho de poliza
  const lastPeriod = policy.periods.reduce((a, b) => (a.year > b.year ? a : b));
  if (!policy) return null;
  console.log("poliza obtenida: ", policy);
  const [isLoading, setIsLoading] = useState(false);

  // Mapeo inverso: de número de pagos a ID de frecuencia
  const getFrequencyIdFromPayments = (numberOfPayments) => {
    const paymentsToFrequencyMap = {
      12: 1, // 12 pagos = Mensual (ID 1)
      4: 2,  // 4 pagos = Trimestral (ID 2)
      2: 3,  // 2 pagos = Semestral (ID 3)
      1: 4,  // 1 pago = Anual (ID 4)
    };
    return paymentsToFrequencyMap[numberOfPayments] || policy.payment?.paymentFrequency.id || 1;
  };

  const { form, changed } = UserForm({
    numberPolicy: policy.numberPolicy,
    coverageAmount: policy.coverageAmount,
    //agencyPercentage: policy.agencyPercentage,
    //advisorPercentage: policy.advisorPercentage,
    //policyValue: policy.policyValue,
    //policyFee: policy.policyFee,
    agencyPercentage: lastPeriod.agencyPercentage,
    advisorPercentage: lastPeriod.advisorPercentage,
    policyValue: lastPeriod.policyValue,
    policyFee: lastPeriod.policyFee,
    startDate: dayjs.utc(policy.startDate).format("YYYY-MM-DD").toString(),
    endDate: dayjs.utc(policy.endDate).format("YYYY-MM-DD").toString(),
    paymentsToAdvisor: policy.paymentsToAdvisor,
    paymentsToAgency: policy.paymentsToAgency,
    observations: policy.observations,
    renewalCommission: policy.renewalCommission,
    isCommissionAnnualized: policy.isCommissionAnnualized,
    policy_type_id: policy.policyType.id,
    company_id: policy.company.id,
    customers_id: policy.customer.id,
    advisor_id: policy.advisor.id,
    payment_method_id: policy.paymentMethod.id,
    credit_card_id: policy.creditCard?.id,
    bank_account_id: policy.bankAccount?.id,
    payment_frequency_id: getFrequencyIdFromPayments(policy.numberOfPayments),
    numberOfPayments: policy.numberOfPayments,
    numberOfPaymentsAdvisor: policy.numberOfPayments,
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
  const [allStatusPolicy, setAllStatusPolicy] = useState([]);

  // Estado inicial del cliente seleccionado
  const option = "Escoja una opción";
  //const [selectedCustomer, setSelectedCustomer] = useState(option);

  //filtro de tarjeta por clienes
  const handleCard_Accunt = useCallback(
    (e) => {
      const selectedCustomerId = e.target.value;
      const selectedCustomer = customers.find(
        (customer) => customer.id === selectedCustomerId
      );

      if (selectedCustomer) {
        const customerCiRuc = selectedCustomer.ci_ruc;

        if (cards && cards.length > 0) {
          const filteredCards = cards.filter(
            (card) => card.customer.ci_ruc === customerCiRuc
          );
          setFilteredCard(filteredCards);
        } else {
          setFilteredCard([]);
        }

        if (accounts && accounts.length > 0) {
          const filteredAccount = accounts.filter(
            (account) => account.customer.ci_ruc === customerCiRuc
          );
          setFilteredAccount(filteredAccount);
        } else {
          setFilteredAccount([]);
        }
      }

      changed(e);
    },
    [customers, cards, accounts, changed]
  );
  //handleSelectChange para manejar la selección manual del cliente
  const handleSelectChange = useCallback(
    (e) => {
      handleCard_Accunt(e);
      // Asegurar que se guarde como número
      changed({
        target: {
          name: "customers_id",
          value: parseInt(e.target.value),
        },
      });
    },
    [handleCard_Accunt, changed]
  );

  const addClassSafely = useCallback((id, className) => {
    const element = document.getElementById(id);
    if (element) element.classList.add(className);
  }, []);

  // Calcula el pago al asesor con usecallback,  evita la recreación innecesaria de la función en cada renderizado
  const calculateAdvisorPayment = useCallback(() => {
    const { paymentsToAgency, paymentsToAdvisor } =
      calculateAdvisorAndAgencyPayments(
        form.policyValue,
        form.policyFee,
        form.agencyPercentage,
        form.advisorPercentage
      );

    changed({
      target: {
        name: "paymentsToAgency",
        value: paymentsToAgency,
      },
    });

    changed({
      target: {
        name: "paymentsToAdvisor",
        value: paymentsToAdvisor,
      },
    });
    // Agregar clase is-valid a los campos calculados automáticamente de manera segura
    addClassSafely("paymentsToAgency", "is-valid");
    addClassSafely("paymentsToAdvisor", "is-valid");
    addClassSafely("numberOfPayments", "is-valid");
    addClassSafely("numberOfPaymentsAdvisor", "is-valid");
  }, [
    form.policyValue,
    form.policyFee,
    form.agencyPercentage,
    form.advisorPercentage,
  ]);

  const handlePaymentMethodChange = useCallback(
    (e) => {
      const paymentMetohd = e.target.value;
      setSelectedPaymentMethod(paymentMetohd);
      changed(e);
    },
    [changed]
  );

  // Maneja el cambio de frecuencia de pago
  const handleFrequencyChange = useCallback(
    (e) => {
      const selectedFrequencyId = Number(e.target.value);
      console.log(
        "selectedFrequencyId:",
        selectedFrequencyId && typeof selectedFrequencyId
      );

      const frequencyMap = {
        1: 12, // Mensual
        2: 4, // Trimestral
        3: 2, // Semestral
        4: 1, // Anual (default)
        5: "", // otro
      };

      const calculatedPayments = frequencyMap[selectedFrequencyId];

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
    },
    [changed]
  );

  const handlePaymentsChange = useCallback(
    (e) => {
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
    },
    [changed]
  );
  const fetchData = useCallback(async () => {
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
      console.error("Error fetching data:", error);
      alerts("Error", "Error fetching data.", "error");
    }
  }, []);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    calculateAdvisorPayment();
  }, [form.policyValue, form.advisorPercentage, calculateAdvisorPayment]);

  const updatePolicy = useCallback(
    async (e) => {
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

          // Llamar a la función de callback para propagar el cambio
          onPolicyUpdated(request.data.policyUpdate);
          setTimeout(() => {
            onClose();
          }, 500);
        } else {
          alerts(
            "Error",
            "Póliza no actualizada correctamente. Verificar que no haya campos vacíos números de pólizas duplicados",
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
    },
    [form, policy.id, onPolicyUpdated, onClose]
  );
  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto">
        <article className="modal-content text-center px-5 py-5">
          <div className="d-flex justify-content-center align-items-center conten-title rounded">
            <h3 className="text-white fw-bold">
              Poliza selecionada para actualizar: {policy.numberPolicy}
            </h3>
          </div>

          <div className="justify-content-around mt-1">
            <form
              onSubmit={updatePolicy}
              id="user-form"
              className="needs-validation was-validated"
            >
              <div className="row pt-3 fw-bold">
                <div className="mb-3 col-3">
                  <label htmlFor="numberPolicy" className="form-label">
                    <FontAwesomeIcon icon={faBarcode} className="me-2" />
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
                    <FontAwesomeIcon icon={faFileContract} className="me-2" />
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
                    <FontAwesomeIcon icon={faBuilding} className="me-2" />
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
                    {companies
                      //.filter((copmany) => copmany.id === form.company_id)
                      .map((copmany) => (
                        <option key={copmany.id} value={copmany.id} disabled={copmany.id == form.company_id}>
                          {copmany.companyName}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="mb-3 col-3">
                  <label htmlFor="payment_frequency_id" className="form-label">
                    <FontAwesomeIcon icon={faSync} className="me-2" />
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
                    <FontAwesomeIcon icon={faUser} className="me-2" />
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
                          {`${customer.firstName} ${customer.secondName || ""
                            } ${customer.surname} ${customer.secondSurname || ""
                            }`.trim()}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="mb-3 col-3">
                  <label htmlFor="advisor_id" className="form-label">
                    <FontAwesomeIcon icon={faUserTie} className="me-2" />
                    Asesor
                  </label>
                  <select
                    className="form-select"
                    id="advisor_id"
                    name="advisor_id"
                    onChange={changed}
                    value={form.advisor_id} // Establece el valor predeterminado
                  >
                    {
                      advisor
                        .map((item) => (
                          <option
                            key={item.id}
                            value={item.id}
                            disabled={item.id == form.advisor_id}
                          >
                            {`${item.firstName} ${item.secondName || ""} ${item.surname
                              } ${item.secondSurname || ""}`.trim()}
                          </option>
                        ))
                    }
                    {/*advisor
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
                      ))*/}
                  </select>
                </div>
                <div className="mb-3 col-3">
                  <label htmlFor="payment_method_id" className="form-label">
                    <FontAwesomeIcon icon={faCreditCard} className="me-2" />
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
                    <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                    Estado de Póliza
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
                      <FontAwesomeIcon icon={faUniversity} className="me-2" />
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
                      <FontAwesomeIcon icon={faCreditCard} className="me-2" />
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
                    <FontAwesomeIcon icon={faShield} className="me-2" />
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
                    <FontAwesomeIcon icon={faDollarSign} className="me-2" />
                    Valor de la Póliza
                  </label>
                  <input
                    required
                    type="number"
                    className="form-control"
                    id="policyValue"
                    name="policyValue"
                    value={form.policyValue}
                    step={"0.01"}
                    onChange={changed} // Llamada a la función
                  />
                </div>
                <div className="mb-3 col-3">
                  <label htmlFor="policyFee" className="form-label">
                    <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                    Derecho de póliza (opcional)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="policyFee"
                    name="policyFee"
                    value={form.policyFee}
                    step={"0.01"}
                    onChange={changed} // Llamada a la función
                  />
                </div>
                <div className="mb-3 col-3">
                  <label htmlFor="agencyPercentage" className="form-label">
                    <FontAwesomeIcon icon={faPercent} className="me-2" />
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
                    <FontAwesomeIcon icon={faPercent} className="me-2" />
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
                    <FontAwesomeIcon icon={faCheckSquare} className="me-2" />
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
                  <label className="form-label">
                    <FontAwesomeIcon icon={faSync} className="me-2" />
                    Frecuencia de pago de comisiones
                  </label>
                  <div className="form-check">
                    <input

                      className="form-check-input"
                      type="radio"
                      name="isCommissionAnnualized"
                      id="commissionAnnualized"
                      value="true"
                      onChange={changed}
                      defaultChecked={form.isCommissionAnnualized === true}
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

                      className="form-check-input"
                      type="radio"
                      name="isCommissionAnnualized"
                      id="commissionNormal"
                      value="false"
                      onChange={changed}
                      defaultChecked={form.isCommissionAnnualized === false}
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
                    <FontAwesomeIcon icon={faHashtag} className="me-2" />
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
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
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
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
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
                    <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
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
                    <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
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
                    <FontAwesomeIcon icon={faHashtag} className="me-2" />
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
                    <FontAwesomeIcon icon={faStickyNote} className="me-2" />
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
                  <div className="valid-feedback">
                    Campo opcional: ingrese cualquier inforación adicional.
                  </div>
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
    isCommissionAnnualized: PropTypes.bool,
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

    periods: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired,
        year: PropTypes.number.isRequired,
        policy_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired,
        advisorPercentage: PropTypes.number.isRequired,
        agencyPercentage: PropTypes.number.isRequired,
        policyValue: PropTypes.number.isRequired,
        policyFee: PropTypes.number,
      })
    ).isRequired,

  }).isRequired,

  onClose: PropTypes.func.isRequired,
};
export default UpdatePolicyModal;
