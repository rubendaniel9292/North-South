import { useCallback, useEffect, useState, useMemo, memo } from "react";
import Modal from "../../helpers/modal/Modal";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import dayjs from "dayjs";
import usePagination from "../../hooks/usePagination";
import useSearch from "../../hooks/useSearch";
import "dayjs/locale/es";
import useAuth from "../../hooks/useAuth";
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
  faAdjust,
  faEye,
  faEdit,
  faSync,
  faRedo,
  faFileContract,
  faUser,
  faCalendarAlt,
  faDollarSign,
  faCheckCircle,
  faMoneyBillWave,
  faBarcode
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// ✅ Constantes para estados de póliza
const POLICY_STATUS = {
  ACTIVE: "1",
  CANCELLED: "2",
  COMPLETED: "3",
  TO_COMPLETE: "4"
};

// ✅ Función utilitaria para mergear datos anidados
const mergeNestedData = (existing, updates) => ({
  ...existing,
  ...updates,
  customer: updates.customer || existing.customer,
  company: updates.company || existing.company,
  policyType: updates.policyType || existing.policyType,
  policyStatus: updates.policyStatus || existing.policyStatus,
  paymentMethod: updates.paymentMethod || existing.paymentMethod,
  paymentFrequency: updates.paymentFrequency || existing.paymentFrequency,
  payments: updates.payments || existing.payments,
  renewals: updates.renewals || existing.renewals,
});

const ListPolicies = memo(() => {
  const [policy, setPolicy] = useState({}); // Estado para una póliza específica
  const [policies, setPolicies] = useState([]); // Estado para todas las pólizas
  const [modalType, setModalType] = useState(""); // Estado para controlar el tipo de modal
  const [showModal, setShowModal] = useState(false); // Estado para mostrar/ocultar modal
  const [types, setType] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [advisor, setAdvisor] = useState([]);
  const { auth } = useAuth();

  // ✅ Estados para filtros
  const [statusFilter, setStatusFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [advisorFilter, setAdvisorFilter] = useState("");
  const [typesFilter, setTypesFilter] = useState("");
  const itemsPerPage = 5; // Número de elementos por página
  //conseguir la poliza por id
  const getPolicyById = useCallback(async (policyId, type) => {
    try {
      const response = await http.get(`policy/get-policy-id/${policyId}`);
      console.log("poliza por id obtenida: ", response.data);
      if (response.data.status === "success") {
        console.log("poliza obtenida: ", response.data.policyById);
        setPolicy(response.data.policyById);
        setModalType(type);
        openModal(policyId);
        console.log("respuesta de la peticion: ", response.data.policyById);
      } else {
        alerts(
          "Error",
          "No existe póliza registrada con id " + policyId,
          "error"
        );
        console.error("Error fetching polizas:", response.message);
      }
    } catch (error) {
      alerts("Error", "Error al cargar la información de la póliza", "error");
      console.error("Error fetching póilzas:", error);
    }
    return null;
  }, []);
  const getAllPolicies = useCallback(async () => {
    try {
      //const response = await http.get("policy/get-all-policy"); //RELACION `payments`, `renewals` (MUY LENTO Y ERROR DE MEMORY LEAK)
      const response = await http.get("/policy/get-all-policy-optimized"); //SIN RELACIION  `payments`, `renewals`
      if (response.data.status === "success") {
        setPolicies(response.data.allPolicy);
        console.log("TODAS LAS POLIZAS: ", response.data.allPolicy);
      } else {
        alerts("Error", "No se pudieron cargar las pólizas", "error");
        console.error("Error fetching polizas:", response.message);
      }
    } catch (error) {
      alerts("Error", "Error de conexión al cargar las pólizas", "error");
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

        // ✅ Actualizar inmediatamente y forzar recarga desde servidor
        await getAllPolicies();

        // Programar otra actualización después de un breve retraso
        // para asegurarse de que los datos del servidor estén actualizados
        setTimeout(async () => {
          await getAllPolicies();
        }, 2000);
      } else {
        alerts("Error", response.data.message, "error");
      }
    } catch (error) {
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error registering payment:", error);
    }
  }, [getAllPolicies]);

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
      // ✅ Cargar solo los datos que realmente se utilizan
      const [
        typeResponse,
        companyResponse,
        advisorResponse,
      ] = await Promise.all([
        http.get("policy/get-types"),
        http.get("company/get-all-company"),
        http.get("advisor/get-all-advisor"),
      ]);

      setType(typeResponse.data?.allTypePolicy);
      setCompanies(companyResponse.data?.allCompanies);
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

  // ✅ Actualizar el estado de las pólizas usando función utilitaria
  const handlePolicyUpdated = useCallback((policyUpdated) => {
    if (!policyUpdated) return;

    console.log("🔄 Póliza actualizada recibida:", policyUpdated);
    console.log("- ID:", policyUpdated.id);
    console.log("- Nuevo estado:", policyUpdated.policyStatus);

    // Actualizar inmediatamente la póliza en el estado local
    setPolicies((prevPolicies) => {
      const updatedPolicies = prevPolicies.map((p) => {
        if (p.id === policyUpdated.id) {
          const merged = mergeNestedData(p, policyUpdated);
          console.log("✅ Póliza actualizada localmente:", {
            id: merged.id,
            numberPolicy: merged.numberPolicy,
            oldStatus: p.policyStatus,
            newStatus: merged.policyStatus
          });
          return merged;
        }
        return p;
      });
      
      console.log("📊 Total pólizas después de actualización:", updatedPolicies.length);
      return updatedPolicies;
    });

    // También actualizamos la póliza seleccionada si es necesario
    if (policy && policy.id === policyUpdated.id) {
      setPolicy(prevPolicy => mergeNestedData(prevPolicy, policyUpdated));
      console.log("🎯 Póliza seleccionada también actualizada");
    }

    // Forzar recarga desde servidor como respaldo (reducido el tiempo)
    setTimeout(async () => {
      console.log("🔄 Recargando pólizas desde servidor...");
      await getAllPolicies();
    }, 300); // ✅ Reducido de 500ms a 300ms
  }, [policy, getAllPolicies]);

  // ✅ función para limpiar filtros
  const clearFilters = () => {
    setStatusFilter("");
    setCompanyFilter("");
    setAdvisorFilter("");
    setTypesFilter("");
    setQuery("");
  };
  
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

  // ✅ Filtrado combinado mejorado con comparaciones estrictas y debugging
  const filteredPolicy = useMemo(() => {
    let result = searchedPolicies;
    
    console.log("🔍 Aplicando filtros:");
    console.log("- Pólizas base:", searchedPolicies.length);
    console.log("- statusFilter:", statusFilter, typeof statusFilter);
    console.log("- companyFilter:", companyFilter, typeof companyFilter);
    console.log("- advisorFilter:", advisorFilter, typeof advisorFilter);
    console.log("- typesFilter:", typesFilter, typeof typesFilter);

    // Aplicar filtro por estado si está seleccionado
    if (statusFilter) {
      const beforeCount = result.length;
      result = result.filter((policy) => {
        const policyStatusId = policy.policyStatus?.id;
        const filterValue = statusFilter;
        // ✅ Convertir ambos valores a string para comparación consistente
        const matches = String(policyStatusId) === String(filterValue);
        
        if (!matches) {
          console.log(`❌ Póliza ${policy.numberPolicy}: statusId=${policyStatusId} (${typeof policyStatusId}) !== filter=${filterValue} (${typeof filterValue})`);
        }
        
        return matches;
      });
      console.log(`- Después filtro estado: ${beforeCount} → ${result.length}`);
    }
    
    // Aplicar filtro por compañía si está seleccionado
    if (companyFilter) {
      const beforeCount = result.length;
      result = result.filter((policy) => {
        const companyId = policy.company?.id;
        return String(companyId) === String(companyFilter);
      });
      console.log(`- Después filtro compañía: ${beforeCount} → ${result.length}`);
    }

    // Aplicar filtro por asesor si está seleccionado
    if (advisorFilter) {
      const beforeCount = result.length;
      result = result.filter((policy) => {
        const advisorId = policy.advisor?.id;
        return String(advisorId) === String(advisorFilter);
      });
      console.log(`- Después filtro asesor: ${beforeCount} → ${result.length}`);
    }

    if (typesFilter) {
      const beforeCount = result.length;
      result = result.filter((policy) => {
        const typeId = policy.policyType?.id;
        return String(typeId) === String(typesFilter);
      });
      console.log(`- Después filtro tipo: ${beforeCount} → ${result.length}`);
    }

    console.log("✅ Resultado final filtrado:", result.length, "pólizas");
    
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

  // Función para obtener la fecha del próximo pago pendiente


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
            <div className="col-md-3 mb-3" >
              <div className="d-grid">
                {/* Botón para registro manual de pagos (solo para pruebas) 
                <button
                  className="btn btn-danger fw-bold"
                  onClick={() => registerPaymentTest()}
                >
                  <FontAwesomeIcon icon={faCogs} className="me-2" />
                  Registro manual de pagos (prueba)
                </button>
                <small className="text-dark fs-5 mb-2">
                  {filteredPolicy.length} póliza(s) encontrada(s)
                </small>
*/}
                <button
                  className="btn btn-secondary w-100 mb-2"
                  onClick={clearFilters}
                >
                  <FontAwesomeIcon icon={faBroom} className="me-2" />
                  Limpiar filtros
                </button>
              
              </div>
            </div>
          </div>

          {/* la sección de filtros */}
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
                        aria-label="Filtrar por estado de póliza"
                        id="statusFilter"
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
                        aria-label="Filtrar por compañía"
                        value={companyFilter}
                        onChange={(e) => setCompanyFilter(e.target.value)}
                        id="companyFilter"
                      >
                        <option value="">Todas las compañías</option>
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
                        aria-label="Filtrar por asesor"
                        id="advisorFilter"
                      >
                        <option value="">Todos los asesores</option>
                        {advisor.map((item) => (
                          <option key={item.id} value={item.id}>
                            {`${item.firstName} ${item.secondName || ""} ${item.surname
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
                        aria-label="Filtrar por tipo de póliza"
                        id="typesFilter"
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
                <th>
                  <FontAwesomeIcon icon={faBarcode} className="me-2" />
                  Número de Póliza
                </th>
                <th colSpan="2" scope="row">
                  <FontAwesomeIcon icon={faUser} className="me-2" />
                  Cliente
                </th>
                <th>
                  <FontAwesomeIcon icon={faBuilding} className="me-2" />
                  Compañía
                </th>
                <th>
                  <FontAwesomeIcon icon={faFileContract} className="me-2" />
                  Tipo de Póliza
                </th>
                <th>
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  Fecha de Inicio
                </th>
                <th>
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  Fecha de Fin
                </th>
                {/*<th>Método de Pago</th>*/}

                <th>
                  <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                  Frecuencia de Pago
                </th>
                <th>
                  <FontAwesomeIcon icon={faDollarSign} className="me-2" />
                  Monto de Cobertura
                </th>
                <th>
                  <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                  Estado
                </th>

                <th>
                  <FontAwesomeIcon icon={faCogs} className="me-2" />
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {currentPolicies.length === 0 ? (
                <tr>
                  <td colSpan="15" className="text-center">
                    Aun no hay pólizas registradas o no se encontraron
                    resultados
                  </td>
                </tr>
              ) : (
                currentPolicies.map((policy, index) => (
                  <tr key={policy.id}>

                    <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td>{policy.numberPolicy}</td>
                    <td>
                      {policy.customer
                        ? `${policy.customer.firstName || ''} ${policy.customer.secondName || ''}`.trim() || 'N/A'
                        : 'Cliente no disponible'
                      }
                    </td>
                    <td>
                      {policy.customer
                        ? `${policy.customer.surname || ''} ${policy.customer.secondSurname || ''}`.trim() || 'N/A'
                        : 'Cliente no disponible'
                      }
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
                        className={`badge fw-bold fs-6 ${policy.policyStatus?.id == POLICY_STATUS.ACTIVE
                          ? "bg-success text-white" // ✅ Activa - Verde
                          : policy.policyStatus?.id == POLICY_STATUS.CANCELLED
                            ? "bg-danger text-white" // ✅ Cancelada - Rojo
                            : policy.policyStatus?.id == POLICY_STATUS.COMPLETED
                              ? "bg-secondary text-white" // ✅ Culminada - Gris
                              : policy.policyStatus?.id == POLICY_STATUS.TO_COMPLETE
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
                        aria-label={`Ajustar valores de póliza ${policy.numberPolicy}`}
                        title="Ajustar valores de la póliza"
                      >
                        <FontAwesomeIcon icon={faAdjust} className="me-2" />
                        Ajustar valores
                      </button>
                      <button
                        className="btn btn-primary text-white fw-bold my-1 w-100"
                        onClick={() => getPolicyById(policy.id, "info")}
                        aria-label={`Ver información completa de póliza ${policy.numberPolicy}`}
                        title="Ver información completa de la póliza"
                      >
                        <FontAwesomeIcon icon={faEye} className="me-2" />
                        Ver info. Completa
                      </button>
                      {auth?.role !== "ELOPDP" && (
                        <>
                          <button
                            className="btn btn-success text-white fw-bold my-1 w-100"
                            onClick={() => getPolicyById(policy.id, "updatePolicy")}
                            aria-label={`Actualizar póliza ${policy.numberPolicy}`}
                            title="Actualizar información de la póliza"
                          >
                            <FontAwesomeIcon icon={faEdit} className="me-2" />
                            Actualizar
                          </button>

                          {/*Identifica correctamente el último pago : 
                      Usando reduce() para encontrar el pago con el número más alto, independientemente del orden en el array.*/}
                          <button
                            className="btn btn-secondary text-white fw-bold my-1 w-100"
                            onClick={() => getPolicyById(policy.id, "renewal")}
                            aria-label={`Renovar póliza ${policy.numberPolicy}`}
                            title="Renovar póliza para el siguiente período"
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
                            <FontAwesomeIcon icon={faRedo} className="me-2" />
                            Renovar póliza
                          </button>
                        </>
                      )}

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
});

export default ListPolicies;
