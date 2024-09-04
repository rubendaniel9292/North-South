import UserFrom from "../../hooks/UserFrom";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { useState } from "react";
const CreateBank = () => {
  const { form, changed } = UserFrom({});
  const [setBanks] = useState([]);
  const savedBank = async (e) => {
    e.preventDefault();
    let newBank = form;
    try {
      const response = await http.post("creditcar/register-bank");
      if (response.data.status === "success") {
        alerts(
          "Banco añadido",
          "El banco se ha añadido correctamente",
          "success"
        );
        setBanks(newBank); // Actualiza la lista de bancos con el nuevo banco
        //setShowNewBankForm(false); // Oculta el formulario después de añadir el banco
      } else {
        alerts("Error", "No se pudo añadir el banco", "error");
      }
    } catch (error) {
      console.error("Error adding new bank:", error);
      alerts("Error", "Hubo un problema al añadir el banco", "error");
    }
  };

  return (
    <>
      <div className="container-fluid">
        <h2>Registro de bancos</h2>
        <form onSubmit={savedBank} id="user-form">
          <div className="row pt-3">
            <div className="mb-3 col-3">
              <label htmlFor="cardNumber" className="form-label">
                Nombre del banco
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
              <button type="submit" className="btn btn-success">
                Registrar Banco
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};
export default CreateBank;