import PropTypes from "prop-types";
import { useState } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRectangleXmark,
  faTrashCan,
  faSpinner,
  faClipboardList,
  faCheckCircle
} from "@fortawesome/free-solid-svg-icons";
const TaskModal = ({ onClose, tasks, onTaskDeleted }) => {
  const [deletingTasks, setDeletingTasks] = useState(new Set());
  console.log("Tasks recibidas en TaskModal:", tasks);

  // ✅ Función para eliminar tarea
  const handleDeleteTask = async (taskId) => {
    try {
      setDeletingTasks((prev) => new Set(prev).add(taskId));

      const response = await http.delete(`users/delete-tasks/${taskId}`);

      if (response.data.status === "success") {
        // ✅ Refrescar recordatorio de tareas
        if (window.refreshTaskReminder) {
          window.refreshTaskReminder();
        }
        //  actualizar estado local INMEDIATAMENTE Llamando callback para actualizar el estado en Home
        if (onTaskDeleted) {
          onTaskDeleted(taskId);
        }
        alerts("Éxito", "Tarea eliminada correctamente", "success");

        //  Cerrar modal si no quedan tareas
        const remainingTasks = tasks.filter((task) => task.id !== taskId);
        if (remainingTasks.length === 0) {
          setTimeout(() => onClose(), 500); // Cerrar después de 1.5s
        }
      } else {
        alerts(
          "Error",
          response.data.message || "Error al eliminar la tarea",
          "error"
        );
      }
    } catch (error) {
      console.error("Error eliminando tarea:", error);
      alerts("Error", "No se pudo eliminar la tarea", "error");
    } finally {
      // ✅ Remover ID del loading state
      setDeletingTasks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  // ✅ Validación mejorada
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return (
      <>
        <div className="modal d-flex justify-content-center align-items-center mx-auto">
          <article className="modal-content text-center px-5 py-4">
            <div className="d-flex justify-content-center align-items-center conten-title mb-3 rounded">
              <h3 className="text-white">Detalle de Tareas Pendientes</h3>
            </div>
            <p>No hay tareas disponibles</p>
            <div>
              <button
                type="button"
                className="btn btn-danger"
                onClick={onClose}
              >
                <FontAwesomeIcon icon={faRectangleXmark} className="me-2" />
                Cancelar
              </button>
            </div>
          </article>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto">
        <article className="modal-content text-center px-5 py-4">
          <div className="d-flex justify-content-center align-items-center conten-title mb-3 rounded">
            <h3 className="text-white">Detalle de Tareas Pendientes</h3>
          </div>

          <table className="table table-striped">
            <thead>
              <tr>
                <th>N°</th>
                <th>
                  <FontAwesomeIcon icon={faClipboardList} className="me-2" />
                  Descripción
                </th>
                <th>
                  <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, idx) => (
                <tr key={task.id}>
                  <td>{idx + 1}</td> {/* ✅ Usar ID o numeración */}
                  <td>{task.description || "Sin descripción"}</td>
                  <td>
                    <span
                      className={`badge fs-6 ${task.statusTask === 1
                          ? "bg-warning text-dark"
                          : "bg-success"
                        }`}
                    >
                      {task.estatusTask || "Pendiente"}
                    </span>
                  </td>
                  <td>
                    {/* ✅ Botón de eliminar con icono apropiado */}
                    <button
                      type="button"
                      className="btn btn-danger btn-sm fw-bold"
                      onClick={() => handleDeleteTask(task.id)}
                      disabled={deletingTasks.has(task.id)}
                      title="Eliminar tarea"
                    >
                      {deletingTasks.has(task.id) ? (
                        <>
                          <FontAwesomeIcon
                            icon={faSpinner}
                            spin
                            className="me-1"
                          />
                          Eliminando...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faTrashCan} className="me-1" />
                          Eliminar Tarea
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="d-flex justify-content-center modal-footer">
            <button className="btn btn-danger" onClick={onClose}>
              <FontAwesomeIcon
                icon={faRectangleXmark}
                className="me-2"
                bounce
              ></FontAwesomeIcon>
              Cerrar
            </button>
          </div>
        </article>
      </div>
    </>
  );
};

// ✅ PropTypes corregidos
TaskModal.propTypes = {
  tasks: PropTypes.arrayOf(
    // ✅ Array de objetos
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      description: PropTypes.string,
      estatusTask: PropTypes.string,
    })
  ).isRequired,
  onTaskDeleted: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};

export default TaskModal;
