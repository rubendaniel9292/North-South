import { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faEye,
  faEyeSlash,
  faShieldHalved,
  faCheck,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import http from "../../helpers/Http";
import alerts from "../../helpers/Alerts";
export default function ChangePassword({
  userId,
  onSuccess,
  onClose,
  error: propError,
  loading: propLoading = false,
}) {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [loading, setLoading] = useState(propLoading);
  const [error, setError] = useState(propError || "");

  // Validaciones individuales para feedback en vivo
  const hasMinLength = newPassword.length >= 8;
  const hasLetters = /[a-zA-Z]/.test(newPassword);
  const hasNumbers = /\d/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch =
    newPassword === repeatPassword && newPassword.length > 0;

  const isFormValid =
    hasMinLength &&
    hasLetters &&
    hasNumbers &&
    hasSpecialChar &&
    passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!isFormValid) return;
    setLoading(true);
    try {
      // Aquí SÍ usas userId y llamas a tu backend real:
      const request = await http.post("/auth/change-password", {
        userId,
        newPassword,
      });
      if (request.data.status === "success") {
        alerts(
          "Registro exitoso",
          "Contraseña cambiada correctamente. Ahora puedes iniciar sesión.",
          "success"
        );
        // Llamar onSuccess antes de navegar
        if (onSuccess) onSuccess();
        setTimeout(() => {
          navigate("/login"); // o tu ruta de login
        }, 1500);
      } else {
        const errorMessage =
          request.data.message || "No se pudo cambiar la contraseña";
        alerts("Error", errorMessage, "error");
      }

      
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Error al cambiar la contraseña"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      style={{
        backgroundColor: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        role="document"
        style={{ maxWidth: 420 }}
      >
        <div className="modal-content shadow border-0">
          <div className="modal-header flex-column align-items-center border-0 pb-0 py-3">
            <div
              className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center mb-2"
              style={{ width: 52, height: 52 }}
            >
              <FontAwesomeIcon
                icon={faShieldHalved}
                className="text-primary"
                size="lg"
              />
            </div>
            <h5 className="h4 modal-title w-100 text-center fw-bold mb-0">
              Cambio de Contraseña
            </h5>
            <div className="w-100 text-center text-secondary small mb-2">
              <p className="h5">
                Ingresa tu nueva contraseña para mayor seguridad
              </p>
            </div>
          </div>
          <div className="modal-body pt-0">
            {error && (
              <div className="alert alert-danger d-flex align-items-center py-2 small">
                <FontAwesomeIcon icon={faTimes} className="me-2" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="mt-2">
              {/* Nueva contraseña */}
              <div className="mb-3">
                <label htmlFor="newPassword" className="form-label fw-medium">
                  Nueva contraseña
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <FontAwesomeIcon icon={faLock} />
                  </span>
                  <input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    className="form-control"
                    placeholder="Ingresa tu nueva contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    tabIndex={-1}
                    onClick={() => setShowNewPassword((v) => !v)}
                    style={{ borderLeft: 0 }}
                    aria-label="Mostrar/ocultar contraseña"
                  >
                    <FontAwesomeIcon
                      icon={showNewPassword ? faEyeSlash : faEye}
                    />
                  </button>
                </div>
              </div>
              {/* Confirmar contraseña */}
              <div className="mb-3">
                <label
                  htmlFor="repeatPassword"
                  className="form-label fw-medium"
                >
                  Confirmar contraseña
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <FontAwesomeIcon icon={faLock} />
                  </span>
                  <input
                    id="repeatPassword"
                    type={showRepeatPassword ? "text" : "password"}
                    className="form-control"
                    placeholder="Repite tu nueva contraseña"
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    tabIndex={-1}
                    onClick={() => setShowRepeatPassword((v) => !v)}
                    style={{ borderLeft: 0 }}
                    aria-label="Mostrar/ocultar contraseña"
                  >
                    <FontAwesomeIcon
                      icon={showRepeatPassword ? faEyeSlash : faEye}
                    />
                  </button>
                </div>
              </div>

              {/* Requisitos de contraseña */}
              <div className="mb-3">
                <div className="fw-medium mb-1 small">
                  Requisitos de contraseña:
                </div>
                <ul className="list-unstyled mb-0 small">
                  <li className="d-flex align-items-center mb-1">
                    <FontAwesomeIcon
                      icon={hasMinLength ? faCheck : faTimes}
                      className={
                        hasMinLength
                          ? "text-success me-2"
                          : "text-secondary me-2"
                      }
                    />
                    Mínimo 8 caracteres
                  </li>
                  <li className="d-flex align-items-center mb-1">
                    <FontAwesomeIcon
                      icon={hasLetters ? faCheck : faTimes}
                      className={
                        hasLetters ? "text-success me-2" : "text-secondary me-2"
                      }
                    />
                    Incluir letras
                  </li>
                  <li className="d-flex align-items-center mb-1">
                    <FontAwesomeIcon
                      icon={hasNumbers ? faCheck : faTimes}
                      className={
                        hasNumbers ? "text-success me-2" : "text-secondary me-2"
                      }
                    />
                    Incluir números
                  </li>
                  <li className="d-flex align-items-center mb-1">
                    <FontAwesomeIcon
                      icon={hasSpecialChar ? faCheck : faTimes}
                      className={
                        hasSpecialChar
                          ? "text-success me-2"
                          : "text-secondary me-2"
                      }
                    />
                    Incluir carácter especial
                  </li>
                  {repeatPassword && (
                    <li className="d-flex align-items-center mb-1">
                      <FontAwesomeIcon
                        icon={passwordsMatch ? faCheck : faTimes}
                        className={
                          passwordsMatch
                            ? "text-success me-2"
                            : "text-danger me-2"
                        }
                      />
                      <span
                        className={
                          passwordsMatch ? "text-success" : "text-danger"
                        }
                      >
                        Las contraseñas coinciden
                      </span>
                    </li>
                  )}
                </ul>
              </div>
              {/* Botones */}
              <div className="d-flex gap-2 pt-2">
                {onClose && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary flex-fill"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn-primary flex-fill"
                  disabled={!isFormValid || loading}
                >
                  {loading ? "Cambiando..." : "Cambiar contraseña"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

ChangePassword.propTypes = {
  userId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
  onClose: PropTypes.func,
  error: PropTypes.string,
  loading: PropTypes.bool,
};
