import UserForm from "../../hooks/UserForm";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
const RegisterCreditCard = () => {
  const { form, changed } = UserForm({});
  const [customers, setCustomer] = useState([]);
  const [banks, setBanks] = useState([]);
  const [types, setTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customerResponse, banksResponse, typesResponse] =
          await Promise.all([
            http.get("customers/get-all-customer"),
            http.get("creditcard/all-banks"),
            http.get("creditcard/all-types"),
          ]);

        const customersData = customerResponse.data?.allCustomer || [];
        const banksData = banksResponse.data?.allBanks || [];
        const typesData = typesResponse.data?.allTypes || [];

        console.log(customersData, banksData, typesData);

        setCustomer(customersData);
        setBanks(banksData);
        setTypes(typesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        alerts("Error", "Error fetching data.", "error");
      }
    };

    fetchData();
  }, []);
  const option = "Escoja una opción";
  const savedCard = async (e) => {
    setIsLoading(true);
    try {
      e.preventDefault();
      let newCard = form;
      const request = await http.post(`creditcard/register-card`, newCard);
      if (request.data.status === "success") {
        alerts(
          "Registro exitoso",
          "Tarjeta registrado registrado correctamente",
          "success"
        );
        document.querySelector("#user-form").reset();
      } else {
        //setSaved('error');
        alerts(
          "Error",
          "Tarjeta no registrada correctamente. Verificar que no haya campos vacíos o que la tarjeta no esté caducada.",
          "error"
        );
      }
    } catch (error) {
      alerts("Error", "Error fetching cards.", "error");
      console.error("Error fetching cards:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <div className="container-fluid">
        <form onSubmit={savedCard} id="user-form" className="needs-validation was-validated">
          <div className="row pt-3 fw-bold">
            <div className="mb-3 col-3">
              <label htmlFor="customers_id" className="form-label">
                Cliente
              </label>
              <select
                className="form-select"
                id="customers_id"
                name="customers_id"
                onChange={changed}
                required
              
              >
                <option disabled selected value={""}>{option}</option>
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
              <label htmlFor="cardNumber" className="form-label">
                Número de tarjeta
              </label>
              <input
                required
                type="text"
                className="form-control"
                id="cardNumber"
                name="cardNumber"
                onChange={changed}
              />
            </div>
            <div className="mb-3 col-3">
              <label htmlFor="cardNumber" className="form-label">
                Código
              </label>
              <input
                required
                type="text"
                className="form-control"
                id="code"
                name="code"
                onChange={changed}
              />
            </div>

            <div className="mb-3 col-3">
              <label htmlFor="text" className="form-label">
                Fecha de vencimiento
              </label>
              <input
                required
                type="date"
                className="form-control"
                id="expirationDate"
                name="expirationDate"
                onChange={changed}
              />
            </div>
            <div className="mb-3 col-3">
              <label htmlFor="card_option_id" className="form-label">
                Tipo de tarjeta
              </label>
              <select
                className="form-select"
                id="card_option_id"
                name="card_option_id"
                onChange={changed}
                required
              >
                <option disabled selected value={""}>{option}</option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.cardName}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3 col-3">
              <label htmlFor="bank_id" className="form-label">
                Banco
              </label>
              <select
                className="form-select"
                id="bank_id"
                name="bank_id"
                onChange={changed}
                required
              >
                <option disabled selected value={""}>{option}</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.bankName}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 col-3">
              <button type="submit" className="btn btn-success mt-2 fw-bold">
                {isLoading ? (
                  <div className="spinner-border text-light" role="status">
                    <span className="visually-hidden">Registrando...</span>
                  </div>
                ) : (
                  "Registrar Tarjeta"
                )}
                <FontAwesomeIcon className="mx-2" icon={faFloppyDisk} beat />
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default RegisterCreditCard;
