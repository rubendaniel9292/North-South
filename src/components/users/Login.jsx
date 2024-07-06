import img from '../../assets/img/img-01.png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faUser } from '@fortawesome/free-solid-svg-icons';
import UserFrom from '../../hooks/UserFrom';
import alerts from '../../helpers/Alerts';
import { Global } from '../../helpers/Global';
import useAuth from "../../hooks/useAuth";

const Login = () => {
  const { form, changed } = UserFrom({});
  const { setAuth } = useAuth();
  const loginUser = async (e) => {
    //prevenir atualziacion de pantalla
    e.preventDefault();
    //regoger datos del formulario
    let userToLogin = form;
    console.log("Sending request to:", Global.url + 'auth/login');
    //peticion a la api 
    const request = await fetch(Global.url + 'auth/login', {
      method: 'POST',
      body: JSON.stringify(userToLogin),//convertir a JSON string
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await request.json();
    console.log(data);
    console.log(request);
    console.log("Request status:", request.status);
    console.log("Request headers:", request.headers);
    //persistir los datos en el navegador 
    if (data.accessToken) {
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      //setLoged('login');
      //redireccion 
      alerts('Login exitoso', 'Bienvenido/a...', 'success');
      setTimeout(() => {
        //setear datos en el para que redireciones y no entrar manualamente a /social
        setAuth(data.user);
        window.location.reload();//realiza el navigate a public o private layout de manera automatica
      }, 1000);


    } else {
      //setLoged('error')
      alerts('Error', 'Usuario o contraseña incorrecta', 'error');
    }

  }

  return (
    <>
      <div className="limiter">
        <div className="container-login100">
          <div className="wrap-login100">
            <div className="login100-pic js-tilt" data-tilt>
              <img src={img} alt="IMG" className='img-rotate'></img>
            </div>

            <form className="login100-form validate-form" onSubmit={loginUser}>
              <span className="login100-form-title">
                Bienvendios
              </span>

              <div className="wrap-input100 validate-input" data-validate="El usuario o email es requerido">
                <input className="input100" type="text" name="username" placeholder="User / Email" onChange={changed} />
                <span className="focus-input100"></span>
                <span className="symbol-input100">
                  <i><FontAwesomeIcon icon={faUser} aria-hidden="true" /></i>

                </span>
              </div>

              <div className="wrap-input100 validate-input" data-validate="Password es requerida">
                <input className="input100" type="password" name="password" placeholder="Password" onChange={changed} />
                <span className="focus-input100"></span>
                <span className="symbol-input100">
                  <i > <FontAwesomeIcon icon={faLock} aria-hidden="true" /></i>
                </span>
              </div>

              <div className="container-login100-form-btn">
                <button className="login100-form-btn">
                  Login
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
  )
}

export default Login