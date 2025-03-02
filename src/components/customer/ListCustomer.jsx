import { useEffect, useState, useCallback, React } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import dayjs from "dayjs";
import "dayjs/locale/es";
import Modal from "../../helpers/modal/Modal";
import { NavLink } from "react-router-dom";
import usePagination from "../../hooks/usePagination";
import useSearch from "../../hooks/useSearch";

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
    setCustomers((prevCustomers) =>
      prevCustomers.map((customer) =>
        customer.id === customerUpdated.id ? customerUpdated : customer
      )
    );
  };

  dayjs.locale("es");
  // Función helper para formatear fechas consistentemente
  /*
  const formatDate = (date, format = "DD/MM/YYYY") => {
    return dayjs(date).tz("America/Guayaquil").format(format);
  };*/

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
      <div className="text-center py-2 container-fluid">
        <h2 className="py-2">Listado general de clientes</h2>
        <div className="row">
          <div className="mb-3 col-5 py-2">
            <h4 className="py-2">Total de clientes: {customers.length}</h4>
          </div>
          <div className="mb-3 col-5 py-2">
            <div className="mb-3 my-2">
              <label htmlFor="nameQuery" className="form-label fs-5">
                Buscar cliente por Nombre, Apellido o CI/RUC
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
        <table className="table table-striped">
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
              {
                //<th>Dirección</th>
              }
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentCustomers.length === 0 ? (
              <tr>
                <td colSpan="15" className="text-center">
                  Cliente no encontrado
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
                  <td>{dayjs.utc(customer.birthdate).format("dddd  DD/MM/YYYY")}</td>
                  
                  <td>{customer.numberPhone}</td>
                  <td>{customer.email}</td>
                  <td>{dayjs.utc(customer.createdAt).format("dddd DD/MM/YYYY")}</td>

                  <td>{customer.personalData === true ? "SÍ" : "NO"}</td>
                  {
                    //<td>{customer.address}</td>
                  }

                  <td className="d-flex gap-2">
                    <button
                      className="btn btn-success text-white fw-bold  w-100"
                      onClick={() =>
                        getCustomerById(customer.id, "updateCustomer")
                      }
                    >
                      Actualizar Información
                    </button>
                    {customer.policies && customer.policies.length >= 1 ? (
                      <>
                        <button
                          className="btn btn-primary text-white fw-bold  w-100"
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
                          className="btn btn-secondary text-white fw-bold w-100"
                        >
                          Registrar póliza
                        </NavLink>
                      </>
                    ) : (
                      <>
                        <NavLink
                          to="/management/create-policy"
                          state={{
                            customer,
                            isEditable: false,
                          }}
                          className="btn btn-secondary text-white fw-bold w-100"
                        >
                          Registrar póliza
                        </NavLink>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
        {customerId && typeof customerId === "object" && (
          <Modal
            isOpen={showModal}
            onClose={closeModal}
            customerId={customerId}
            modalType={modalType}
            onCustomerUpdated={handleCustomerUpdated} // Pasar el callback al modal
          ></Modal>
        )}
      </div>
    </>
  );
};

export default ListCustomer;
