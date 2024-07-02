import img from '../../assets/img/img-01.png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faUser } from '@fortawesome/free-solid-svg-icons';
const Login = () => {
  return (
    <>
      <div className="limiter">
        <div className="container-login100">
          <div className="wrap-login100">
            <div className="login100-pic js-tilt" data-tilt>
              <img src={img} alt="IMG" className='img-rotate'></img>
            </div>

            <form className="login100-form validate-form">
              <span className="login100-form-title">
                Bienvendios
              </span>

              <div className="wrap-input100 validate-input" data-validate="Valid email is required: ex@abc.xyz">
                <input className="input100" type="text" name="email" placeholder="User / Email" />
                <span className="focus-input100"></span>
                <span className="symbol-input100">
                  <i><FontAwesomeIcon icon={faUser}aria-hidden="true" /></i>
                  
                </span>
              </div>

              <div className="wrap-input100 validate-input" data-validate="Password is required">
                <input className="input100" type="password" name="pass" placeholder="Password" />
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