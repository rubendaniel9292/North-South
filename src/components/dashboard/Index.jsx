import "../../assets/css/dasboard-styles.css";
import { NavLink, Outlet } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPowerOff } from "@fortawesome/free-solid-svg-icons";
import useAuth from "../../hooks/useAuth";

const Index = () => {
  const { auth } = useAuth();
  // Verificar si auth es undefined antes de acceder a sus propiedades
  if (!auth) {
    // Manejar el caso donde auth es undefined, por ejemplo, mostrando un mensaje de error o tomando una acción predeterminada.
    console.error(auth, ": auth no esta definido!!!...");
    return null; // O realiza alguna acción adecuada para tu aplicación
  }
  return (
    <>
      <section>
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <nav className="navIndex d-flex align-items-center justify-content-end">
                <h2 className="text-white h5">
                  Bienvenid@ {auth.firstName} {auth.surname} al sistema de
                  gestión de North South
                </h2>
                <NavLink to="/management/logout" className="">
                  <i className="px-4 text-white h2">
                    <FontAwesomeIcon icon={faPowerOff} />
                  </i>
                </NavLink>
              </nav>
            </div>
          </div>
          <div className="row dasboard">
            <div className="col-2 lateral">
              <div className="py-2">
                <NavLink to={"/management/home"}>
                  <button className="btnDas text-white fw-bold" type="button">
                    Inicio
                  </button>
                </NavLink>
              </div>
              <div className="py-2 dropdown">
                <button
                  className="dropdown-toggle btnDas text-white  fw-bold"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Gestión de clientes
                </button>
                <ul className="dropdown-menu dropdown-toggle text-center">
                  <li>
                    <NavLink
                      className="dropdown-item text-white fw-bold"
                      to={"/management/create-customer"}
                    >
                      Registrar Cliente
                    </NavLink>
                  </li>
                  <li>
                    <NavLink className="dropdown-item text-white fw-bold"  to={"/management/get-all-customer"}>
                      Listado de clientes
                    </NavLink>
                  </li>
                 
                 
                </ul>
              </div>
              <div className="py-2 dropdown">
                <button
                  className="dropdown-toggle btnDas text-white  fw-bold"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Gestión de Tarjetas
                </button>
                <ul className="dropdown-menu dropdown-toggle text-center">
                  <li>
                    <NavLink className="dropdown-item text-white fw-bold"  to={"/management/create-cards"}>
                      Registro de tarjetas
                    </NavLink>
                  </li>
                  <li>
                    <NavLink className="dropdown-item text-white fw-bold"  to={"/management/create-bank"}>
                      Registro de bancos
                    </NavLink>
                  </li>

                  <li>
                    <NavLink className="dropdown-item text-white fw-bold"  to={"/management/get-all-cards"}>
                      Listado de tarjetas
                    </NavLink>
                  </li>
                </ul>
              </div>
              <div className="py-2 dropdown">
                <button
                  className="dropdown-toggle btnDas text-white  fw-bold"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Gestión de Pólizas
                </button>
                <ul className="dropdown-menu dropdown-toggle text-center">
                  <li>
                    <NavLink className="dropdown-item text-white fw-bold"  to={"/management/create-policy"}>
                      Registro de Polizas
                    </NavLink>
                  </li>
                  
                  <li>
                    <NavLink className="dropdown-item text-white fw-bold"  to={"/management/get-all-policy"}>
                      Listado de Pólizas
                    </NavLink>
                  </li>
                </ul>
              </div>
              <div className="py-2 dropdown">
                <button
                  className="dropdown-toggle btnDas text-white  fw-bold"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Gestión de Asesores
                </button>
                <ul className="dropdown-menu dropdown-toggle text-center">
                  <li>
                    <NavLink className="dropdown-item text-white fw-bold"  to={"/management/create-advisor"}>
                      Registro de Asesores
                    </NavLink>
                  </li>
                  <li>
                    <NavLink className="dropdown-item text-white fw-bold"  to={"/management/get-all-advisor"}>
                      Listado de Asesores
                    </NavLink>
                  </li>
                </ul>
              </div>
              <div className="py-2 dropdown">
                <button
                  className="dropdown-toggle btnDas text-white  fw-bold"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Gestión de Compañías
                </button>
                <ul className="dropdown-menu dropdown-toggle text-center">
                  <li>
                    <NavLink className="dropdown-item text-white fw-bold"  to={"/management/create-companies"}>
                      Registro de Compañías
                    </NavLink>
                  </li>
                  <li>
                    <NavLink className="dropdown-item text-white fw-bold"  to={"/management/get-all-comapanies"}>
                      Listado de Compañias
                    </NavLink>
                  </li>
                  
                 
                </ul>
              </div>
              {auth.role === "ADMIN" && (
                <div className="py-2 dropdown">
                  <button
                    className="dropdown-toggle btnDas text-white  fw-bold"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    Gestión de usuarios
                  </button>
                  <ul className="dropdown-menu dropdown-toggle text-center">
                    <li>
                      <NavLink
                        className="dropdown-item text-white fw-bold"
                        to={"/management/create-user"}
                      >
                        Añadir usuario
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        className="dropdown-item text-white fw-bold"
                        to={"/management/user-list"}
                      >
                        Lista de usuarios
                      </NavLink>
                    </li>
                  </ul>
                </div>
              )}
            </div>
            <div className="col-10 dasboard my-2 ms-2">
              <Outlet />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Index;
