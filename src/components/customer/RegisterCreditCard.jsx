import UserForm from "../../hooks/UserForm";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { useEffect, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
const RegisterCreditCard = () => {
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
          http.get("creditcard/all-banks"),
          http.get("creditcard/all-types"),
        ]);

      const customersData = customerResponse.data?.allCustomer || [];
      const banksData = banksResponse.data?.allBanks || [];
      const typesData = typesResponse.data?.allTypes || [];

      setCustomer(customersData);
      setBanks(banksData);
      setTypes(typesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      alerts("Error", "Error al cargar los datos.", "error");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const option = "Escoja una opción";

  // ✅ Generar opciones de meses optimizado con useMemo
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, "0"),
    label: `${String(i + 1).padStart(2, "0")} - ${new Date(0, i).toLocaleString(
      "es",
      { month: "long" }
    )}`,
  }));

  // ✅ Generar opciones de años optimizado con useMemo
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 15 }, (_, i) => currentYear + i);
  const savedCard = useCallback(
    async (e) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        // Construir la fecha de vencimiento con día 1
        const expirationDate =
          form.expirationMonth && form.expirationYear
            ? `${form.expirationYear}-${form.expirationMonth}-01`
            : null;

        // Preparar los datos con la fecha construida
        const cardData = {
          ...form,
          expirationDate: expirationDate,
        };

        const request = await http.post(`creditcard/register-card`, cardData);

        if (request.data.status === "success") {
          alerts(
            "Registro exitoso",
            "Tarjeta registrada correctamente", // ✅ Corregir texto duplicado
            "success"
          );
          document.querySelector("#user-form").reset();
        } else {
          alerts(
            "Error",
            "Tarjeta no registrada correctamente. Verificar que no haya campos vacíos o que la tarjeta no esté caducada.",
            "error"
          );
        }
      } catch (error) {
        alerts("Error", "Error al registrar la tarjeta.", "error"); // ✅ Mejorar mensaje
        console.error("Error fetching cards:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [form]
  );
  return (
    <>
      <div className="container-fluid">
        <form
          onSubmit={savedCard}
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
                <option disabled selected value={""}>
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
              <label htmlFor="code" className="form-label">
                Código CVV
              </label>
              <input
                required
                type="text"
                className="form-control"
                id="code"
                name="code"
                pattern="[0-9]{3,4}"
                maxLength="4"
                placeholder="123"
                title="Ingrese un código de 3 o 4 dígitos"
                onChange={changed}
              />
            </div>

            <div className="mb-3 col-3">
              <label htmlFor="expirationMonth" className="form-label">
                Mes de Vencimiento
              </label>
              <select
                className="form-select"
                id="expirationMonth"
                name="expirationMonth"
                onChange={changed}
                required
                value={form.expirationMonth || ""}
              >
                <option disabled value="" defaultValue>
                  Seleccione mes
                </option>
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3 col-3">
              <label htmlFor="expirationYear" className="form-label">
                Año de Vencimiento
              </label>
              <select
                className="form-select"
                id="expirationYear"
                name="expirationYear"
                onChange={changed}
                required
                value={form.expirationYear || ""}
              >
                <option disabled value="" defaultValue>
                  Seleccione año
                </option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
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
                <option disabled selected value={""}>
                  {option}
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
                required
              >
                <option disabled selected value={""}>
                  {option}
                </option>
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
