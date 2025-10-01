import UserForm from "../../hooks/UserForm";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk, faUniversity } from "@fortawesome/free-solid-svg-icons";
import { useCallback } from "react";

const CreateBank = () => {
  const { form, changed } = UserForm({});

  const savedBank = useCallback(
    async (e) => {
      e.preventDefault();
      let newBank = form;
      try {
        const response = await http.post("creditcard/register-bank", newBank);

        if (response.data.status === "success") {
          alerts(
            "Banco añadido",
            "El banco se ha añadido correctamente",
            "success"
          );
          document.querySelector("#user-form").reset();
        } else {
          alerts("Error", "No se pudo añadir el banco", "error");
        }
      } catch (error) {
        console.error("Error adding new bank:", error);
        alerts("Error", "Hubo un problema al añadir el banco", "error");
      }
    },
    [form]
  ); // ✅ Dependencia: solo se recrea cuando cambia el form

  return (
    <>
      <div className="container-fluid">
        <h2>Registro de bancos o cooperativas</h2>
        <form
          onSubmit={savedBank}
          id="user-form"
          className="needs-validation was-validated"
        >
          <div className="row pt-3">
            <div className="mb-3 col-3">
              <label htmlFor="cardNumber" className="form-label">
                <FontAwesomeIcon icon={faUniversity} className="me-2" />
                Nombre del banco o cooperativa
              </label>
              <input
                required
                type="text"
                className="form-control"
                id="bankName"
                name="bankName"
                onChange={changed}
              />
            </div>

            <div className="mt-4 col-3">
              <button type="submit" className="btn btn-success mt-2 fw-bold">
                Registrar Banco
                <FontAwesomeIcon className="mx-2" icon={faFloppyDisk} beat />
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};
export default CreateBank;
