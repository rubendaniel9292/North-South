import UserForm from "../../hooks/UserForm";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { useEffect, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { useLocation } from "react-router-dom";

import { calculateAdvisorAndAgencyPayments } from "../../helpers/CommissionUtils";
const CreatePolicy = () => {
  const option = "Escoja una opción";
  const [showCardModal, setShowCardModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { form, changed } = UserForm({
    numberOfPayments: "",
    numberOfPaymentsAdvisor: "",
    payment_frequency_id: 0,
    policyFee: "",
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
  const [cardTypes, setCardTypes] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(option);
  // Estados para manejo de registro inline de tarjetas y cuentas

  const [cardFormData, setCardFormData] = useState({
    cardNumber: "",
    code: "",
    expirationMonth: "",
    expirationYear: "",
    bank_id: "",
    card_option_id: "",
    customers_id: selectedCustomer,
  });
  const [accountFormData, setAccountFormData] = useState({
    accountNumber: "",
    bank_id: "",
    account_type_id: "",
  });
  const [banks, setBanks] = useState([]);

  const [accountTypes, setAccountTypes] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      // Cargar datos esenciales primero (los que ya funcionaban antes)
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

      setType(typeResponse.data?.allTypePolicy);
      setCompanies(companyResponse.data?.allCompanies);
      setFrequency(frecuencyResponse.data?.allFrecuency);
      setCustomer(customerResponse.data?.allCustomer);
      setAdvisor(advisorResponse.data?.allAdvisors);
      setPaymentMethod(paymentMethodResponse?.data.allPaymentMethod);
      setCards(creditCardResponse.data?.allCards);
      setAccounts(accountResponse.data?.allBankAccounts);

      // Cargar datos adicionales para registro inline (opcional)
      try {
        const banksResponse = await http.get("creditcard/all-banks");
        setBanks(banksResponse.data?.allBanks);
      } catch (banksError) {
        console.error("Error cargando bancos:", banksError);
        setBanks([]);
      }

      try {
        const cardTypesResponse = await http.get("creditcard/all-types");
        console.log("Tipos de tarjeta:", cardTypesResponse.data);
        setCardTypes(cardTypesResponse.data?.allTypes || []);
      } catch (cardTypesError) {
        console.error("Error cargando tipos de tarjeta:", cardTypesError);
        setCardTypes([]);
      }

      try {
        const accountTypesResponse = await http.get(
          "bankaccount/all-type-accounts"
        );
        setAccountTypes(accountTypesResponse.data?.allTypeAccounts || []);
      } catch (accountTypesError) {
        console.error("Error cargando tipos de cuenta:", accountTypesError);
        setAccountTypes([]);
      }
    } catch (error) {
      console.error("Error cargando datos principales:", error);
      alerts(
        "Error",
        "Error cargando datos principales. Algunos endpoints pueden no estar disponibles.",
        "error"
      );
    }
  }, []); // ✅ Sin dependencias - solo se ejecuta una vez

  // ✅ useEffect solo llama a la función
  useEffect(() => {
    fetchData();
  }, [fetchData]); // ✅ fetchData como dependencia

  const location = useLocation();
  // Obtenemos el cliente pasado por NavLink, si lo hay
  const customerFromNav = location.state?.customer;
  const isEditable = location.state?.isEditable ?? true; // Editabilidad según el state

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
    },
    [isEditable, changed, handleCard_Accunt]
  );
  const addClassSafely = (id, className) => {
    const element = document.getElementById(id);
    if (element) element.classList.add(className);
  };
  // Calcula el pago al asesor con usecallback,  evita la recreación innecesaria de la función en cada renderizado/*
  const calculateAdvisorPayment = useCallback(() => {
    // Validar que los valores necesarios estén disponibles y sean números válidos
    const policyValue = parseFloat(form.policyValue) || 0;
    const policyFee = parseFloat(form.policyFee) || 0;
    const agencyPercentage = parseFloat(form.agencyPercentage) || 0;
    const advisorPercentage = parseFloat(form.advisorPercentage) || 0;

    // Solo calcular si tenemos valores válidos
    if (policyValue > 0 && agencyPercentage > 0 && advisorPercentage > 0) {
      const { paymentsToAgency, paymentsToAdvisor } =
        calculateAdvisorAndAgencyPayments(
          policyValue,
          policyFee,
          agencyPercentage,
          advisorPercentage
        );

      // Validar que los resultados sean números válidos antes de actualizar el estado
      if (!isNaN(paymentsToAgency) && !isNaN(paymentsToAdvisor)) {
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
      }
    }
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

  // Si hay un cliente pasado por NavLink, actualizamos el estado
  useEffect(() => {
    if (customerFromNav) {
      // ...código...
      handleCard_Accunt(syntheticEvent);
    }
  }, [customerFromNav, customers, cards, accounts, handleCard_Accunt]);

  // Manejadores para formularios inline
  const handleCardFormChange = (e) => {
    const { name, value } = e.target;
    setCardFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAccountFormChange = (e) => {
    const { name, value } = e.target;
    setAccountFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Funciones para cerrar modales
  const handleCloseCardModal = () => {
    setShowCardModal(false);
    setCardFormData({
      cardNumber: "",
      code: "", // ✅ Cambiar de "cvv" a "code"
      expirationMonth: "",
      expirationYear: "",
      bank_id: "",
      card_option_id: "", // ✅ Cambiar a "card_option_id"
    });
  };

  const handleCloseAccountModal = () => {
    setShowAccountModal(false);
    setAccountFormData({
      accountNumber: "",
      bank_id: "",
    });
  };

  const saveInlineCard = useCallback(async () => {
    try {
      // Construir la fecha de vencimiento con día 1
      const expirationDate =
        cardFormData.expirationMonth && cardFormData.expirationYear
          ? `${cardFormData.expirationYear}-${cardFormData.expirationMonth}-01`
          : null;

      const cardData = {
        cardNumber: cardFormData.cardNumber,
        code: cardFormData.code,
        expirationDate: expirationDate,
        bank_id: parseInt(cardFormData.bank_id),
        card_option_id: parseInt(cardFormData.card_option_id),
        customers_id: parseInt(selectedCustomer),
      };

      const response = await http.post("creditcard/register-card", cardData);

      if (response.data.status === "success") {
        alerts("Éxito", "Tarjeta registrada correctamente", "success");

        // Actualizar la lista de tarjetas
        const updatedCards = await http.get(`creditcard/all-cards-rp`);
        setCards(updatedCards.data.allCards);

        // Refilter cards for current customer
        const customerCiRuc = customers.find(
          (c) => c.id == selectedCustomer
        )?.ci_ruc;

        if (customerCiRuc) {
          const newFilteredCards = updatedCards.data.allCards.filter(
            (card) => card.customer.ci_ruc === customerCiRuc
          );
          setFilteredCard(newFilteredCards);

          // Seleccionar automáticamente la nueva tarjeta
          const newCard = response.data.creditCard;
          if (newCard) {
            changed({
              target: {
                name: "credit_card_id",
                value: newCard.id,
              },
            });
          }
        }

        // Limpiar formulario
        setCardFormData({
          cardNumber: "",
          code: "",
          expirationMonth: "",
          expirationYear: "",
          bank_id: "",
          card_option_id: "",
        });
      }
    } catch (error) {
      alerts("Error", "No se pudo registrar la tarjeta", "error");
      console.error("Error saving card:", error);
    }
  }, [cardFormData, selectedCustomer, customers, changed]); // ✅ Dependencias

  const saveInlineAccount = useCallback(async () => {
    try {
      const accountData = {
        ...accountFormData,
        customers_id: parseInt(selectedCustomer),
      };

      const response = await http.post(
        "bankaccount/register-account",
        accountData
      );

      if (response.data.status === "success") {
        alerts("Éxito", "Cuenta bancaria registrada correctamente", "success");

        // Actualizar la lista de cuentas
        const updatedAccounts = await http.get("bankaccount/get-all-account");
        setAccounts(updatedAccounts.data.allBankAccounts);

        // Refilter accounts for current customer
        const customerCiRuc = customers.find(
          (c) => c.id == selectedCustomer
        )?.ci_ruc;

        if (customerCiRuc) {
          const newFilteredAccounts =
            updatedAccounts.data.allBankAccounts.filter(
              (account) => account.customer.ci_ruc === customerCiRuc
            );
          setFilteredAccount(newFilteredAccounts);

          // Seleccionar automáticamente la nueva cuenta
          const newAccount = response.data.bankAccount;
          if (newAccount) {
            changed({
              target: {
                name: "bank_account_id",
                value: newAccount.id,
              },
            });
          }
        }

        // Limpiar formulario
        setAccountFormData({
          accountNumber: "",
          bank_id: "",
          account_type_id: "",
        });
      }
    } catch (error) {
      alerts("Error", "No se pudo registrar la cuenta bancaria", "error");
      console.error("Error saving account:", error);
    }
  }, [accountFormData, selectedCustomer, customers, changed]); // ✅ Dependencias
  useEffect(() => {
    // Solo ejecutar cálculos si tenemos valores válidos para evitar NaN
    if (form.policyValue && form.agencyPercentage && form.advisorPercentage) {
      calculateAdvisorPayment();
    }
  }, [
    form.policyValue,
    form.agencyPercentage,
    form.advisorPercentage,
    calculateAdvisorPayment,
  ]);

  //handler especial para el campo advisorPercentage

  const handleAdvisorPercentageChange = useCallback(
    (e) => {
      changed(e); // Actualiza el form normalmente
      const advisorVal = Number(e.target.value);
      const agencyVal = Number(form.agencyPercentage);

      if (agencyVal === 0) {
        setErrorAdvisorPercentage(
          "Primero ingrese el porcentaje de la agencia"
        );
      } else if (advisorVal >= agencyVal) {
        setErrorAdvisorPercentage(
          "El porcentaje del asesor debe ser menor o igual que el de la agencia"
        );
      } else if (advisorVal === "") {
        setErrorAdvisorPercentage("Por favor ingrese el porcentaje del asesor");
      } else {
        setErrorAdvisorPercentage("");
      }
    },
    [changed, form.agencyPercentage]
  ); // ✅ Dependencias

  const savedPolicy = useCallback(
    async (e) => {
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
          console.log("Formulario válido, enviando datos...");
          const request = await http.post("policy/register-policy", form);

          if (request.data.status === "success") {
            console.log("Poliza registrada: ", request.data);
            setTimeout(() => {
              alerts(
                "Registro exitoso",
                "Póliza registrada correctamente",
                "success"
              );
              document.querySelector("#user-form").reset();
            }, 500);
          } else {
            alerts(
              "Error",
              "Póliza no registrada correctamente. Verificar que no haya campos vacios números de pólizas duplicados",
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
    },
    [form]
  ); // ✅ Dependencia: solo se recrea cuando cambia el form
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
              {customers?.map((customer) => (
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

              {filteredAccount.length > 0 ? (
                <select
                  className="form-select"
                  id="bank_account_id"
                  name="bank_account_id"
                  onChange={changed}
                  defaultValue={option}
                  required
                  aria-label="select example"
                >
                  <option disabled value={""} selected>
                    {option}
                  </option>
                  {filteredAccount.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.accountNumber} - {account.bank?.bankName}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="border rounded p-1 bg-light">
                  <div className="mb-2">
                    <small className="text-muted">
                      Este cliente no tiene cuentas bancarias registradas.
                    </small>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm mt-2"
                    onClick={() => setShowAccountModal(true)}
                  >
                    Registrar Nueva Cuenta
                  </button>
                </div>
              )}

              <div className="invalid-feedback">
                Por favor escoja o registre una cuenta
              </div>
            </div>
          )}

          {selectedPaymentMethod === "6" && (
            <div className="mb-3 col-3">
              <label htmlFor="credit_card_id" className="form-label">
                Tarjeta de Crédito
              </label>

              {filteredCard.length > 0 ? (
                <select
                  className="form-select"
                  id="credit_card_id"
                  name="credit_card_id"
                  onChange={changed}
                  defaultValue={option}
                  required
                  aria-label="select example"
                >
                  <option disabled selected value={""}>
                    {option}
                  </option>
                  {filteredCard.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.cardNumber} - {card.bank?.bankName}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="border rounded p-1 bg-light">
                  <div className="mb-2">
                    <small className="text-muted">
                      Este cliente no tiene tarjetas registradas. tarjeta
                    </small>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm mt-2"
                    onClick={() => setShowCardModal(true)}
                  >
                    Registrar Nueva Tarjeta
                  </button>
                </div>
              )}

              <div className="invalid-feedback">
                Por favor escoja o registre una tarjeta.
              </div>
            </div>
          )}
          {showCardModal && (
            <div
              className="modal show d-block"
              tabIndex="-1"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            >
              <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      Registrar Nueva Tarjeta de Crédito
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={handleCloseCardModal}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="row mx-1 my-1">
                      <div className="col-12 mb-3">
                        <label
                          htmlFor="customers_id_card"
                          className="form-label"
                        >
                          Cliente
                        </label>
                        <select
                          className="form-select"
                          id="customers_id_card"
                          name="customers_id"
                          value={selectedCustomer}
                          disabled
                          required
                        >
                          <option value="">Cliente seleccionado</option>
                          {customers?.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                              {`${customer.firstName} ${
                                customer.secondName || ""
                              } ${customer.surname} ${
                                customer.secondSurname || ""
                              }`.trim()}
                            </option>
                          ))}
                        </select>
                        <small className="text-muted">
                          La tarjeta se registrará para el cliente seleccionado
                          en el formulario principal
                        </small>
                      </div>

                      <div className="col-8 mb-3">
                        <label htmlFor="cardNumber" className="form-label">
                          Número de Tarjeta
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="cardNumber"
                          name="cardNumber"
                          value={cardFormData.cardNumber}
                          onChange={handleCardFormChange}
                          required
                          placeholder="**** **** **** 1234"
                          pattern="[0-9]{16}"
                          maxLength="16"
                        />
                      </div>

                      <div className="col-4 mb-3">
                        <label htmlFor="code" className="form-label">
                          CVV
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="code"
                          name="code"
                          value={cardFormData.code}
                          onChange={handleCardFormChange}
                          required
                          placeholder="123"
                          pattern="[0-9]{3,4}"
                          maxLength="4"
                        />
                      </div>

                      <div className="col-6 mb-3">
                        <label htmlFor="expirationMonth" className="form-label">
                          Mes de Vencimiento
                        </label>
                        <select
                          className="form-select"
                          id="expirationMonth"
                          name="expirationMonth"
                          value={cardFormData.expirationMonth}
                          onChange={handleCardFormChange}
                          required
                        >
                          <option disabled selected value="">
                            Seleccione mes
                          </option>
                          {Array.from({ length: 12 }, (_, i) => (
                            <option
                              key={i + 1}
                              value={String(i + 1).padStart(2, "0")}
                            >
                              {String(i + 1).padStart(2, "0")} -{" "}
                              {new Date(0, i).toLocaleString("es", {
                                month: "long",
                              })}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-6 mb-3">
                        <label htmlFor="expirationYear" className="form-label">
                          Año de Vencimiento
                        </label>
                        <select
                          className="form-select"
                          id="expirationYear"
                          name="expirationYear"
                          value={cardFormData.expirationYear}
                          onChange={handleCardFormChange}
                          required
                        >
                          <option disabled selected value="">
                            Seleccione año
                          </option>
                          {Array.from({ length: 15 }, (_, i) => (
                            <option key={2025 + i} value={2025 + i}>
                              {2025 + i}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-6 mb-3">
                        <label htmlFor="bank_id_card" className="form-label">
                          Banco Emisor
                        </label>
                        <select
                          className="form-select"
                          id="bank_id_card"
                          name="bank_id"
                          value={cardFormData.bank_id}
                          onChange={handleCardFormChange}
                          required
                        >
                          <option disabled selected value="">
                            Seleccione un banco
                          </option>
                          {banks.map((bank) => (
                            <option key={bank.id} value={bank.id}>
                              {bank.bankName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-6 mb-3">
                        <label htmlFor="card_type_id" className="form-label">
                          Tipo de Tarjeta
                        </label>
                        <select
                          className="form-select"
                          id="card_option_id"
                          name="card_option_id"
                          value={cardFormData.card_option_id}
                          onChange={handleCardFormChange}
                          required
                        >
                          <option disabled selected value="">
                            Seleccione tipo
                          </option>
                          {cardTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.cardName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCloseCardModal}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={saveInlineCard}
                    >
                      Registrar Tarjeta
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {showAccountModal && (
            <div
              className="modal show d-block"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            >
              <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      Registrar Nueva Cuenta Bancaria
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={handleCloseAccountModal}
                    ></button>
                  </div>
                  <div className="modal-body ">
                    {/* Campo de Cliente (obligatorio) */}

                    <div className="row mx-1 my-1">
                      <div className="col-12 mb-3">
                        <label
                          htmlFor="customers_id_account"
                          className="form-label"
                        >
                          Cliente
                        </label>
                        <select
                          className="form-select"
                          id="customers_id_account"
                          name="customers_id"
                          value={selectedCustomer}
                          disabled
                          required
                        >
                          <option value="">Cliente seleccionado</option>
                          {customers?.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                              {`${customer.firstName} ${
                                customer.secondName || ""
                              } ${customer.surname} ${
                                customer.secondSurname || ""
                              }`.trim()}
                            </option>
                          ))}
                        </select>
                        <small className="text-muted">
                          La cuenta se registrará para el cliente seleccionado
                          en el formulario principal
                        </small>
                      </div>
                      <div className="col-12 mb-3">
                        <label htmlFor="accountNumber" className="form-label">
                          Número de Cuenta
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="accountNumber"
                          name="accountNumber"
                          value={accountFormData.accountNumber}
                          onChange={handleAccountFormChange}
                          required
                          placeholder="Ej: 1234567890"
                        />
                      </div>

                      <div className="col-6 mb-3">
                        <label htmlFor="bank_id_account" className="form-label">
                          Banco
                        </label>
                        <select
                          className="form-select"
                          id="bank_id_account"
                          name="bank_id"
                          value={accountFormData.bank_id}
                          onChange={handleAccountFormChange}
                          required
                        >
                          <option disabled selected value="">
                            Seleccione un banco
                          </option>
                          {banks.map((bank) => (
                            <option key={bank.id} value={bank.id}>
                              {bank.bankName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-6 mb-3">
                        <label htmlFor="account_type_id" className="form-label">
                          Tipo de Cuenta
                        </label>
                        <select
                          className="form-select"
                          id="account_type_id"
                          name="account_type_id"
                          value={accountFormData.account_type_id}
                          onChange={handleAccountFormChange}
                          required
                        >
                          <option disabled selected value="">
                            Seleccione tipo
                          </option>
                          {accountTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.typeName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCloseAccountModal}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={saveInlineAccount}
                    >
                      Registrar Cuenta
                    </button>
                  </div>
                </div>
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
              value={form.coverageAmount || ""} 
              step="0.01"
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
              step={0.01} // Permite decimales
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
              step={0.01} // Permite decimales
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
              value={form.agencyPercentage || ""} 
              step="0.01"
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
                Number(form.advisorPercentage) > Number(form.agencyPercentage)
                  ? "is-invalid"
                  : "is-valid"
              }`}
              id="advisorPercentage"
              name="advisorPercentage"
              onChange={handleAdvisorPercentageChange}
              value={form.advisorPercentage || ""} 
              step="0.01"
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
                <>
                  <div className="spinner-border text-light" role="status">
                    <span className="visually-hidden">Registrando...</span>
                  </div>
                  Registrando Póliza...
                </>
              ) : (
                <>
                  Registrar Póliza
                  <FontAwesomeIcon className="mx-2 " icon={faFloppyDisk} beat />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default CreatePolicy;
