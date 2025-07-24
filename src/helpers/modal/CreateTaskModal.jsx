import UserForm from "../../hooks/UserForm";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import PropTypes from "prop-types";
import { useEffect, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk, faTimes } from "@fortawesome/free-solid-svg-icons";
const CreateTaskModal = ({ onClose, userId, onTaskCreated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { form, changed } = UserForm({
    users_uuid: userId || "",
    description: "",
    statusTask: 1, // Valor por defecto, no visible en el formulario
  });

  // CON useCallback (se reutiliza si las dependencias no cambian)
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      setIsLoading(true);

      try {
        const taskData = {
          users_uuid: form.users_uuid,
          description: form.description.trim(),
          statusTask: 1, // Siempre 1 por defecto
        };

        const response = await http.post(`/users/${userId}/tasks`, taskData);

        if (response.data.status === "success") {
          alerts(
            "Registro exitoso",
            "Tarea creada exitosamente",
            "success"
          );
          document.querySelector("#user-form").reset();
          onTaskCreated && onTaskCreated(response.data.newTask);

          onClose();
        } else {
          alerts("Error al crear la tarea");
        }
      } catch (error) {
        console.error("Error creating task:", error);
        alerts(error.response?.data?.message || "Error al crear la tarea");
      } finally {
        setIsLoading(false);
      }
    },
    [form, userId, onTaskCreated, onClose]
  );

  const handleClose = () => {
    onClose();
  };
  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <FontAwesomeIcon icon={faFloppyDisk} className="me-2" />
                Nueva Tarea
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleClose}
                disabled={isLoading}
                aria-label="Cerrar"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form id="user-form" onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">
                    Descripción de la Tarea{" "}
                    <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={changed}
                    placeholder="Describe la tarea que deseas crear..."
                    rows="4"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading || !form.description.trim()}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Creando...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faFloppyDisk} className="me-2" />
                      Crear Tarea
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
CreateTaskModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  userId: PropTypes.string.isRequired,
  onTaskCreated: PropTypes.func,
};

export default CreateTaskModal;
