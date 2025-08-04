import UserForm from "../../hooks/UserForm";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { useEffect, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";

const CreateBankAccount = () => {
  const { form, changed } = UserForm({});
  const [customers, setCustomer] = useState([]);
  const [banks, setBanks] = useState([]);
  const [types, setTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
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

      console.log("Bancos:", banksData);
      console.log("Tipos de cuentas:", typesData);

      setCustomer(customersData);
      setBanks(banksData);
      setTypes(typesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      alerts("Error", "Error al cargar los datos.", "error");
    }
  }, []); // ✅ Sin dependencias - solo se ejecuta una vez

  // ✅ useEffect solo llama a la función
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const option = "Escoja una opción";
  const savedBankAccount = useCallback(
    async (e) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        let newBankAccount = form;
        const request = await http.post(
          "bankaccount/register-account",
          newBankAccount
        );

        if (request.data.status === "success") {
          alerts(
            "Registro exitoso",
            "Cuenta registrada correctamente",
            "success"
          );
          document.querySelector("#user-form").reset();
        } else {
          alerts(
            "Error",
            "Cuenta no registrada correctamente. Verificar que no haya campos vacíos o que la cuenta no esté repetida.",
            "error"
          );
        }
      } catch (error) {
        alerts("Error", "Error al registrar la cuenta.", "error");
        console.error("Error fetching cuenta:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [form]
  ); // ✅ Dependencia: solo se recrea cuando cambia el form
  return (
    <>
      <div className="container-fluid">
        <form
          onSubmit={savedBankAccount}
          id="user-form"
          className="needs-validation was-validated"
        >
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
                <option disabled value={""} selected>
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
                required
              >
                <option disabled value={""} selected>
                  {option}
                </option>
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
                required
              >
                <option disabled value={""} selected>
                  {option}
                </option>
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
              <div className="valid-feedback">
                Campo opcional: ingrese cualquier inforación adicional.
              </div>
            </div>

            <div className="mt-4 col-3">
              <button type="submit" className="btn btn-success mt-2 fw-bold">
                {isLoading ? (
                  <>
                    <div className="spinner-border text-light" role="status">
                      <span className="visually-hidden">Registrando...</span>
                    </div>
                    Registrando...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon
                      className="mx-2"
                      icon={faFloppyDisk}
                      beat
                    />
                    Registrar Cuenta
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateBankAccount;
