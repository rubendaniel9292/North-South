import UserForm from "../../hooks/UserForm";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
const CreateAdvisor = () => {
  const { form, changed } = UserForm({});
  const [isLoading, setIsLoading] = useState(false);
  const savedAdvisor = useCallback(
    async (e) => {
      try {
        e.preventDefault();
        let newAdvisor = form;
        const request = await http.post("advisor/register-advisor", newAdvisor);

        if (request.data.status === "success") {
          alerts(
            "Registro exitoso",
            "Asesor registrado correctamente", // ✅ Corregir texto duplicado
            "success"
          );
          document.querySelector("#user-form").reset();
        } else {
          alerts(
            "Error",
            "Asesor no registrado correctamente. Verificar que no haya campos vacíos o cédulas o correos duplicados", // ✅ Corregir "vacios"
            "error"
          );
        }
      } catch (error) {
        alerts("Error", "Error al registrar el asesor.", "error"); // ✅ Mejorar mensaje de error
        console.error("Error fetching asesor:", error);
      }
    },
    [form]
  ); // ✅ Dependencia: solo se recrea cuando cambia el form
  return (
    <div className="container-fluid">
      <h2>Registro de Asesores</h2>
      <form
        onSubmit={savedAdvisor}
        id="user-form"
        className="needs-validation was-validated"
      >
        <div className="row pt-3 fw-bold">
          <div className="mb-3 col-3">
            <label htmlFor="ci_ruc" className="form-label">
              Número de cédula / RUC
            </label>
            <input
              required
              type="text"
              className="form-control"
              id="ciruc"
              name="ci_ruc"
              onChange={changed}
            />
          </div>
          <div className="mb-3 col-3">
            <label htmlFor="firstName" className="form-label">
              Primer Nombre
            </label>
            <input
              required
              type="text"
              className="form-control"
              id="name"
              name="firstName"
              onChange={changed}
            />
          </div>
          <div className="mb-3 col-3">
            <label htmlFor="secondName" className="form-label">
              Segundo Nombre
            </label>
            <input
              type="text"
              className="form-control"
              id="secondname"
              name="secondName"
              onChange={changed}
            />
          </div>
          <div className="mb-3 col-3">
            <label htmlFor="surname" className="form-label">
              Primer Apellido
            </label>
            <input
              required
              type="text"
              className="form-control"
              id="surname"
              name="surname"
              onChange={changed}
            />
          </div>

          <div className="mb-3 col-3">
            <label htmlFor="secondSurname" className="form-label">
              Segundo Apellido
            </label>
            <input
              type="text"
              className="form-control"
              id="secondSurname"
              name="secondSurname"
              onChange={changed}
            />
          </div>

          <div className="mb-3 col-3">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              required
              type="email"
              className="form-control"
              id="email"
              name="email"
              onChange={changed}
            />
          </div>
          <div className="mb-3 col-3">
            <label htmlFor="numberPhon" className="form-label">
              Teléfono
            </label>
            <input
              required
              type="text"
              className="form-control"
              id="numberPhone"
              name="numberPhone"
              onChange={changed}
            />
          </div>

          <div className="mb-3 col-3">
            <label htmlFor="birthdate" className="form-label">
              Fecha de nacimiento
            </label>
            <input
              required
              type="date"
              className="form-control"
              id="birthdate"
              name="birthdate"
              onChange={changed}
            />
          </div>

          <div className="mb-3 col-3 ">
            <label htmlFor="flexRadioDefault7" className="form-check-label">
              ¿El asesor acepta el tratamiento de datos personales?
            </label>
            <div className="form-check">
              <input
                required
                className="form-check-input"
                type="radio"
                name="personalData"
                id="flexRadioDefault7"
                value="true"
                onChange={changed}
              ></input>
              <label className="form-check-label" htmlFor="flexRadioDefault7">
                Sí
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="personalData"
                id="flexRadioDefault8"
                value="false"
                onChange={changed}
              ></input>
              <label className="form-check-label" htmlFor="flexRadioDefault8">
                No
              </label>
            </div>
          </div>
          <div className="mt-4 col-3">
            |
            <button type="submit" className="btn btn-success fw-bold">
              {isLoading ? (
                <>
                  <div className="spinner-border text-light" role="status">
                    <span className="visually-hidden">Registrando...</span>
                  </div>
                  Registrando...
                </>
              ) : (
                <>
                  Registrar Asesor
                  <FontAwesomeIcon className="mx-2 " icon={faFloppyDisk} beat />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
export default CreateAdvisor;
