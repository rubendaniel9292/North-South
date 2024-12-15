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

const Login = () => {
  const { form, changed } = UserForm({});
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [turnstileToken, setTurnstileToken] = useState("");

  const siteKey = import.meta.env.VITE_REACT_APP_TURNSTILE_SITE_KEY;
  //console.log('calve secreta: ', siteKey);



  const loginUser = async (e) => {
    e.preventDefault();

    if (!turnstileToken) {
      alerts("Error", "Por favor completa el captcha", "error");
      return;
    }
    console.log("Rendering Turnstile component...");

    try {
      const request = await http.post("auth/login", {
        ...form,
        turnstileToken, // Enviar el token del captcha al backend
      });

      if (request.data.accessToken) {
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
        alerts("Error", "Usuario o contraseña incorrecta", "error");
      }
    } catch (error) {
      console.error(
        "Error completo:",
        error.response || error.request || error
      );
      alerts("Error", `Error de conexión: ${error.message}`, "error");
    }
  };

  return (
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
            <div id="turnstile-container" className="my-3" >
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
  );
};

export default Login;
