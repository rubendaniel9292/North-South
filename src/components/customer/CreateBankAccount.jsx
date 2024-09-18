import UserForm from "../../hooks/UserForm";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";

const CreateBankAccount = () => {
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
            http.get("bankaccount/all-banks"),
            http.get("bankaccount/all-type-accounts"),
          ]);

        const customersData = customerResponse.data?.allCustomer || [];
        const banksData = banksResponse.data?.allBanks || [];
        const typesData = typesResponse.data?.allTypeAccounts || [];

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
  const savedBankAccount = async (e) => {
    setIsLoading(true);
    try {
      e.preventDefault();
      let newBankAccount = form;
      const request = await http.post(
        "bankaccount/register-account",
        newBankAccount
      );
      if (request.data.status === "success") {
        alerts(
          "Registro exitoso",
          "Cuenta registrada registrado correctamente",
          "success"
        );
        //document.querySelector("#user-form").reset();
      } else {
        //setSaved('error');
        alerts(
          "Error",
          "Cuenta no registrada correctamente. Verificar que no haya campos vacíos o que la cuenta no esté repetida.",
          "error"
        );
      }
    } catch (error) {
      alerts("Error", "Error fetching cuenta.", "error");
      console.error("Error fetching cuenta:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <div className="container-fluid">
        <form onSubmit={savedBankAccount} id="user-form">
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
              <label htmlFor="accountNumber" className="form-label">
                Número de cuenta
              </label>
              <input
                required
                type="text"
                className="form-control"
                id="accountNumber"
                name="accountNumber"
                onChange={changed}
              />
            </div>

            <div className="mb-3 col-3">
              <label htmlFor="account_type_id" className="form-label">
                Tipo de cuenta
              </label>
              <select
                className="form-select"
                id="account_type_id"
                name="account_type_id"
                onChange={changed}
                defaultValue={option}
              >
                <option disabled>{option}</option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.typeName}
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
                defaultValue={option}
              >
                <option disabled>{option}</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.bankName}
                  </option>
                ))}
              </select>
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
              <button type="submit" className="btn btn-success mt-2 fw-bold">
                {isLoading ? (
                  <div className="spinner-border text-light" role="status">
                    <span className="visually-hidden">Registrando...</span>
                  </div>
                ) : (
                  "Registrar Cuenta"
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

export default CreateBankAccount;
