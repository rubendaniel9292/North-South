import { useCallback, useEffect, useState, useMemo, memo } from "react";
import Swal from "sweetalert2";

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
  faInfoCircle,
  faBroom,
  faCogs,
  faWrench,
  faBuilding,
  faUserTie,
  faList,
  faFile,
  faAdjust,
  faEye,
  faEdit,
  faRedo,
  faFileContract,
  faUser,
  faCalendarAlt,
  faDollarSign,
  faCheckCircle,
  faMoneyBillWave,
  faBarcode,
  faCalendarTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// ✅ Constantes para estados de póliza
const POLICY_STATUS = {
  ACTIVE: "1",
  CANCELLED: "2",
  COMPLETED: "3",
  TO_COMPLETE: "4",
};

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
  const [isRepairingPeriods, setIsRepairingPeriods] = useState(false); // Estado para reparación masiva
  const [isFixingDates, setIsFixingDates] = useState(false); // Estado para corrección de fechas inconsistentes
  const itemsPerPage = 7; // Número de elementos por página
  //conseguir la poliza por id
  const getPolicyById = useCallback(async (policyId, type) => {
    try {
      const response = await http.get(`policy/get-policy-id/${policyId}`);

      if (response.data.status === "success") {
        console.log("poliza obtenida: ", response.data.policyById);
        setPolicy(response.data.policyById);
        setModalType(type);
        openModal(policyId);
      } else {
        alerts(
          "Error",
          "No existe póliza registrada con id " + policyId,
          "error",
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

  // 🔧 Función para reparar periodos faltantes (SOLO ADMIN)
  const repairMissingPeriods = useCallback(async () => {
    if (auth?.role !== "ADMIN") {
      alerts(
        "Acceso Denegado",
        "Solo los administradores pueden ejecutar esta operación",
        "error",
      );
      return;
    }

    const confirmResult = await alerts(
      "Confirmar Reparación Masiva",
      "⚠️ Esta operación revisará TODAS las pólizas del sistema y creará los periodos faltantes. ¿Desea continuar?",
      "warning",
      true,
    );

    if (!confirmResult.isConfirmed) return;

    setIsRepairingPeriods(true);
    try {
      const response = await http.post("policy/repair-all-missing-periods");

      if (response.data.status === "success") {
        const { summary } = response.data;

        await alerts(
          "Reparación Completada",
          `✅ Reparación exitosa:\n
          📋 Pólizas revisadas: ${summary.totalPoliciesReviewed}
          🔧 Pólizas con periodos faltantes: ${summary.policiesWithMissingPeriods}
          ➕ Periodos creados: ${summary.totalPeriodsCreated}`,
          "success",
        );

        // Recargar todas las pólizas para reflejar los cambios
        await getAllPolicies();
      } else {
        alerts(
          "Error",
          response.data.message || "No se pudo completar la reparación",
          "error",
        );
      }
    } catch (error) {
      console.error("Error reparando periodos:", error);
      alerts(
        "Error",
        error.response?.data?.message || "Error al reparar periodos faltantes",
        "error",
      );
    } finally {
      setIsRepairingPeriods(false);
    }
  }, [auth, getAllPolicies]);

  // 🗓️ Función para reparar fechas inconsistentes en pagos (días 29/30/31)
  const fixInconsistentDates = useCallback(async () => {
    if (auth?.role !== "ADMIN") {
      alerts(
        "Acceso Denegado",
        "Solo los administradores pueden ejecutar esta operación",
        "error",
      );
      return;
    }

    const confirmResult = await alerts(
      "Confirmar corrección de fechas",
      "⚠️ Esta operación buscará pólizas con pagos en días incorrectos (29/30/31) y corregirá las fechas inconsistentes. ¿Desea continuar?",
      "warning",
      { showCancelButton: true, confirmButtonText: "Sí, corregir", cancelButtonText: "Cancelar" },
    );

    if (!confirmResult.isConfirmed) return;

    setIsFixingDates(true);
    try {
      const response = await http.post("policy/rebuild-all-inconsistent-payment-dates");

      if (response.data.status === "success" || response.status === 200 || response.status === 201) {
        const data = response.data?.result ?? response.data;
        const {
          totalPoliciesFound = 0,
          totalPoliciesFixed = 0,
          totalPaymentsCorrected = 0,
          details = [],
          errors = [],
        } = data;

        const detailsHtml =
          details.length > 0
            ? `<div style="max-height:260px;overflow-y:auto;margin-top:10px">
                <table style="width:100%;border-collapse:collapse;font-size:13px">
                  <thead>
                    <tr style="background:#343a40;color:white">
                      <th style="padding:6px 8px;text-align:left">Póliza</th>
                      <th style="padding:6px 4px">Día esperado</th>
                      <th style="padding:6px 4px">Pagos corregidos</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${details
                      .map(
                        (d) =>
                          `<tr style="border-bottom:1px solid #dee2e6">
                            <td style="padding:5px 8px;font-weight:600">${d.numberPolicy}</td>
                            <td style="text-align:center;padding:5px 4px">${d.expectedDay}</td>
                            <td style="text-align:center;padding:5px 4px;color:#198754;font-weight:600">${d.paymentsCorrected}</td>
                          </tr>`,
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>`
            : `<p style="color:#6c757d;margin-top:10px">No se encontraron pólizas con inconsistencias para corregir.</p>`;

        const errorsHtml =
          errors.length > 0
            ? `<div style="margin-top:12px;text-align:left">
                <b style="color:#dc3545">⚠️ Errores (${errors.length}):</b>
                <ul style="font-size:12px;margin-top:6px">
                  ${errors.map((e) => `<li>Póliza ID ${e.policyId}: ${e.error}</li>`).join("")}
                </ul>
              </div>`
            : "";

        await Swal.fire({
          title: "Corrección de fechas completada",
          icon: totalPoliciesFixed > 0 ? "success" : "info",
          width: 620,
          html: `
            <div style="text-align:left">
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px">
                <div style="background:#d1ecf1;border-radius:8px;padding:10px">
                  <div style="font-size:12px;color:#0c5460">Pólizas encontradas</div>
                  <div style="font-size:22px;font-weight:700;color:#0c5460">${totalPoliciesFound}</div>
                </div>
                <div style="background:#d4edda;border-radius:8px;padding:10px">
                  <div style="font-size:12px;color:#155724">Pólizas corregidas</div>
                  <div style="font-size:22px;font-weight:700;color:#155724">${totalPoliciesFixed}</div>
                </div>
                <div style="background:#fff3cd;border-radius:8px;padding:10px">
                  <div style="font-size:12px;color:#856404">Pagos corregidos</div>
                  <div style="font-size:22px;font-weight:700;color:#856404">${totalPaymentsCorrected}</div>
                </div>
              </div>
              <b>Detalle por póliza:</b>
              ${detailsHtml}
              ${errorsHtml}
            </div>
          `,
        });

        if (totalPoliciesFixed > 0) {
          await getAllPolicies();
        }
      } else {
        alerts(
          "Error",
          response.data?.message || "No se pudo completar la corrección de fechas",
          "error",
        );
      }
    } catch (error) {
      console.error("Error corrigiendo fechas inconsistentes:", error);
      alerts(
        "Error",
        error.response?.data?.message || "Error al corregir fechas inconsistentes",
        "error",
      );
    } finally {
      setIsFixingDates(false);
    }
  }, [auth, getAllPolicies]);

  //metodo de prueba de registro de pago de poliza

  const registerPaymentTest = useCallback(async (createFuture = false) => {
    try {
      // Agregar el query parameter si createFuture es true
      const url = createFuture
        ? `payment/manual-process-payments?createFuture=true`
        : `payment/manual-process-payments`;

      const response = await http.post(url);
      console.log("respuesta de la peticion: ", response.data);

      if (response.data.status === "success") {
        alerts("Pago registrado", response.data.message, "success");
        console.log("Pagos creados:", response.data.data.createdPayments);

        // ✅ Recargar todas las pólizas desde el servidor con los pagos actualizados
        const policiesResponse = await http.get(
          "/policy/get-all-policy-optimized",
        );

        if (policiesResponse.data.status === "success") {
          // Forzar actualización completa del estado con nuevas referencias
          setPolicies(policiesResponse.data.allPolicy);
          console.log("✅ Todas las pólizas actualizadas desde el servidor");
        }
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
      // ✅ Cargar solo los datos que realmente se utilizan
      const [typeResponse, companyResponse, advisorResponse] =
        await Promise.all([
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
        "error",
      );
    }
  }, []); // ✅ Sin dependencias - solo se ejecuta una vez

  // ✅ useEffect solo llama a la función
  useEffect(() => {
    fetchData();
  }, [fetchData]); // ✅ fetchData como dependencia

  // ✅ Actualizar el estado de las pólizas usando función utilitaria
  const handlePolicyUpdated = useCallback(
    (policyUpdated) => {
      if (!policyUpdated) return;

      console.log("🔄 Póliza actualizada recibida:", policyUpdated);
      console.log("- ID:", policyUpdated.id);
      console.log("- Pagos recibidos:", policyUpdated.payments?.length);

      // Extraer solo el último pago si existe
      const freshPolicy = { ...policyUpdated };
      if (freshPolicy.payments && freshPolicy.payments.length > 0) {
        const lastPayment = freshPolicy.payments.reduce(
          (latest, payment) =>
            parseInt(payment.number_payment || 0) >
              parseInt(latest.number_payment || 0)
              ? payment
              : latest,
          freshPolicy.payments[0],
        );
        freshPolicy.payments = [lastPayment]; // Solo mantener el último pago

        console.log("📥 Último pago extraído:", {
          number_payment: lastPayment.number_payment,
          pending_value: lastPayment.pending_value,
        });
      }

      // Actualizar inmediatamente la póliza en el estado local con datos frescos
      setPolicies((prevPolicies) => {
        const updatedPolicies = prevPolicies.map((p) => {
          if (p.id === policyUpdated.id) {
            console.log("✅ Póliza actualizada localmente:", {
              id: freshPolicy.id,
              numberPolicy: freshPolicy.numberPolicy,
              lastPaymentPending: freshPolicy.payments?.[0]?.pending_value,
            });
            return freshPolicy;
          }
          return p;
        });

        console.log(
          "📊 Total pólizas después de actualización:",
          updatedPolicies.length,
        );
        return updatedPolicies;
      });

      // También actualizamos la póliza seleccionada si es necesario
      if (policy && policy.id === policyUpdated.id) {
        setPolicy(freshPolicy);
        console.log("🎯 Póliza seleccionada también actualizada");
      }
    },
    [policy],
  );

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
    /*
        console.log("🔍 Aplicando filtros:");
        console.log("- Pólizas base:", searchedPolicies.length);
        console.log("- statusFilter:", statusFilter, typeof statusFilter);
        console.log("- companyFilter:", companyFilter, typeof companyFilter);
        console.log("- advisorFilter:", advisorFilter, typeof advisorFilter);
        console.log("- typesFilter:", typesFilter, typeof typesFilter);
    */
    // Aplicar filtro por estado si está seleccionado
    if (statusFilter) {
      const beforeCount = result.length;
      result = result.filter((policy) => {
        const policyStatusId = policy.policyStatus?.id;
        const filterValue = statusFilter;
        // ✅ Convertir ambos valores a string para comparación consistente
        const matches = String(policyStatusId) === String(filterValue);

        if (!matches) {
          console.log(
            `❌ Póliza ${policy.numberPolicy}: statusId=${policyStatusId} (${typeof policyStatusId}) !== filter=${filterValue} (${typeof filterValue})`,
          );
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
      console.log(
        `- Después filtro compañía: ${beforeCount} → ${result.length}`,
      );
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

            {/* Botones de acción */}
            <div className="col-md-3 mb-3">
              <div className="d-grid gap-2">
                {/* 🔧 Botón de reparación masiva de periodos (SOLO ADMIN) */}
                {auth?.role === "ADMIN" && (
                  <>
                    <button
                      className="btn btn-warning fw-bold"
                      onClick={repairMissingPeriods}
                      disabled={isRepairingPeriods}
                    >
                      <FontAwesomeIcon
                        icon={isRepairingPeriods ? faCogs : faWrench}
                        className={`me-2 ${isRepairingPeriods ? "fa-spin" : ""}`}
                      />
                      {isRepairingPeriods ? "Reparando..." : "Reparar Periodos"}
                    </button>

                    {/* 🗓️ Botón para corregir fechas inconsistentes (días 29/30/31) */}
                    <button
                      className="btn btn-warning fw-bold"
                      onClick={fixInconsistentDates}
                      disabled={isFixingDates}
                      title="Corrige pagos con fechas inconsistentes en pólizas con día de inicio 29, 30 o 31"
                    >
                      <FontAwesomeIcon
                        icon={isFixingDates ? faCogs : faCalendarTimes}
                        className={`me-2 ${isFixingDates ? "fa-spin" : ""}`}
                      />
                      {isFixingDates ? "Corrigiendo..." : "Reparar fechas inconsistentes"}
                    </button>
                  </>
                )}

                { //Botón para registro manual de pagos (solo para pruebas)

                  <button
                    className="btn btn-danger fw-bold"
                    onClick={() => registerPaymentTest(true)}
                  >
                    <FontAwesomeIcon icon={faCogs} className="me-2" />
                    Registro manual de pagos (prueba)
                  </button>

                }
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
                        ? `${policy.customer.firstName || ""} ${policy.customer.secondName || ""}`.trim() ||
                        "N/A"
                        : "Cliente no disponible"}
                    </td>
                    <td>
                      {policy.customer
                        ? `${policy.customer.surname || ""} ${policy.customer.secondSurname || ""}`.trim() ||
                        "N/A"
                        : "Cliente no disponible"}
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
                            : policy.policyStatus?.id ==
                              POLICY_STATUS.COMPLETED
                              ? "bg-secondary text-white" // ✅ Culminada - Gris
                              : policy.policyStatus?.id ==
                                POLICY_STATUS.TO_COMPLETE
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
                            onClick={() =>
                              getPolicyById(policy.id, "updatePolicy")
                            }
                            aria-label={`Actualizar póliza ${policy.numberPolicy}`}
                            title="Actualizar información de la póliza"
                          >
                            <FontAwesomeIcon icon={faEdit} className="me-2" />
                            Actualizar
                          </button>

                          {/* ✅ Verifica que el ÚLTIMO pago tenga pending_value = 0 */}

                          <button
                            className="btn btn-secondary text-white fw-bold my-1 w-100"
                            onClick={() => getPolicyById(policy.id, "renewal")}
                            aria-label={`Renovar póliza ${policy.numberPolicy}`}
                            title="Renovar póliza para el siguiente período"
                            disabled={(() => {
                              // Verificar que la póliza esté activa
                              if (
                                policy.policyStatus?.id !== POLICY_STATUS.ACTIVE
                              )
                                return true;

                              if (!policy.payments?.length) return true;

                              const lastPayment = policy.payments.reduce(
                                (latest, payment) =>
                                  parseInt(payment.number_payment || 0) >
                                    parseInt(latest.number_payment || 0)
                                    ? payment
                                    : latest,
                                policy.payments[0],
                              );

                              // Capturar el saldo pendiente con múltiples variaciones de nombres de campo
                              const pendingValue = parseFloat(
                                lastPayment.pending_value ??
                                lastPayment.pendingValue ??
                                0,
                              );

                              // Habilitar si saldo pendiente es <= 0.10
                              return pendingValue > 0.1;
                            })()}
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
