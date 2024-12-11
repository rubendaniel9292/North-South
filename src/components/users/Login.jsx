import img from "../../assets/img/img-01.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faUser } from "@fortawesome/free-solid-svg-icons";
import "@fontsource/roboto/900.css";
import "@fontsource/nunito/700.css";
import UserForm from "../../hooks/UserForm";
import Swal from "sweetalert2";
import  alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import useAuth from "../../hooks/useAuth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { form, changed } = UserForm({});
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  // Cargar el script de reCAPTCHA v3

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=6LcDZoYqAAAAAHcLxKKgxw9D7mNN2ELipm3XFIDl`;
    script.async = true;
    document.body.appendChild(script);


    //cleanup para evitar posibles duplicados en el futuro
    /*React ejecutará primero la función de limpieza (si existe) antes de ejecutar el efecto nuevamente. 
    Esto asegura que solo haya una instancia del script en el DOM en un momento dado. */
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Obtener el token de reCAPTCHA antes de enviar el formulario

  const loginUser = async (e) => {
    //prevenir atualziacion de pantalla
    e.preventDefault();
    try {
      if (window.grecaptcha && typeof window.grecaptcha.ready === "function") {
        //console.log("grecaptcha:", window.grecaptcha);
        window.grecaptcha.ready(() => {
          window.grecaptcha
            .execute("6LcDZoYqAAAAAHcLxKKgxw9D7mNN2ELipm3XFIDl", {
              action: "login",
            })
            .then(async (token) => {
              //setCaptchaToken(token); // Guardar el token
              //console.log("Token generado:", token);

              // Continuar con el proceso de login solo después de obtener el token
              let userToLogin = { ...form, captchaToken: token }; // Incluir el token en la petición
              try {
                //regoger datos del formulario
                //let userToLogin = form;
                const request = await http.post("auth/login", userToLogin);

                //persistir los datos en el navegador
                if (request.data.accessToken) {
                  localStorage.setItem("token", request.data.accessToken);
                  localStorage.setItem(
                    "user",
                    JSON.stringify(request.data.user)
                  );
                  //setLoged('login');
                  //redireccion
                  alerts(
                    "Login exitoso",
                    `Bienvenido/a ${request.data.user.firstName} ${request.data.user.surname}`,
                    "success"
                  );
                  setTimeout(() => {
                    //setear datos en el para que redireciones y no entrar manualamente al dasboard
                    setAuth(request.data.user);
                    Swal.close();
                    navigate("/management");
                  }, 500);
                } else {
                  //setLoged('error')
                  alerts("Error", "Usuario o contraseña incorrecta", "error");
                }
              } catch (error) {
                // Cualquier otro error
                console.error(
                  "Error completo:",
                  error.response || error.request || error
                );
                alerts("Error", `Error de conexión: ${error.message}`, "error");
                console.error("Error fetching users:", error);
              }
            }).catch(error => {
              console.error("Error generando token:", error);
            });
        });
      } else {
        console.error("reCAPTCHA no está disponible.");
      }
    } catch (error) {
      // Cualquier otro error
      // Cualquier otro error
      console.error(
        "Error completo:",
        error.response || error.request || error
      );
      alerts(
        "Error",
        `Error de recapcha o de conexión: ${error.message}`,
        "error"
      );
    }
  };

  return (
    <>
      <div className="limiter ">
        <div className="container-login100">
          <div className="wrap-login100">
            <div className="login100-pic js-tilt" data-tilt>
              <img src={img} alt="IMG" className="img-rotate"></img>
            </div>

            <form className="login100-form validate-form" onSubmit={loginUser}>
              <h1 className="d-block pb-5  text-center h1 lh-1">Bienvenidos</h1>

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
                    {" "}
                    <FontAwesomeIcon icon={faLock} aria-hidden="true" />
                  </i>
                </span>
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
    </>
  );
};

export default Login;
