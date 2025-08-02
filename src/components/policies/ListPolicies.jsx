import { useCallback, useEffect, useState, useMemo } from "react";
import Modal from "../../helpers/modal/Modal";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import dayjs from "dayjs";
import usePagination from "../../hooks/usePagination";
import useSearch from "../../hooks/useSearch";
import "dayjs/locale/es";

// ✅ Importar iconos de FontAwesome
import {
  faSearch,
  faFilter,
  faInfoCircle,
  faBroom,
  faCogs,
  faFlask,
  faWrench,
  faTrash,
  faVial,
  faBuilding,
  faUserTie,
  faList,
  faFile,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const ListPolicies = () => {
  const [policy, setPolicy] = useState({}); // Estado para una póliza específica
  const [policies, setPolicies] = useState([]); // Estado para todas las pólizas
  const [modalType, setModalType] = useState(""); // Estado para controlar el tipo de modal
  const [showModal, setShowModal] = useState(false); // Estado para mostrar/ocultar modal
  const [types, setType] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [frequency, setFrequency] = useState([]);
  const [customers, setCustomer] = useState([]);
  const [advisor, setAdvisor] = useState([]);

  // ✅ Nuevos estados para el filtro de estado
  const [statusFilter, setStatusFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [advisorFilter, setAdvisorFilter] = useState("");
  const [typesFilter, setTypesFilter] = useState("");
  const itemsPerPage = 5; // Número de asesor por página
  //conseguir la poliza por id
  const getPolicyById = useCallback(async (policyId, type) => {
    try {
      const response = await http.get(`policy/get-policy-id/${policyId}`);
      console.log("poliza por id obtenida: ", response.data);
      if (response.data.status === "success") {
        console.log("poliza obtenida: ", response.data.policyById);
        // Póliza encontrada, la almacenamos en el estado
        setPolicy(response.data.policyById);
        setModalType(type); // Establece el tipo de modal a mostrar
        openModal(policyId);
        console.log("respuesta de la peticion: ", response.data.policyById);
      } else {
        alerts(
          "Error",
          "No existen póilza registrada con id " + policyId,
          "error"
        );
        console.error("Error fetching polizas:", response.message);
      }
    } catch (error) {
      //setError(error);
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching póilzas:", error);
    }
    return null; // Devuelve null en caso de error
  }, []);
  const getAllPolicies = useCallback(async () => {
    try {
      const response = await http.get("policy/get-all-policy");
      if (response.data.status === "success") {
        setPolicies(response.data.allPolicy);
        console.log("TODAS LAS POLIZAS: ", response.data.allPolicy);
      } else {
        //alerts("Error", "No existen póilzas  registradas", "error");
        console.error("Error fetching polizas:", response.message);
      }
    } catch (error) {
      //setError(error);
      //alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching póilzas:", error);
    }
  }, []);

  //metodo de prueba de registro de pago de poliza

  const registerPaymentTest = useCallback(async () => {
    try {
      const response = await http.post(`payment/manual-process-payments`);
      console.log("respuesta de la peticion: ", response.data);

      if (response.data.status === "success") {
        alerts("Pago registrado", response.data.message, "success");

        console.log("Pagos creados:", response.data.data.createdPayments); // Mostrar detalles
        // Actualizar inmediatamente después de procesar pagos
        getAllPolicies();

        // Programar otra actualización después de un breve retraso
        // para asegurarse de que los datos del servidor estén actualizados
        setTimeout(() => {
          getAllPolicies();
        }, 5000); // 5 segundos
      } else {
        alerts("Error", response.data.message, "error");
      }
    } catch (error) {
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error registering payment:", error);
    }
  }, []);

  // Abrir modal y obtener la póliza seleccionada
  const openModal = () => {
    setShowModal(true);
  };
  //closeModal para recibir un parámetro opcional de actualización

  const closeModal = async () => {
    setPolicy(null);
    setShowModal(false);
  };

  useEffect(() => {
    getAllPolicies();
  }, [getAllPolicies]);

  const fetchData = useCallback(async () => {
    try {
      // Cargar datos esenciales primero
      const [
        typeResponse,
        companyResponse, //ok
        frecuencyResponse,
        customerResponse,
        advisorResponse, //ok
      ] = await Promise.all([
        http.get("policy/get-types"),
        http.get("company/get-all-company"),
        http.get("policy/get-frecuency"),
        http.get("customers/get-all-customer"),
        http.get("advisor/get-all-advisor"),
      ]);

      setType(typeResponse.data?.allTypePolicy);
      setCompanies(companyResponse.data?.allCompanies);
      setFrequency(frecuencyResponse.data?.allFrecuency);
      setCustomer(customerResponse.data?.allCustomer);
      setAdvisor(advisorResponse.data?.allAdvisors);
    } catch (error) {
      console.error("Error cargando datos principales:", error);
      alerts(
        "Error",
        "Error cargando datos principales. Algunos endpoints pueden no estar disponibles.",
        "error"
      );
    }
  }, []); // ✅ Sin dependencias - solo se ejecuta una vez

  // ✅ useEffect solo llama a la función
  useEffect(() => {
    fetchData();
  }, [fetchData]); // ✅ fetchData como dependencia

  //actualizar el estado de las polizas reemplazando la polizas específica con los datos actualizados de la política
  const handlePolicyUpdated = (policyUpdated) => {
    if (!policyUpdated) return;

    console.log("Póliza actualizada recibida:", policyUpdated);

    // Actualizar la póliza en el array de pólizas
    setPolicies((prevPolicies) => {
      return prevPolicies.map((p) => {
        if (p.id === policyUpdated.id) {
          // Crear una copia actualizada de la póliza
          const updatedPolicy = {
            ...p,
            ...policyUpdated,
            // Mantener las referencias a objetos anidados
            customer: policyUpdated.customer || p.customer,
            company: policyUpdated.company || p.company,
            policyType: policyUpdated.policyType || p.policyType,
            policyStatus: policyUpdated.policyStatus || p.policyStatus,
            paymentMethod: policyUpdated.paymentMethod || p.paymentMethod,
            paymentFrequency:
              policyUpdated.paymentFrequency || p.paymentFrequency,
          };

          return updatedPolicy;
        }
        return p;
      });
    });

    // También actualizamos la póliza seleccionada si es necesario
    if (policy && policy.id === policyUpdated.id) {
      setPolicy({
        ...policy,
        ...policyUpdated,
        // Asegurarnos de que estos objetos anidados se actualicen correctamente
        customer: policyUpdated.customer || policy.customer,
        company: policyUpdated.company || policy.company,
        policyType: policyUpdated.policyType || policy.policyType,
        policyStatus: policyUpdated.policyStatus || policy.policyStatus,
        paymentMethod: policyUpdated.paymentMethod || policy.paymentMethod,
        paymentFrequency:
          policyUpdated.paymentFrequency || policy.paymentFrequency,
      });
    }

    // Forzar una recarga completa de las pólizas desde el servidor
    getAllPolicies();
  };

  // ✅ Agregar función para limpiar filtros
  const clearFilters = () => {
    setStatusFilter("");
    setCompanyFilter("");
    setAdvisorFilter("");
    setTypesFilter("");
    setQuery("");
  };

  // Usar el hook personalizado para la búsqueda
  const {
    query,
    setQuery,
    filteredItems: searchedPolicies,
  } = useSearch(policies, [
    "numberPolicy",
    "customer.ci_ruc",
    "customer.firstName",
    "customer.secondName",
    "customer.surname",
    "customer.secondSurname",
  ]);

  // ✅ Filtrado combinado (search + filtros)
  const filteredPolicy = useMemo(() => {
    let result = searchedPolicies;

    // Aplicar filtro por estado si está seleccionado
    if (statusFilter) {
      result = result.filter(
        (policy) => policy.policyStatus?.id == statusFilter
      );
    }
    // Aplicar filtro por compañía si está seleccionado
    if (companyFilter) {
      result = result.filter((policy) => policy.company?.id == companyFilter);
    }

    // Aplicar filtro por asesor si está seleccionado
    if (advisorFilter) {
      result = result.filter((policy) => policy.advisor?.id == advisorFilter);
    }

    if (typesFilter) {
      result = result.filter((policy) => policy.policyType?.id == typesFilter);
    }

    return result;
  }, [
    searchedPolicies,
    statusFilter,
    companyFilter,
    advisorFilter,
    typesFilter,
  ]);

  // Usar el hook personalizado para la paginación
  const {
    currentPage,
    currentItems: currentPolicies,
    totalPages,
    paginate,
  } = usePagination(filteredPolicy, itemsPerPage);

  // Generar números de página
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  dayjs.locale("es");

  return (
    <>
      <section>
        <div className="text-center py-2">
          <h2 className="py-2">Listado general de todas las pólizas</h2>

          {/* Header con información y controles */}
          <div className="row mb-4">
            {/* Total de pólizas */}
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body py-2">
                  <h5 className="card-title mb-1">
                    <FontAwesomeIcon icon={faFile} className="me-2" />
                    Total de pólizas
                  </h5>
                  <h3 className="mb-0">{policies.length}</h3>
                </div>
              </div>
            </div>

            {/* Buscador */}
            <div className="col-md-6 mb-3">
              <label htmlFor="nameQuery" className="form-label fw-bold">
                <FontAwesomeIcon icon={faSearch} className="me-2" />
                Buscar por número de póliza, cliente o cédula
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <FontAwesomeIcon icon={faSearch} />
                </span>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="nameQuery"
                  placeholder="Ingrese número de póliza, nombre o cédula..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Botón de pruebas (temporal) */}
            <div className="col-md-3">
              <div className="d-grid">
             
                <button
                  className="btn btn-danger d-none fw-bold"
                  onClick={() => registerPaymentTest()}
                >
                  <FontAwesomeIcon icon={faCogs} className="me-2" />
                  Registro manual de pagos (prueba)
                </button>
                <small className="text-dark fs-5 mb-2">
                  {filteredPolicy.length} póliza(s) encontrada(s)
                </small>

                <button
                  className="btn btn-secondary w-100"
                  onClick={clearFilters}
                >
                  <FontAwesomeIcon icon={faBroom} className="me-2" />
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>

          {/* Aquí irá la sección de filtros */}
          <div className="row mb-3">
            <div className="col-12">
              <div className="card">
                <div className="card-header bg-light">
                  <h5 className="mb-0">
                    <FontAwesomeIcon icon={faWrench} className="me-2" />
                    Filtros de búsqueda
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="form-label fw-bold">
                        <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                        Estado de póliza
                      </label>
                      <select
                        className="form-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        aria-label="select example"
                      >
                        <option value="">Todos los estados</option>
                        <option value="1">Activa</option>
                        <option value="2">Cancelada</option>
                        <option value="3">Culminada</option>
                        <option value="4">Por Culminar</option>
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label fw-bold">
                        <FontAwesomeIcon icon={faBuilding} className="me-2" />
                        Compañía
                      </label>
                      <select
                        className="form-select"
                        aria-label="select example"
                        value={companyFilter}
                        onChange={(e) => setCompanyFilter(e.target.value)}
                      >
                        <option value="">Todas las compañiás</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.companyName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label fw-bold ">
                        <FontAwesomeIcon icon={faUserTie} className="me-2" />
                        Asesor
                      </label>
                      <select
                        className="form-select"
                        value={advisorFilter}
                        onChange={(e) => setAdvisorFilter(e.target.value)}
                      >
                        {" "}
                        <option value="">Todos los asesores</option>
                        {advisor.map((item) => (
                          <option key={item.id} value={item.id}>
                            {`${item.firstName} ${item.secondName || ""} ${
                              item.surname
                            } ${item.secondSurname || ""}`.trim()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3 col-3">
                      <label
                        htmlFor="policy_type_id"
                        className="form-label fw-bold"
                      >
                        <FontAwesomeIcon icon={faList} className="me-2" />
                        Tipo
                      </label>
                      <select
                        className="form-select"
                        value={typesFilter}
                        onChange={(e) => setTypesFilter(e.target.value)}
                        aria-label="select example"
                      >
                        <option value="">Todos los tipos de póliza</option>
                        {types.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.policyName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla existente... */}
          <table className="table table-striped py-1">
            <thead>
              <tr>
                <th>N°</th>
                <th>Número de Póliza</th>
                <th colSpan="2" scope="row">
                  Cliente
                </th>
                <th>Compañía</th>
                <th>Tipo de Póliza</th>
                <th>Fecha de Inicio</th>
                <th>Fecha de Fin</th>
                {/*<th>Método de Pago</th>*/}

                <th>Frecuencia de Pago</th>
                <th>Monto de Cobertura</th>
                <th>Estado</th>

                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentPolicies.length === 0 ? (
                <tr>
                  <td colSpan="15" className="text-center">
                    Aun no hay pólizas registradas o no se encontraron resultados
                  </td>
                </tr>
              ) : (
                currentPolicies.map((policy, index) => (
                  <tr key={policy.id}>
                    <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td>{policy.numberPolicy}</td>
                    <td>
                      {policy.customer?.firstName}{" "}
                      {policy.customer?.secondName || " "}{" "}
                    </td>
                    <td>
                      {policy.customer?.surname}{" "}
                      {policy.customer?.secondSurname || " "}
                    </td>
                    <td>{policy.company?.companyName}</td>
                    <td>{policy.policyType?.policyName}</td>
                    <td>
                      {dayjs
                        .utc(policy.startDate)
                        .format("DD-MM-YYYY")
                        .toString()}
                    </td>
                    <td>
                      {dayjs
                        .utc(policy.endDate)
                        .format("DD-MM-YYYY")
                        .toString()}
                    </td>

                    {/* <td>{policy.paymentMethod?.methodName}</td>*/}

                    <td>{policy.paymentFrequency?.frequencyName}</td>
                    <td>{policy.coverageAmount}</td>
                    <td>
                      <span
                        className={`badge fw-bold fs-6 ${
                          policy.policyStatus?.id == 1
                            ? "bg-success" // ✅ Activa - Verde
                            : policy.policyStatus?.id == 2
                            ? "bg-danger" // ✅ Cancelada - Rojo
                            : policy.policyStatus?.id == 3
                            ? "bg-secondary" // ✅ Culminada - Gris
                            : policy.policyStatus?.id == 4
                            ? "bg-warning text-dark" // ✅ Por Culminar - Amarillo con texto oscuro
                            : "bg-light text-dark" // ✅ Default - Claro
                        }`}
                      >
                        {policy.policyStatus?.statusName}
                      </span>
                    </td>
                    <td className="d-flex gap-2">
                      <button
                        className="btn btn-info text-white fw-bold my-1 w-100"
                        onClick={() =>
                          getPolicyById(policy.id, "editPoliciesValues")
                        }
                      >
                        Ajustar valores
                      </button>
                      <button
                        className="btn btn-primary text-white fw-bold my-1 w-100"
                        onClick={() => getPolicyById(policy.id, "info")}
                      >
                        Ver info. Completa
                      </button>

                      <button
                        className="btn btn-success text-white fw-bold my-1 w-100"
                        onClick={() => getPolicyById(policy.id, "updatePolicy")}
                      >
                        Actualizar
                      </button>

                      {/*Identifica correctamente el último pago : 
                      Usando reduce() para encontrar el pago con el número más alto, independientemente del orden en el array.*/}
                      <button
                        className="btn btn-secondary text-white fw-bold my-1 w-100"
                        onClick={() => getPolicyById(policy.id, "renewal")}
                        disabled={
                          !policy.payments?.length ||
                          parseFloat(
                            policy.payments.reduce(
                              (latest, payment) =>
                                parseInt(payment.number_payment) >
                                parseInt(latest.number_payment)
                                  ? payment
                                  : latest,
                              policy.payments[0]
                            ).pending_value
                          ) > 0
                        }
                      >
                        Renovar póliza
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {filteredPolicy.length > itemsPerPage && (
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
        {policy && typeof policy === "object" && (
          // Renderiza el modal solo si policy tiene un valor
          <Modal
            isOpen={showModal}
            onClose={closeModal}
            policy={policy}
            modalType={modalType}
            onPolicyUpdated={handlePolicyUpdated}
          ></Modal>
        )}
      </section>
    </>
  );
};
export default ListPolicies;
