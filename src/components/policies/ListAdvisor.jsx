import { useEffect, useState, useCallback } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import dayjs from "dayjs";
import "dayjs/locale/es";
import Modal from "../../helpers/modal/Modal";
import usePagination from "../../hooks/usePagination";
import useSearch from "../../hooks/useSearch";
const ListAdvisor = () => {
  const [advisor, setAdvisor] = useState([]);
  const [advisorId, setAdvisorId] = useState({});

  const [modalType, setModalType] = useState(""); // Estado para controlar el tipo de modal
  const [showModal, setShowModal] = useState(false); // Estado para mostrar/ocultar modal

  const itemsPerPage = 5; // Número de asesor por página

  dayjs.locale("es");
  const openModal = () => {
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
  };

  const getAvidorById = useCallback(async (advisorId, type) => {
    try {
      const response = await http.get(`advisor/get-advisor/${advisorId}`);
      console.log("Asesor por id obtenido: ", response.data.advisorById);
      console.log("Tipo de modal: ", type);
      setAdvisorId(response.data.advisorById);
      setModalType(type);
      openModal();
    } catch (error) {
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching asesores:", error);
    }
  }, []);

  const getAllAdvisor = useCallback(async () => {
    try {
      const response = await http.get("advisor/get-all-advisor");
      if (response.data.status === "success") {
        setAdvisor(response.data.allAdvisors); // Asume que la respuesta contiene un array de usuarios bajo la clave 'allUser'
        console.log(response.data.allAdvisors);
        //openModal(advisorId);
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

  useEffect(() => {
    getAllAdvisor();
  }, [getAllAdvisor]);

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
  return (
    <>
      <div className="text-center py-2">
        <h2 className="py-2">Lista de Asesores</h2>
        <div className="row">
          <div className="mb-3 col-5 py-2">
            <h4 className="py-2">Total de asesores: {advisor.length}</h4>
          </div>
          <div className="mb-3 col-5 py-2">
            <div className="mb-3 my-2">
              <label htmlFor="nameQuery" className="form-label fs-5">
                Buscar asesor por Nombre, Apellido o CI/RUC
              </label>
              <input
                type="text"
                className="form-control"
                id="nameQuery"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        <table className="table table-striped py-2">
          <thead>
            <tr>
              <th>N°</th>
              <th>Cédula / RUC</th>
              <th colSpan="4" scope="row">
                Asesor
              </th>
              <th>Fecha de nacimiento</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Fecha de Registro</th>
              <th>Tratatamiento de datos personales</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentAdvisors.length === 0 ? (
              <tr>
                <td colSpan="15" className="text-center">
                  Asesor no encontrado
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
                  <td>
                    {dayjs(item.birthdate).format("DD/MM/YYYY").toString()}
                  </td>
                  <td>{item.numberPhone}</td>
                  <td>{item.email}</td>
                  <td>
                    {dayjs(item.createdAt).format("dddd DD/MM/YYYY").toString()}
                  </td>
                  <td>{item.personalData === "true" ? "SÍ" : "NO"}</td>

                  <td>
                    <button className="btn btn-success text-white fw-bold w-100 my-1">
                      Actualizar
                    </button>

                    <button
                      onClick={() => getAvidorById(item.id, "advisor")}
                      className="btn btn-success text-white fw-bold w-100 my-1"
                    >
                      Registrar Anticipio
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
                  className={`page-item${
                    currentPage === number ? " active" : ""
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
                className={`page-item${
                  currentPage === pageNumbers.length ? " disabled" : ""
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

      {advisorId && typeof advisorId === "object" && (
        // Renderiza el modal solo si policy tiene un valor
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          advisorId={advisorId}
          modalType={modalType} // Pasamos el tipo de modal a mostrar
        ></Modal>
      )}
    </>
  );
};

export default ListAdvisor;
