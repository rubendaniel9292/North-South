import "../../assets/css/dasboard-styles.css";
import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
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
  const [open, setOpen] = useState(null);

  if (!auth) {
    console.error(auth, ": auth no esta definido!!!...");
    return null;
  }

  // Menú configurado para un solo dropdown abierto a la vez
  const menuConfig = [
    {
      id: "home",
      icon: faHome,
      label: "Inicio",
      link: "/management/home",
    },
    {
      id: "clientesMenu",
      icon: faUsers,
      label: "Gestión de Clientes",
      items: [
        { label: "Registrar Cliente", link: "/management/create-customer" },
        { label: "Listado de Clientes", link: "/management/get-all-customer" },
      ],
    },
    {
      id: "tarjetasMenu",
      icon: faCreditCard,
      label: "Gestión de Tarjetas",
      items: [
        { label: "Registro de Tarjetas", link: "/management/create-cards" },
        { label: "Registro de Bancos", link: "/management/create-bank" },
        { label: "Listado de Tarjetas", link: "/management/get-all-cards" },
      ],
    },
    {
      id: "cuentasMenu",
      icon: faUniversity,
      label: "Gestión de Cuentas Bancarias",
      items: [
        {
          label: "Registro de cuentas bancarias",
          link: "/management/create-bankaccounts",
        },
        {
          label: "Listar Cuentas Bancarias",
          link: "/management/list-bankaccounts",
        },
      ],
    },
    {
      id: "polizasMenu",
      icon: faFileContract,
      label: "Gestión de Pólizas",
      items: [
        { label: "Registro de Polizas", link: "/management/create-policy" },
        { label: "Listado de Pólizas", link: "/management/get-all-policy" },
        /*{ label: "Lista de pagos", link: "/management/get-all-payments" },*/
      ],
    },
    {
      id: "asesoresMenu",
      icon: faUserTie,
      label: "Gestión de Asesores",
      items: [
        { label: "Registro de Asesores", link: "/management/create-advisor" },
        { label: "Listado de Asesores", link: "/management/get-all-advisor" },
      ],
    },
    {
      id: "companiasMenu",
      icon: faBuilding,
      label: "Gestión de Compañías",
      items: [
        {
          label: "Registro de Compañías",
          link: "/management/create-companies",
        },
        {
          label: "Listado de Compañias",
          link: "/management/get-all-comapanies",
        },
      ],
    },
  ];

  if (auth?.role === "ADMIN") {
    menuConfig.push({
      id: "usuariosMenu",
      icon: faUserCog,
      label: "Gestión de Usuarios",
      items: [
        { label: "Añadir Usuario", link: "/management/create-user" },
        { label: "Lista de Usuarios", link: "/management/user-list" },
      ],
    });
  }

  const handleToggle = (id) => {
    setOpen(open === id ? null : id);
  };

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
          
              {menuConfig.map((item) =>
                !item.items ? (
                  <NavLink
                    key={item.id}
                    to={item.link}
                    className="btnDas text-white fw-bold menu-btn-custom w-100"
                    style={{ display: "block" }}
                  >
                    <FontAwesomeIcon icon={item.icon} className="me-2" />
                    {item.label}
                  </NavLink>
                ) : (
                  <div
                    className="dropdown"
                    key={item.id}
                    style={{ width: "100%" }}
                  >
                    <button
                      className={`btnDas text-white fw-bold d-flex align-items-center menu-btn-custom w-100 ${
                        open === item.id ? "opened" : ""
                      }`}
                      type="button"
                      onClick={() => handleToggle(item.id)}
                      aria-expanded={open === item.id}
                      style={{ display: "block" }}
                    >
                      <FontAwesomeIcon icon={item.icon} className="me-2" />
                      {item.label}
                      <span className="ms-auto">
                        {open === item.id ? "▾" : "▸"}
                      </span>
                    </button>
                    <div
                      className={`custom-collapse ${
                        open === item.id ? "show" : ""
                      }`}
                      style={{
                        maxHeight:
                          open === item.id
                            ? `${item.items.length * 55}px`
                            : "0",
                        transition: "max-height 0.25s ease",
                        overflow: "hidden",
                      }}
                    >
                      <ul className="list-unstyled">
                        {item.items.map((sub, idx) => (
                          <li key={idx}>
                            <NavLink
                              className="dropdown-item text-white fw-bold submenu-btn-custom"
                              to={sub.link}
                            >
                              {sub.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
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
