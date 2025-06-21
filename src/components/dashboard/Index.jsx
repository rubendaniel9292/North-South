import "../../assets/css/dasboard-styles.css";
import { NavLink, Outlet } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPowerOff,
  faHome,
  faUsers,
  faCreditCard,
  faUniversity,
  faFileContract,
  faUserTie,
  faBuilding,
  faUserCog,
} from "@fortawesome/free-solid-svg-icons";
import useAuth from "../../hooks/useAuth";

const Index = () => {
  const { auth } = useAuth();
  if (!auth) {
    console.error(auth, ": auth no esta definido!!!...");
    return null;
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
                <NavLink to="/management/logout">
                  <i className="px-4 text-white h2">
                    <FontAwesomeIcon icon={faPowerOff} />
                  </i>
                </NavLink>
              </nav>
            </div>
          </div>
          <div className="row dasboard">
            <div className="col-2 lateral">
              <div>
                <NavLink to={"/management/home"}>
                  <button className="btnDas text-white fw-bold" type="button">
                    <FontAwesomeIcon icon={faHome} className="me-2" />
                    Inicio
                  </button>
                </NavLink>
              </div>

              {/* CLIENTES */}
              <div className="dropdown">
                <button
                  className="dropdown-toggle btnDas text-white fw-bold d-flex align-items-center"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#clientesMenu"
                  aria-expanded="false"
                >
                  <FontAwesomeIcon icon={faUsers} className="me-2" />
                  Gestión de clientes
                </button>
                <div className="collapse" id="clientesMenu">
                  <ul className="list-unstyled mb-1">
                    <li>
                      <NavLink
                        className="dropdown-item text-white fw-bold"
                        to={"/management/create-customer"}
                      >
                        Registrar Cliente
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        className="dropdown-item text-white fw-bold"
                        to={"/management/get-all-customer"}
                      >
                        Listado de clientes
                      </NavLink>
                    </li>
                  </ul>
                </div>
              </div>

              {/* TARJETAS */}
              <div className="dropdown">
                <button
                  className="dropdown-toggle btnDas text-white fw-bold d-flex align-items-center"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#tarjetasMenu"
                  aria-expanded="false"
                >
                  <FontAwesomeIcon icon={faCreditCard} className="me-2" />
                  Gestión de Tarjetas
                </button>
                <div className="collapse" id="tarjetasMenu">
                  <ul className="list-unstyled mb-1">
                    <li>
                      <NavLink
                        className="dropdown-item text-white fw-bold"
                        to={"/management/create-cards"}
                      >
                        Registro de tarjetas
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        className="dropdown-item text-white fw-bold"
                        to={"/management/create-bank"}
                      >
                        Registro de bancos
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        className="dropdown-item text-white fw-bold"
                        to={"/management/get-all-cards"}
                      >
                        Listado de tarjetas
                      </NavLink>
                    </li>
                  </ul>
                </div>
              </div>

              {/* CUENTAS BANCARIAS */}
              <div className="dropdown">
                <button
                  className="dropdown-toggle btnDas text-white fw-bold d-flex align-items-center"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#cuentasMenu"
                  aria-expanded="false"
                >
                  <FontAwesomeIcon icon={faUniversity} className="me-2" />
                  Gestión de cuentas bancarias
                </button>
                <div className="collapse" id="cuentasMenu">
                  <ul className="list-unstyled mb-1">
                    <li>
                      <NavLink
                        className="dropdown-item text-white fw-bold"
                        to={"/management/create-bankaccounts"}
                      >
                        Registro de cuentas bancarias
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        className="dropdown-item text-white fw-bold"
                        to={"/management/list-bankaccounts"}
                      >
                        Listar cuentas bancarias
                      </NavLink>
                    </li>
                  </ul>
                </div>
              </div>

              {/* POLIZAS */}
              <div className="dropdown">
                <button
                  className="dropdown-toggle btnDas text-white fw-bold d-flex align-items-center"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#polizasMenu"
                  aria-expanded="false"
                >
                  <FontAwesomeIcon icon={faFileContract} className="me-2" />
                  Gestión de Pólizas
                </button>
                <div className="collapse" id="polizasMenu">
                  <ul className="list-unstyled mb-1">
                    <li>
                      <NavLink
                        className="dropdown-item text-white fw-bold"
                        to={"/management/create-policy"}
                      >
                        Registro de Polizas
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        className="dropdown-item text-white fw-bold"
                        to={"/management/get-all-policy"}
                      >
                        Listado de Pólizas
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        className="dropdown-item text-white fw-bold"
                        to={"/management/get-all-payments"}
                      >
                        Lista de pagos
                      </NavLink>
                    </li>
                  </ul>
                </div>
              </div>

              {/* ASESORES */}
              <div className="dropdown">
                <button
                  className="dropdown-toggle btnDas text-white fw-bold d-flex align-items-center"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#asesoresMenu"
                  aria-expanded="false"
                >
                  <FontAwesomeIcon icon={faUserTie} className="me-2" />
                  Gestión de Asesores
                </button>
                <div className="collapse" id="asesoresMenu">
                  <ul className="list-unstyled mb-1">
                    <li>
                      <NavLink
                        className="dropdown-item text-white fw-bold"
                        to={"/management/create-advisor"}
                      >
                        Registro de Asesores
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        className="dropdown-item text-white fw-bold"
                        to={"/management/get-all-advisor"}
                      >
                        Listado de Asesores
                      </NavLink>
                    </li>
                  </ul>
                </div>
              </div>

              {/* COMPAÑIAS */}
              <div className="dropdown">
                <button
                  className="dropdown-toggle btnDas text-white fw-bold d-flex align-items-center"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#companiasMenu"
                  aria-expanded="false"
                >
                  <FontAwesomeIcon icon={faBuilding} className="me-2" />
                  Gestión de Compañías
                </button>
                <div className="collapse" id="companiasMenu">
                  <ul className="list-unstyled mb-1">
                    <li>
                      <NavLink
                        className="dropdown-item text-white fw-bold"
                        to={"/management/create-companies"}
                      >
                        Registro de Compañías
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        className="dropdown-item text-white fw-bold"
                        to={"/management/get-all-comapanies"}
                      >
                        Listado de Compañias
                      </NavLink>
                    </li>
                  </ul>
                </div>
              </div>

              {/* USUARIOS (solo admin) */}
              {auth.role === "ADMIN" && (
                <div className="dropdown">
                  <button
                    className="dropdown-toggle btnDas text-white fw-bold d-flex align-items-center"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#usuariosMenu"
                    aria-expanded="false"
                  >
                    <FontAwesomeIcon icon={faUserCog} className="me-2" />
                    Gestión de usuarios
                  </button>
                  <div className="collapse" id="usuariosMenu">
                    <ul className="list-unstyled mb-1">
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
