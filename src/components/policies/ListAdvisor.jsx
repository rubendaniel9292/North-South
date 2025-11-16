import { useEffect, useState, useCallback } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import dayjs from "dayjs";
import "dayjs/locale/es";
import Modal from "../../helpers/modal/Modal";
import usePagination from "../../hooks/usePagination";
import useSearch from "../../hooks/useSearch";
import { NavLink } from "react-router-dom";
import { 
  faSearch, 
  faUserTie, 
  faHistory, 
  faPlus, 
  faMinus, 
  faEdit,
  faExclamationTriangle,
  faIdCard,
  faBirthdayCake,
  faPhone,
  faEnvelope,
  faShieldAlt,
  faCogs
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useAuth from "../../hooks/useAuth";
const ListAdvisor = () => {
  const [advisor, setAdvisor] = useState([]);
  const [advisorId, setAdvisorId] = useState({});

  const [modalType, setModalType] = useState(""); // Estado para controlar el tipo de modal
  const [showModal, setShowModal] = useState(false); // Estado para mostrar/ocultar modal
  const { auth } = useAuth();
  const itemsPerPage = 5; // Número de asesor por página

  dayjs.locale("es");
  const openModal = () => {
    setShowModal(true);
  };
  const closeModal = () => {
    localStorage.removeItem(`selectedPolicies_${advisorId.id}`);
    setShowModal(false);
  };
  useEffect(() => {
    getAllAdvisor();
  }, []);
  const getAvidorById = useCallback(async (advisorId, type) => {
    try {
      // Para "advisor" (registro de comisiones), usar endpoint optimizado con limit=0 para obtener solo datos básicos
      // Las pólizas se cargarán bajo demanda en el modal cuando se apliquen filtros
      const endpoint = type === "advisor"
        ? `advisor/get-advisor-optimized/${advisorId}?page=1&limit=0` // Solo datos básicos, sin pólizas
        : `advisor/get-advisor/${advisorId}`; // Endpoint completo para otros casos
      
      const response = await http.get(endpoint);
      console.log("Asesor obtenido: ", response.data.advisorById || response.data.advisor);
      setAdvisorId(response.data.advisorById || response.data.advisor);
      setModalType(type);
      openModal();
    } catch (error) {
      alerts("Error", "No se pudo cargar el asesor", "error");
      console.error("Error fetching asesor:", error);
    }
  }, []);

  const getAllAdvisor = useCallback(async () => {
    try {
      const response = await http.get("advisor/get-all-advisor");
      if (response.data.status === "success") {
        setAdvisor(response.data.allAdvisors); // Asume que la respuesta contiene un array de usuarios bajo la clave 'allUser'
        console.log(response.data.allAdvisors);
      } else {
        alerts("Error", "No existen asesores registrados", "error");
        console.error("Error fetching asesores:", response.message);
      }
    } catch (error) {
      //setError(error);
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching asesores:", error);
    }
  }, []);

  // Recargar UN asesor (para refrescar el modal)
  const reloadAdvisor = useCallback(
    async (id) => {
      const response = await http.get(`advisor/get-advisor/${id}`);
      if (response.data && response.data.advisorById)
        setAdvisorId(response.data.advisorById);
      //  refrescar también la tabla al llamar a getAllAdvisor
      await getAllAdvisor();
    },
    [getAllAdvisor]
  );

  // Usar el hook personalizado para la búsqueda
  const {
    query,
    setQuery,
    filteredItems: filteredAdvisor,
  } = useSearch(advisor, [
    "ci_ruc",
    "firstName",
    "secondName",
    "surname",
    "secondSurname",
  ]);

  // Usar el hook personalizado para la paginación
  const {
    currentPage,
    currentItems: currentAdvisors,
    totalPages,
    paginate,
  } = usePagination(filteredAdvisor, itemsPerPage);

  // Generar números de página
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const handleAdvisorUpdated = (advisorUpdated) => {
    setAdvisor((prevAdvisor) =>
      prevAdvisor.map((advisor) =>
        advisor.id === advisorUpdated.id ? advisorUpdated : advisor
      )
    );
  };

  return (
    <>
      <section>
        <div className="text-center py-2">
          <h2 className="py-2">Listado general de todos los asesores</h2>

          {/* Header con información y controles */}
          <div className="row mb-4">
            {/* Total de asesores */}
            <div className="col-md-4">
              <div className="card bg-success text-white">
                <div className="card-body py-2">
                  <h5 className="card-title mb-1">
                    <FontAwesomeIcon icon={faUserTie} className="me-2" />
                    Total de asesores
                  </h5>
                  <h3 className="mb-0">{advisor.length}</h3>
                </div>
              </div>
            </div>

            {/* Buscador */}
            <div className="col-md mb-3">
              <label htmlFor="nameQuery" className="form-label fw-bold">
                <FontAwesomeIcon icon={faSearch} className="me-2" />
                Buscar por nombre, apellido, cédula/ruc
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <FontAwesomeIcon icon={faSearch} />
                </span>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="nameQuery"
                  placeholder="Ingrese nombre, apellido, cédula o RUC..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <small className="text-dark fs-5 pt-2">
                {filteredAdvisor.length} asesor(es) encontrado(s)
              </small>
            </div>
          </div>

          {/* Tabla de asesores */}
          <table className="table table-striped py-1">
            <thead>
              <tr>
                <th>N°</th>
                <th>
                  <FontAwesomeIcon icon={faIdCard} className="me-2" />
                  Cédula / RUC
                </th>
                <th colSpan="4" scope="row">
                  <FontAwesomeIcon icon={faUserTie} className="me-2" />
                  Asesor
                </th>
                <th>
                  <FontAwesomeIcon icon={faBirthdayCake} className="me-2" />
                  Fecha de nacimiento
                </th>
                <th>
                  <FontAwesomeIcon icon={faPhone} className="me-2" />
                  Teléfono
                </th>
                <th>
                  <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                  Email
                </th>
                <th>
                  <FontAwesomeIcon icon={faShieldAlt} className="me-2" />
                  Tratamiento de datos personales
                </th>
                <th>
                  <FontAwesomeIcon icon={faCogs} className="me-2" />
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {currentAdvisors.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center">
                    {query
                      ? "No se encontraron asesores"
                      : "Aún no hay asesores registrados"}
                  </td>
                </tr>
              ) : (
                currentAdvisors.map((item, index) => (
                  <tr key={item.id}>
                    <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td>{item.ci_ruc}</td>
                    <td>{item.firstName}</td>
                    <td>{item.secondName}</td>
                    <td>{item.surname}</td>
                    <td>{item.secondSurname}</td>
                    <td>{dayjs.utc(item.birthdate).format("DD/MM/YYYY")}</td>
                    <td>{item.numberPhone}</td>
                    <td>{item.email}</td>
                    <td>
                      <span
                        className={`badge fw-bold fs-6 ${item.personalData ? "bg-success" : "bg-danger"
                          }`}
                      >
                        {item.personalData ? "SÍ" : "NO"}
                      </span>
                    </td>
                    <td className="d-flex gap-2">
                      {item.policies && item.policies.length >= 1 ? (
                        <>
                          <NavLink
                            to="/management/get-all-commissions"
                            state={{
                              advisor: item,
                            }}
                            className="btn btn-primary text-white fw-bold w-100 my-1"
                            title="Ver historial completo de comisiones y anticipos"
                          >
                            <FontAwesomeIcon icon={faHistory} className="me-2" />
                            Ver historial de Com/Anticipos
                          </NavLink>
                          {auth?.role !== "ELOPDP" && (<>
                            <button
                              onClick={() => getAvidorById(item.id, "advisor")}
                              className="btn btn-secondary text-white fw-bold w-100 my-1"
                              title="Registrar nueva comisión para el asesor"
                            >
                              <FontAwesomeIcon icon={faPlus} className="me-2" />
                              Registrar Comisión
                            </button>

                            <button
                              onClick={() =>
                                getAvidorById(item.id, "commissionRefunds")
                              }
                              className="btn btn-danger fw-bold w-100 my-1"
                              title="Descontar comisiones del asesor"
                            >
                              <FontAwesomeIcon icon={faMinus} className="me-2" />
                              Descontar Comisiones
                            </button>
                          </>)}

                        </>
                      ) : (
                        <div className="btn btn-secondary disabled text-white fw-bold w-100 my-1">
                          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                          No se registran pólizas
                        </div>
                      )}

                      <button
                        className="btn btn-success text-white fw-bold w-100 my-1"
                        onClick={() => getAvidorById(item.id, "updateAdvisor")}
                        title="Actualizar información del asesor"
                      >
                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                        Actualizar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Paginación */}
          {filteredAdvisor.length > itemsPerPage && (
            <nav aria-label="page navigation example">
              <ul className="pagination">
                <li
                  className={`page-item${currentPage === 1 ? " disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => paginate(currentPage - 1)}
                  >
                    Anterior
                  </button>
                </li>
                {pageNumbers.map((number) => (
                  <li
                    key={number}
                    className={`page-item${currentPage === number ? " active" : ""
                      }`}
                  >
                    <button
                      onClick={() => paginate(number)}
                      className="page-link"
                    >
                      {number}
                    </button>
                  </li>
                ))}
                <li
                  className={`page-item${currentPage === pageNumbers.length ? " disabled" : ""
                    }`}
                >
                  <button
                    className="page-link"
                    onClick={() => paginate(currentPage + 1)}
                  >
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>

        {/* Modal */}
        {advisorId && typeof advisorId === "object" && (
          <Modal
            isOpen={showModal}
            onClose={closeModal}
            advisorId={advisorId}
            modalType={modalType}
            onAdvisorUpdated={handleAdvisorUpdated}
            refreshAdvisor={() => reloadAdvisor(advisorId.id)}
          />
        )}
      </section>
    </>
  );
};

export default ListAdvisor;
