import UserForm from "../../hooks/UserForm";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { useEffect, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
const CreatePolicy = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { form, changed } = UserForm({});
  const [types, setType] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [frequencys, setFrecuency] = useState([]);
  const [customers, setCustomer] = useState([]);
  const [advisor, setAdvisor] = useState([]);
  const [cards, setCards] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  const [filteredCard, setFilteredCard] = useState([]);

  const handleCreditCard = (e) => {
    const selectedCustomerId = e.target.value;
    const selectedCustomer = customers.find(
      (customer) => customer.id === selectedCustomerId
    );
    if (selectedCustomer) {
      const customerCiRuc = selectedCustomer.ci_ruc;
      const filteredCards = cards.filter(
        (card) => card.customer.ci_ruc === customerCiRuc
      );
      setFilteredCard(filteredCards);
    }
    console.log("tarjetas del cliente", filteredCard);
    changed(e);
  };

  // Calcula el pago al asesor con usecallback,  evita la recreación innecesaria de la función en cada renderizado
  const calculateAdvisorPayment = useCallback(() => {
    const value = Number(form.policyValue);
    const percentage = Number(form.advisorPercentage);
    if (!isNaN(value) && !isNaN(percentage)) {
      const payment = (value * percentage) / 100;
      changed({
        target: {
          name: "paymentsToAdvisor",
          value: payment,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.policyValue, form.advisorPercentage]);
  const handlePaymentMethodChange = (e) => {
    const value = e.target.value;
    setSelectedPaymentMethod(value); // Actualiza el estado con el nuevo método de pago seleccionado
    changed(e); // Asegúrate de propagar el cambio al formulario
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
          paymentResponse,
          creditCardResponse,
        ] = await Promise.all([
          http.get("policy/get-types"),
          http.get("company/get-all-company"),
          http.get("policy/get-frecuency"),
          http.get("customers/get-all-customer"),
          http.get("advisor/get-all-advisor"),
          http.get("policy/get-payment"),
          http.get("creditcard/all-cards"),
        ]);

        setType(typeResponse.data.allTypePolicy);
        setCompanies(companyResponse.data.allCompanies);
        setFrecuency(frecuencyResponse.data.allFrecuency);
        setCustomer(customerResponse.data.allCustomer);
        setAdvisor(advisorResponse.data.allAdvisors);
        setPaymentMethod(paymentResponse.data.allPayment);
        setCards(creditCardResponse.data.allCards);
      } catch (error) {
        alerts("Error", "Error fetching data.", "error");
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    calculateAdvisorPayment();
  }, [form.policyValue, form.advisorPercentage, calculateAdvisorPayment]);

  const option = "Escoja una opción";

  const savedPolicy = async (e) => {
    setIsLoading(true);

    try {
      e.preventDefault();
      let newPolicy = form;
      const request = await http.post("policy/register-policy", newPolicy);
      if (request.data.status === "success") {
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
    } catch (error) {
      alerts("Error", "Error fetching policy.", "error");
      console.error("Error fetching asesor:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={savedPolicy} id="user-form">
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
              defaultValue={option}
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
              defaultValue={option}
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
              onChange={changed}
              defaultValue={option}
            >
              <option disabled>{option}</option>
              {frequencys.map((frequency) => (
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
              onChange={handleCreditCard}
              defaultValue={option}
            >
              <option disabled>{option}</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {`${customer.firstName} ${customer.secondName || ""} ${
                    customer.surname
                  } ${customer.secondSurname || ""}`.trim()}
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
              defaultValue={option}
            >
              <option disabled>{option}</option>
              {advisor.map((item) => (
                <option key={item.id} value={item.id}>
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
                    No hay tarjetas asociadas a este cliente. Registre una tarjeta o escoja otro método de pago
                  </option>
                )}
              </select>
            </div>
          )}
          <div className="mb-3 col-3">
            <label htmlFor="coverageAmount" className="form-label">
              Monto de Covertura
            </label>
            <input
              required
              type="number"
              className="form-control"
              id="coverageAmount"
              name="coverageAmount"
              onChange={changed}
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
            <label htmlFor="numberOfPayments" className="form-label">
              Número de pagos de póliza
            </label>
            <input
              required
              type="number"
              className="form-control"
              id="numberOfPayments"
              name="numberOfPayments"
              onChange={changed}
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
          </div>
          <div className="mb-3 col-3">
            <label htmlFor="paymentsToAdvisor" className="form-label">
              Pago de comisiones al asesor
            </label>
            <input
              readOnly
              required
              type="number"
              className="form-control"
              id="paymentsToAdvisor"
              name="paymentsToAdvisor"
              value={form.paymentsToAdvisor}
            />
          </div>
          <div className="mb-3 col-3">
            <label htmlFor="numberOfPaymentsAdvisor" className="form-label">
              Número de pagos al Asesor
            </label>
            <input
              required
              type="number"
              className="form-control"
              id="numberOfPaymentsAdvisor"
              name="numberOfPaymentsAdvisor"
              onChange={changed}
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
