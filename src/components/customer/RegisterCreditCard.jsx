import UserFrom from "../../hooks/UserFrom";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
const RegisterCreditCard = () => {
  const { form, changed } = UserFrom({});
  const [customers, setCustomer] = useState([]);
  const [banks, setBanks] = useState([]);
  const [types, setTypes] = useState([]);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await http.get("customers/get-all-customer");
        const data = response.data;
        console.log(data);
        setCustomer(data.allCustomer);
      } catch (error) {
        console.error("Error fetching customers:", error);
        alerts("Error", "Error fetching customers.", "error");
      }
    };
    const fetchBanks = async () => {
      try {
        const response = await http.get("creditcard/all-banks");
        const data = response.data;
        console.log(data);
        setBanks(data.allBanks);
      } catch (error) {
        console.error("Error fetching banks:", error);
        alerts("Error", "Error fetching bank.", "error");
      }
    };

    const fetchTypes = async () => {
      try {
        const response = await http.get("creditcard/all-types");
        const data = response.data;
        console.log(data);
        setTypes(data.allTypes);
      } catch (error) {
        console.error("Error fetching customers:", error);
        alerts("Error", "Error fetching types.", "error");
      }
    };
    fetchBanks();
    fetchTypes();
    fetchCustomer();
  }, []);
  const savedCard = async (e) => {
    try {
      e.preventDefault();
      let newCard = form;
      const request = await http.post("creditcard/register-card", newCard);
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
    }
  };
  return (
    <>
      <div className="container-fluid">
        <form onSubmit={savedCard} id="user-form">
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
              >
                <option value="" selected disabled>
                  Escoja un cliente
                </option>
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
              >
                <option value="" selected disabled>
                  Escoja un tipo de tarjeta
                </option>
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
              >
                <option value="" selected disabled>
                  Escoja un Banco
                </option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.bankName}
                  </option>
                ))}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={''}
                >
                  Añadir Banco
                </button>
              </select>
            </div>

            <div className="mt-4 col-3">
              <button type="submit" className="btn btn-success mt-2 fw-bold">
                Registrar Tarjeta
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
