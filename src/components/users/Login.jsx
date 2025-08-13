import Turnstile from "react-turnstile";
import img from "../../assets/img/img-01.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faUser } from "@fortawesome/free-solid-svg-icons";
import "@fontsource/roboto/900.css";
import "@fontsource/nunito/700.css";
import UserForm from "../../hooks/UserForm";
import alerts from "../../helpers/Alerts";
import Swal from "sweetalert2";
import http from "../../helpers/Http";
import useAuth from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ChangePassword from "../../helpers/modal/ChangePassword";
const Login = () => {
  const { form, changed } = UserForm({});
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [turnstileToken, setTurnstileToken] = useState("");
  //estados para el cambio de conrtaseña
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changePasswordUserId, setChangePasswordUserId] = useState(null);
  const [isReloading, setIsReloading] = useState(false);
  const siteKey = import.meta.env.VITE_REACT_APP_TURNSTILE_SITE_KEY;
  //console.log('calve secreta: ', siteKey);

  const loginUser = async (e) => {
    e.preventDefault();

    if (!turnstileToken) {
      alerts("Error", "Por favor completa el captcha", "error");
      return;
    }

    console.log("=== INICIO LOGIN FRONTEND ===");
    console.log("Datos a enviar:", {
      username: form.username || form.email,
      hasPassword: !!form.password,
      hasTurnstileToken: !!turnstileToken,
    });

    try {
      const request = await http.post("auth/login", {
        ...form,
        turnstileToken, // Enviar el token del captcha al backend
      });

      console.log("✅ Respuesta del backend:", request.data.status);

      // 1. MANEJAR CAMBIO DE CONTRASEÑA OBLIGATORIO
      if (
        request.data.status === "must_change_password" ||
        request.data.mustChangePassword
      ) {
        console.log("⚠️ Usuario debe cambiar contraseña");
        // ✅ LIMPIAR tokens antes de mostrar cambio de contraseña
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setChangePasswordUserId(request.data.userId);
        setShowChangePassword(true);
        alerts(
          "Cambio de contraseña requerido",
          request.data.message ||
            "Debes cambiar tu contraseña antes de continuar",
          "warning"
        );
        return;
      }

      // 2. MANEJAR LOGIN EXITOSO
      if (request.data.status === "success" && request.data.accessToken) {
        console.log("✅ Login exitoso, guardando datos");
        localStorage.setItem("token", request.data.accessToken);
        localStorage.setItem("user", JSON.stringify(request.data.user));

        alerts(
          "Login exitoso",
          `Bienvenido/a ${request.data.user.firstName} ${request.data.user.surname}`,
          "success"
        );

        setTimeout(() => {
          setAuth(request.data.user);
          Swal.close();
          navigate("/management");
        }, 500);
      } else {
        // 3. RESPUESTA INESPERADA DEL BACKEND
        console.error("❌ Respuesta inesperada:", request.data);
        alerts("Error", "Respuesta inesperada del servidor", "error");
      }
    } catch (error) {
      console.error(
        "❌ Error durante login:",
        error.response || error.request || error
      );

      // 4. MANEJO DETALLADO DE ERRORES
      if (error.response?.status === 400) {
        // BadRequestException - Problemas con Turnstile o datos
        const message =
          error.response.data.message || "Error en la validación de datos";
        alerts("Error de validación", message, "error");
      } else if (error.response?.status === 401) {
        // UnauthorizedException - Credenciales incorrectas
        const message =
          error.response.data.message || "Usuario o contraseña incorrectos";
        alerts("Credenciales incorrectas", message, "error");
      } else if (error.response?.data?.message) {
        // Otros errores del backend
        alerts("Error", error.response.data.message, "error");
      } else if (error.code === "NETWORK_ERROR" || !error.response) {
        // Errores de red/conexión
        alerts(
          "Error de conexión",
          "No se pudo conectar con el servidor. Verifica tu conexión.",
          "error"
        );
      } else {
        // Error genérico
        alerts("Error", `Error inesperado: ${error.message}`, "error");
      }
    }
  };
  const handlePasswordChanged = () => {
    setShowChangePassword(false);
    setChangePasswordUserId(null);

    // ✅ Alert de éxito
    alerts(
      "¡Contraseña actualizada!",
      "Tu contraseña ha sido cambiada exitosamente.",
      "success"
    );

    // ✅ Activar estado de recarga
    setTimeout(() => {
      setIsReloading(true);

      // ✅ Mostrar mensaje de transición
      alerts(
        "Preparando login...",
        "Redirigiendo para que inicies sesión con tu nueva contraseña",
        "info",
        {
          timer: 2000,
          timerProgressBar: true,
          allowOutsideClick: false,
          showConfirmButton: false,
        }
      );
    }, 2000);

    // ✅ Limpiar y recargar
    setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setTurnstileToken("");
      window.location.reload();
    }, 3000);
  };

  return (
    <>
      {isReloading && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            background: "rgba(0,0,0,0.8)",
            zIndex: 9999,
          }}
        >
          <div className="text-center text-white">
            <div className="spinner-border text-success mb-3" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <h5>Preparando login con nueva contraseña...</h5>
          </div>
        </div>
      )}

      <div className="limiter">
        <div className="container-login100">
          <div className="wrap-login100">
            <div className="login100-pic js-tilt" data-tilt>
              <img src={img} alt="IMG" className="img-rotate"></img>
            </div>

            <form className="login100-form validate-form" onSubmit={loginUser}>
              <h1 className="d-block pb-5 text-center h1 lh-1">Bienvenidos</h1>

              <div
                className="wrap-input100 validate-input my-3"
                data-validate="El usuario o email es requerido"
              >
                <input
                  required
                  className="input100 d-block rounded-pill w-100 bg-secondary-subtle fs-5"
                  type="text"
                  name="username"
                  placeholder="User / Email"
                  onChange={changed}
                />
                <span className="focus-input100"></span>
                <span className="symbol-input100">
                  <i>
                    <FontAwesomeIcon icon={faUser} aria-hidden="true" />
                  </i>
                </span>
              </div>

              <div
                className="wrap-input100 validate-input my-3"
                data-validate="Password es requerida"
              >
                <input
                  required
                  className="input100 d-block rounded-pill w-100 bg-secondary-subtle fs-5"
                  type="password"
                  name="password"
                  placeholder="Password"
                  onChange={changed}
                />
                <span className="focus-input100"></span>
                <span className="symbol-input100">
                  <i>
                    <FontAwesomeIcon icon={faLock} aria-hidden="true" />
                  </i>
                </span>
              </div>
              <div id="turnstile-container" className="my-3">
                <Turnstile
                  sitekey={siteKey}
                  onVerify={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken("")}
                  debug={true}
                />
              </div>

              <div className="container-login100-form-btn">
                <button className="login100-form-btn w-100 d-block rounded-pill w-100 text-white fw-bold fs-5">
                  Iniciar sesión
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {showChangePassword && (
        <ChangePassword
          userId={changePasswordUserId}
          onSuccess={handlePasswordChanged}
        />
      )}
    </>
  );
};

export default Login;
