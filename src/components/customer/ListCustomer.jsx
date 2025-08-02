import { useEffect, useState, useCallback, React } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import dayjs from "dayjs";
import "dayjs/locale/es";
import Modal from "../../helpers/modal/Modal";
import { NavLink } from "react-router-dom";
import usePagination from "../../hooks/usePagination";
import useSearch from "../../hooks/useSearch";
import { faSearch, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
const ListCustomer = () => {
  const [customerId, setCustomerId] = useState(null); // Almacenar un cliente de clientes en el estado
  const [customers, setCustomers] = useState([]); // Almacenar la lista de clientes en el estado
  const [modalType, setModalType] = useState(""); // Estado para controlar el tipo de modal
  const [showModal, setShowModal] = useState(false); // Estado para mostrar/ocultar modal

  const itemsPerPage = 7; // Número de asesor por página

  // Fetch all customers on component mount
  useEffect(() => {
    getAllCustomers();
  }, []);

  const getAllCustomers = useCallback(async () => {
    try {
      handleCustomerUpdated();
      const response = await http.get("customers/get-all-customer");
      if (response.data.status === "success") {
        setCustomers(response.data.allCustomer);
        console.log(response.data.allCustomer);
      }
    } catch (error) {
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching customers:", error);
    }
  }, []);

  const getCustomerById = useCallback(async (customerId, type) => {
    try {
      const response = await http.get(
        `customers/get-customer-id/${customerId}`
      );
      console.log("CLIENTE SELECIONADO ID:", customerId);

      if (response.data.status === "success") {
        const customer = response.data.customerById;
        if (!customer) {
          alerts("Error", "No existe cliente registrado con este ID", "error");
          return null;
        }

        setCustomerId(customer);
        setModalType(type);
        openModal();
      } else {
        alerts(
          "Error",
          "No existe cliente registrado con id " + customerId,
          "error"
        );
        console.error(response.message);
      }
    } catch (error) {
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching customers:", error);
    }
    return null;
  }, []);

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setCustomerId(null);
    setShowModal(false);
  };
  const handleCustomerUpdated = (customerUpdated) => {
    if (!customerUpdated) return;

    console.log("Cliente actualizado recibido:", customerUpdated);

    // Forzar una recarga completa de los clientes desde el servidor
    getAllCustomers();

    // También actualizamos el cliente seleccionado si es necesario
    if (customerId && customerId.id === customerUpdated.id) {
      setCustomerId({
        ...customerId,
        ...customerUpdated,
        civil: customerUpdated.civil,
        province: customerUpdated.province,
        city: customerUpdated.city,
      });
    }
  };

  dayjs.locale("es");

  // Usar el hook personalizado para la búsqueda
  const {
    query,
    setQuery,
    filteredItems: filteredCustomers,
  } = useSearch(customers, [
    "ci_ruc",
    "firstName",
    "secondName",
    "surname",
    "secondSurname",
  ]);
  // Usar el hook personalizado para la paginación
  const {
    currentPage,
    currentItems: currentCustomers,
    totalPages,
    paginate,
  } = usePagination(filteredCustomers, itemsPerPage);

  // Generar números de página
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <>
      <section>
        <div className="text-center py-2">
          <h2 className="py-2">Listado general de clientes</h2>

          {/* Header con información y controles */}
          <div className="row mb-4">
            {/* Total de clientes */}
            <div className="col-md-4">
              <div className="card bg-info text-white">
                <div className="card-body py-2">
                  <h5 className="card-title mb-1">
                    <FontAwesomeIcon icon={faUsers} className="me-2" />
                    Total de clientes
                  </h5>
                  <h3 className="mb-0">{customers.length}</h3>
                </div>
              </div>
            </div>

            {/* Buscador */}
            <div className="col-md-8 mb-3">
              <label htmlFor="nameQuery" className="form-label fw-bold">
                <FontAwesomeIcon icon={faSearch} className="me-2" />
                Buscar por nombre, apellido, cédula o RUC
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <FontAwesomeIcon icon={faSearch} />
                </span>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="nameQuery"
                  placeholder="Ingrese nombre, apellido, cédula o RUC"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <small className="text-dark fs-5 mt-2">
                {filteredCustomers.length} cliente(s) encontrado(s)
              </small>
            </div>
          </div>

          {/* Tabla de clientes */}
          <table className="table table-striped py-1">
            <thead>
              <tr>
                <th>N°</th>
                <th>Cédula / RUC</th>
                <th colSpan="4" scope="row">
                  Cliente
                </th>
                <th>Estado Civil</th>
                <th>Provincia</th>
                <th>Ciudad o Cantón</th>
                <th>Fecha de nacimiento</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Fecha de Registro</th>
                <th>Tratamiento de datos personales</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentCustomers.length === 0 ? (
                <tr>
                  <td colSpan="15" className="text-center">
                    {query
                      ? "No se encontraron clientes"
                      : "Aún no hay clientes registrados"}
                  </td>
                </tr>
              ) : (
                currentCustomers.map((customer, index) => (
                  <tr key={customer.id}>
                    <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td>{customer.ci_ruc}</td>
                    <td>{customer.firstName}</td>
                    <td>{customer.secondName}</td>
                    <td>{customer.surname}</td>
                    <td>{customer.secondSurname}</td>
                    <td>{customer.civil?.status}</td>
                    <td>{customer.province?.provinceName}</td>
                    <td>{customer.city?.cityName}</td>
                    <td>
                      {dayjs.utc(customer.birthdate).format("DD/MM/YYYY")}
                    </td>
                    <td>{customer.numberPhone}</td>
                    <td>{customer.email}</td>
                    <td>
                      {dayjs.utc(customer.createdAt).format("DD/MM/YYYY")}
                    </td>
                    <td>
                      <span
                        className={`badge fw-bold fs-6 ${
                          customer.personalData ? "bg-success" : "bg-danger"
                        }`}
                      >
                        {customer.personalData ? "SÍ" : "NO"}
                      </span>
                    </td>
                    <td className="d-flex gap-2">
                      <button
                        className="btn btn-success text-white fw-bold w-100 my-1"
                        onClick={() =>
                          getCustomerById(customer.id, "updateCustomer")
                        }
                      >
                        Actualizar Información
                      </button>
                      {customer.policies && customer.policies.length >= 1 ? (
                        <>
                          <button
                            className="btn btn-primary text-white fw-bold w-100 my-1"
                            onClick={() =>
                              getCustomerById(customer.id, "customerId")
                            }
                          >
                            Ver pólizas
                          </button>
                          <NavLink
                            to="/management/create-policy"
                            state={{
                              customer,
                              isEditable: false,
                            }}
                            className="btn btn-secondary text-white fw-bold w-100 my-1"
                          >
                            Registrar póliza
                          </NavLink>
                        </>
                      ) : (
                        <NavLink
                          to="/management/create-policy"
                          state={{
                            customer,
                            isEditable: false,
                          }}
                          className="btn btn-secondary text-white fw-bold w-100 my-1"
                        >
                          Registrar póliza
                        </NavLink>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Paginación */}
          {filteredCustomers.length > itemsPerPage && (
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

        {/* Modal */}
        {customerId && typeof customerId === "object" && (
          <Modal
            isOpen={showModal}
            onClose={closeModal}
            customerId={customerId}
            modalType={modalType}
            onCustomerUpdated={handleCustomerUpdated}
          />
        )}
      </section>
    </>
  );
};

export default ListCustomer;
