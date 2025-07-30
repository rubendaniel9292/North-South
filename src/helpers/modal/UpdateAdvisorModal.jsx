import PropTypes from "prop-types";
import UserForm from "../../hooks/UserForm";
import { useEffect, useState, useCallback } from "react"; // ✅ Agregar useCallback
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "dayjs";
import "dayjs/locale/es";

const UpdateAdvisorModal = ({ advisorId, onClose, onAdvisorUpdated }) => {
  const { form, changed, setForm } = UserForm({
    ci_ruc: advisorId.ci_ruc,
    firstName: advisorId.firstName,
    secondName: advisorId.secondName,
    surname: advisorId.surname,
    secondSurname: advisorId.secondSurname,
    email: advisorId.email,
    numberPhone: advisorId.numberPhone,
    birthdate: advisorId.birthdate,
    personalData:
      advisorId.personalData === true || advisorId.personalData === "true",
  });

  const [isLoading, setIsLoading] = useState(false);

  if (!advisorId) return null;

  // ✅ useEffect optimizado para actualizar el formulario
  useEffect(() => {
    if (advisorId) {
      setForm((prev) => ({
        ...prev,
        // Ya se setean en el UserForm inicial, no necesita cambios
      }));
    }
  }, [advisorId, setForm]);

  // ✅ Convertir savedAdvisor a useCallback
  const savedAdvisor = useCallback(async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let newAdvisor = { ...form };
      const request = await http.put(
        `advisor/update-advisor-id/${advisorId.id}`,
        newAdvisor
      );
      
      if (request.data.status === "success") {
        alerts(
          "Actualización exitosa", // ✅ Corregir "Actualizacion"
          "Asesor actualizado correctamente",
          "success"
        );
        document.querySelector("#user-form").reset();
        // Llamar a la función de callback para propagar el cambio
        onAdvisorUpdated(request.data.advisorUpdate);
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        alerts(
          "Error",
          "Asesor no actualizado correctamente. Verificar que no haya campos vacíos o duplicados", // ✅ Corregir "vacios"
          "error"
        );
      }
    } catch (error) {
      alerts("Error", "Error al actualizar el asesor.", "error"); // ✅ Mejorar mensaje
      console.error("Error updating advisor:", error);
    } finally {
      setIsLoading(false);
    }
  }, [form, advisorId.id, onAdvisorUpdated, onClose]);

  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto">
        <article className="modal-content text-center px-5 py-5">
          <div className="d-flex justify-content-center align-items-center conten-title rounded mb-3">
            <h3 className="text-white fw-bold">
              Asesor seleccionado: {advisorId.firstName} {advisorId.surname}
            </h3>
          </div>

          <div className="justify-content-around mt-1">
            <form 
              onSubmit={savedAdvisor} 
              id="user-form" 
              className="needs-validation was-validated"
            >
              <div className="row pt-3 fw-bold">
                <div className="my-1 col-3">
                  <label htmlFor="ci_ruc" className="form-label">
                    Número de cédula / RUC
                  </label>
                  <input
                    required
                    type="text"
                    className="form-control"
                    id="ci_ruc" // ✅ Corregir ID inconsistente
                    name="ci_ruc"
                    onChange={changed}
                    value={form.ci_ruc || ""} // ✅ Agregar fallback
                  />
                </div>

                <div className="my-1 col-3">
                  <label htmlFor="firstName" className="form-label"> {/* ✅ Corregir htmlFor */}
                    Primer Nombre
                  </label>
                  <input
                    required
                    type="text"
                    className="form-control"
                    id="firstName" // ✅ Corregir ID inconsistente
                    name="firstName"
                    onChange={changed}
                    value={form.firstName || ""} // ✅ Agregar fallback
                  />
                </div>

                <div className="my-1 col-3">
                  <label htmlFor="secondName" className="form-label">
                    Segundo Nombre
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="secondName" // ✅ Corregir ID inconsistente
                    name="secondName"
                    onChange={changed}
                    value={form.secondName || ""} // ✅ Agregar fallback
                  />
                </div>

                <div className="my-1 col-3">
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
                    value={form.surname || ""} // ✅ Agregar fallback
                  />
                </div>

                <div className="my-1 col-3">
                  <label htmlFor="secondSurname" className="form-label">
                    Segundo Apellido
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="secondSurname" // ✅ Corregir ID inconsistente
                    name="secondSurname"
                    onChange={changed}
                    value={form.secondSurname || ""} // ✅ Agregar fallback
                  />
                </div>

                <div className="mb-3 col-3">
                  <label htmlFor="birthdate" className="form-label"> {/* ✅ Corregir htmlFor */}
                    Fecha de nacimiento
                  </label>
                  <input
                    required
                    type="date"
                    className="form-control"
                    id="birthdate"
                    name="birthdate"
                    onChange={changed}
                    value={
                      form.birthdate
                        ? dayjs.utc(form.birthdate).format("YYYY-MM-DD")
                        : ""
                    }
                  />
                </div>

                <div className="my-1 col-3">
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
                    value={form.email || ""} // ✅ Agregar fallback
                  />
                </div>

                <div className="my-1 col-3">
                  <label htmlFor="numberPhone" className="form-label"> {/* ✅ Corregir htmlFor */}
                    Teléfono
                  </label>
                  <input
                    required
                    type="text"
                    className="form-control"
                    id="numberPhone" // ✅ Corregir ID inconsistente
                    name="numberPhone"
                    onChange={changed}
                    value={form.numberPhone || ""} // ✅ Simplificar fallback
                  />
                </div>

                <div className="my-1 col-3">
                  <label htmlFor="personalData" className="form-label"> {/* ✅ Corregir htmlFor */}
                    ¿El asesor acepta el tratamiento de datos personales? {/* ✅ Corregir typos */}
                  </label>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="personalData"
                      id="flexRadioSi"
                      value="true"
                      onChange={changed}
                      checked={form.personalData === true}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="flexRadioSi" // ✅ Corregir htmlFor
                    >
                      Sí {/* ✅ Agregar tilde */}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="personalData"
                      id="flexRadioNo"
                      value="false"
                      checked={form.personalData === false}
                      onChange={changed}
                    />
                    <label className="form-check-label" htmlFor="flexRadioNo">
                      No
                    </label>
                  </div>
                </div>

                <div className="d-flex justify-content-around mt-4">
                  <button
                    type="submit"
                    className="btn bg-success mx-5 text-white fw-bold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="spinner-border spinner-border-sm text-light me-2" role="status">
                          <span className="visually-hidden">Actualizando...</span>
                        </div>
                        Actualizando...
                      </>
                    ) : (
                      <>
                        Actualizar datos
                        <FontAwesomeIcon className="mx-2" beat icon={faFloppyDisk} />
                      </>
                    )}
                  </button>

                  <button
                    type="button" // ✅ Cambiar de "submit" a "button"
                    onClick={onClose}
                    className="btn bg-danger mx-5 text-white fw-bold"
                  >
                    Cerrar
                    <FontAwesomeIcon className="mx-2" beat icon={faRectangleXmark} />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </article>
      </div>
    </>
  );
};

UpdateAdvisorModal.propTypes = {
  advisorId: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ci_ruc: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    secondName: PropTypes.string,
    surname: PropTypes.string.isRequired,
    secondSurname: PropTypes.string,
    email: PropTypes.string.isRequired,
    birthdate: PropTypes.string.isRequired,
    numberPhone: PropTypes.string.isRequired,
    personalData: PropTypes.bool,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onAdvisorUpdated: PropTypes.func.isRequired,
};

export default UpdateAdvisorModal;