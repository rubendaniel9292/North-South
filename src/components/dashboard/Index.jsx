import "../../assets/css/dasboard-styles.css";
import { NavLink, Outlet } from "react-router-dom";
import React, { useState, useMemo, useCallback, memo } from "react";
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
  faScaleBalanced,
} from "@fortawesome/free-solid-svg-icons";
import useAuth from "../../hooks/useAuth";

// ✅ Constantes para evitar valores mágicos, Define la altura en píxeles de cada elemento del menú desplegable.
//Define la duración de las animaciones de apertura/cierre de menús., Esto permite que la animación sea suave y calcule la altura exacta
const MENU_ITEM_HEIGHT = 55;
const ANIMATION_DURATION = "0.25s";

// ✅ Función helper para verificar permisos de rol
const hasRolePermission = (allowedRoles, userRole) => {
  if (!allowedRoles || allowedRoles.length === 0) return true; // Si no hay restricciones, permitir acceso
  return allowedRoles.includes(userRole);
};

// ✅ Función para filtrar elementos del menú basado en roles
const filterMenuByRole = (menuItems, userRole) => {
  return menuItems
    .filter(item => hasRolePermission(item.allowedRoles, userRole))
    .map(item => {
      if (item.items) {
        const filteredSubItems = item.items.filter(subItem =>
          hasRolePermission(subItem.allowedRoles, userRole)
        );

        // Si no hay sub-elementos visibles, no mostrar el menú padre
        if (filteredSubItems.length === 0) return null;

        return {
          ...item,
          items: filteredSubItems
        };
      }
      return item;
    })
    .filter(Boolean); // Eliminar elementos null
};

const Index = memo(() => {
  const { auth } = useAuth();
  const [open, setOpen] = useState(null);

  if (!auth) {
    console.error(auth, ": auth no esta definido!!!...");
    return null;
  }

  // ✅ Menú configurado con memoización para optimizar performance
  const menuConfig = useMemo(() => [
    {
      id: "home",
      icon: faHome,
      label: "Inicio",
      link: "/management/home",
      allowedRoles: ["ADMIN", "BASIC", "ELOPDP"], // Todos los roles pueden ver inicio
    },
    {
      id: "clientesMenu",
      icon: faUsers,
      label: "Gestión de Clientes",
      allowedRoles: ["ADMIN", "BASIC", "ELOPDP"],
      items: [
        {
          label: "Registrar Cliente",
          link: "/management/create-customer",
          allowedRoles: ["ADMIN", "BASIC"]
        },
        {
          label: "Listado de Clientes",
          link: "/management/get-all-customer",
          allowedRoles: ["ADMIN", "BASIC", "ELOPDP"]
        },
      ],
    },
    {
      id: "tarjetasMenu",
      icon: faCreditCard,
      label: "Gestión de Tarjetas",
      allowedRoles: ["ADMIN", "BASIC", "ELOPDP"],
      items: [
        {
          label: "Registro de Tarjetas",
          link: "/management/create-cards",
          allowedRoles: ["ADMIN", "BASIC"]
        },
        {
          label: "Registro de Bancos",
          link: "/management/create-bank",
          allowedRoles: ["ADMIN", "BASIC"]
        },
        {
          label: "Listado de Tarjetas",
          link: "/management/get-all-cards",
          allowedRoles: ["ADMIN", "BASIC", "ELOPDP"],
        },
      ],
    },
    {
      id: "cuentasMenu",
      icon: faUniversity,
      label: "Gestión de Cuentas Bancarias",
      allowedRoles: ["ADMIN", "BASIC", "ELOPDP"],
      items: [
        {
          label: "Registro de cuentas bancarias",
          link: "/management/create-bankaccounts",
          allowedRoles: ["ADMIN", "BASIC"]
        },
        {
          label: "Listar Cuentas Bancarias",
          link: "/management/list-bankaccounts",
          allowedRoles: ["ADMIN", "BASIC", "ELOPDP"],
        },
      ],
    },
    {
      id: "polizasMenu",
      icon: faFileContract,
      label: "Gestión de Pólizas",
      allowedRoles: ["ADMIN", "BASIC", "ELOPDP"],
      items: [
        {
          label: "Registro de Polizas",
          link: "/management/create-policy",
          allowedRoles: ["ADMIN", "BASIC"]
        },
        {
          label: "Listado de Pólizas",
          link: "/management/get-all-policy",
          allowedRoles: ["ADMIN", "BASIC", "ELOPDP"],
        },
      ],
    },
    {
      id: "asesoresMenu",
      icon: faUserTie,
      label: "Gestión de Asesores",
      allowedRoles: ["ADMIN", "BASIC", "ELOPDP"],
      items: [
        {
          label: "Registro de Asesores",
          link: "/management/create-advisor",
          allowedRoles: ["ADMIN", "BASIC"]
        },
        {
          label: "Listado de Asesores",
          link: "/management/get-all-advisor",
          allowedRoles: ["ADMIN", "BASIC", "ELOPDP"],
        },
      ],
    },
    {
      id: "companiasMenu",
      icon: faBuilding,
      label: "Gestión de Compañías",
      allowedRoles: ["ADMIN", "BASIC", "ELOPDP"],
      items: [
        {
          label: "Registro de Compañías",
          link: "/management/create-companies",
          allowedRoles: ["ADMIN", "BASIC", "ELOPDP"],
        },
        {
          label: "Listado de Compañías",
          link: "/management/get-all-companies",
          allowedRoles: ["ADMIN", "BASIC", "ELOPDP"],
        },
      ],
    },
    {
      id: "gestionLopdp",
      icon: faScaleBalanced,
      label: "Gestión de LOPDP",
      allowedRoles: ["ADMIN", "BASIC", "ELOPDP"],
      items: [
        {
          label: "Listado de LOPDP",
          link: "/management/management-lopdp",
          allowedRoles: ["ADMIN", "BASIC", "ELOPDP"],
        },
      ],
    },
  ], []); // ✅ Array vacío como dependencia ya que el menú es estático

  // ✅ Memoizar configuración final del menú incluyendo lógica de roles y ADMIN
  const finalMenuConfig = useMemo(() => {
    // Primero aplicar filtro por roles al menú base
    let filteredMenu = filterMenuByRole(menuConfig, auth?.role);

    // Luego agregar menú de usuarios solo para ADMIN
    if (auth?.role === "ADMIN") {
      filteredMenu.push({
        id: "usuariosMenu",
        icon: faUserCog,
        label: "Gestión de Usuarios",
        allowedRoles: ["ADMIN"],
        items: [
          {
            label: "Añadir Usuario",
            link: "/management/create-user",
            allowedRoles: ["ADMIN"]
          },
          {
            label: "Lista de Usuarios",
            link: "/management/user-list",
            allowedRoles: ["ADMIN"]
          },
        ],
      });
    }

    return filteredMenu;
  }, [auth?.role, menuConfig]);

  // ✅ Memoizar función de toggle para evitar re-renders
  const handleToggle = useCallback((id) => {
    setOpen(open === id ? null : id);
  }, [open]);

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
              {finalMenuConfig.map((item) =>
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
                      className={`btnDas text-white fw-bold d-flex align-items-center menu-btn-custom w-100 ${open === item.id ? "opened" : ""
                        }`}
                      type="button"
                      onClick={() => handleToggle(item.id)}
                      aria-expanded={open === item.id}
                      aria-label={`${open === item.id ? 'Cerrar' : 'Abrir'} menú ${item.label}`}
                      style={{ display: "block" }}
                    >
                      <FontAwesomeIcon icon={item.icon} className="me-2" />
                      {item.label}
                      <span className="ms-auto">
                        {open === item.id ? "▾" : "▸"}
                      </span>
                    </button>
                    <div
                      className={`custom-collapse ${open === item.id ? "show" : ""
                        }`}
                      style={{
                        maxHeight:
                          open === item.id
                            ? `${item.items.length * MENU_ITEM_HEIGHT}px`
                            : "0",
                        transition: `max-height ${ANIMATION_DURATION} ease`,
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
});

// Agregamos displayName para debugging, es una propiedad especial de React que se usa para identificar componentes durante el debugging y desarrollo.
Index.displayName = 'Index';

export default Index;
