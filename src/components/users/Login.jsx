import img from "../../assets/img/img-01.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faUser } from "@fortawesome/free-solid-svg-icons";
import "@fontsource/roboto/900.css";
import "@fontsource/nunito/700.css";
import UserForm from "../../hooks/UserForm";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import useAuth from "../../hooks/useAuth";

const Login = () => {
  const { form, changed } = UserForm({});
  const { setAuth } = useAuth();
  const loginUser = async (e) => {
    try {
      //prevenir atualziacion de pantalla
      e.preventDefault();
      //regoger datos del formulario
      let userToLogin = form;
      /*  peticion mediante fecth
    console.log("Sending request to:", Global.url + 'auth/login');
    peticion a la api 
    const request = await fetch(Global.url + 'auth/login', {
      method: 'POST',
      body: JSON.stringify(userToLogin),//convertir a JSON string
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await request.json();*/
      const request = await http.post("auth/login", userToLogin);
      //console.log(request.data);
      //console.log(request);
      //console.log("Request status:", request.data.status);

      //persistir los datos en el navegador
      if (request.data.accessToken) {
        localStorage.setItem("token", request.data.accessToken);
        localStorage.setItem("user", JSON.stringify(request.data.user));
        //setLoged('login');
        //redireccion
        alerts(
          "Login exitoso",
          `Bienvenido/a ${request.data.user.firstName} ${request.data.user.surname}`,
          "success"
        );
        setTimeout(() => {
          //setear datos en el para que redireciones y no entrar manualamente a /social
          setAuth(request.data.user);
          window.location.reload(); //realiza el navigate a public o private layout de manera automatica
        }, 500);
      } else {
        //setLoged('error')
        alerts("Error", "Usuario o contraseña incorrecta", "error");
      }
    } catch (error) {
      //setError(error);
      alerts("Error", "No se permiten campos vacios", "error");
      console.error("Error fetching users:", error);
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
              <h1 className="d-block pb-5 w-100 text-center h1 lh-1">
                Bienvenidos
              </h1>

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

              {/*
              <div className="text-center p-t-12">
                <span className="txt1">
                  Forgot
                </span>
                <a className="txt2" href="#">
                  Username / Password?
                </a>
              </div>
               

              <div className="text-center p-t-136">
                <a className="txt2" href="#">
                  Crear tu cuenta
                  <i className="fa fa-long-arrow-right m-l-5" aria-hidden="true"></i>
                </a>
              </div>
              */}
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
