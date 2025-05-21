import UserForm from "../../hooks/UserForm";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

const CreateComapnies = () => {
  const { form, changed } = UserForm({});
  const [isLoading, setIsLoading] = useState(false);
  const savedCompanies = async (e) => {
    setIsLoading(true);
    e.preventDefault();
    let newCompany = form;
    try {
      const response = await http.post("company/register-company", newCompany);

      if (response.data.status === "success") {
        alerts(
          "Compañía añadida",
          "La compañía se ha añadido correctamente",
          "success"
        );
        //document.querySelector("#user-form").reset();
      } else {
        alerts("Error", "No se pudo añadir la compañía", "error");
      }
    } catch (error) {
      console.error("Error adding new bank:", error);
      alerts("Error", "Hubo un problema al añadir la compañía", "error");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <div className="container-fluid">
        <h2>Registro de compañias</h2>
        <form onSubmit={savedCompanies} id="user-form" className="needs-validation was-validated">
          <div className="row pt-3 fw-bold">
            <div className="mb-3 col-3">
              <label htmlFor="cardNumber" className="form-label">
                RUC de la compañía
              </label>
              <input
                required
                type="text"
                className="form-control"
                id="ci_ruc"
                name="ci_ruc"
                onChange={changed}
              />
            </div>
            <div className="mb-3 col-3">
              <label htmlFor="cardNumber" className="form-label">
                Nombre de la compañía
              </label>
              <input
                required
                type="text"
                className="form-control"
                id="companyName"
                name="companyName"
                onChange={changed}
              />
            </div>

            <div className="mt-4 col-3">
              <button type="submit" className="btn btn-success mt-2">
              {isLoading ? (
                <div className="spinner-border text-light" role="status">
                  <span className="visually-hidden">Registrando...</span>
                </div>
              ) : (
                "Registrar Póliza"
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

export default CreateComapnies;
