import PropTypes from "prop-types";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  faRectangleXmark,
  faFloppyDisk,
  faTags,
  faHashtag,
  faCreditCard,
  faDollarSign,
  faCalendarAlt,
  faFileAlt,
  faMoneyBillWave
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import http from "../../helpers/Http";
import UserForm from "../../hooks/UserForm";
import alerts from "../../helpers/Alerts";
import { saveSelectedPolicies } from "../../helpers/localStorageUtils";
import {
  calculateTotalAdvisorCommissionsGenerated,
  calculateReleasedCommissions,
  getAdvisorTotalAdvances,
  applyHistoricalAdvance,
  distributeAdvance,
  getPolicyFields,
  getTotals,
} from "../../helpers/CommissionUtils";

// 1. COMPONENTE PRINCIPAL
const RegisterAdvanceModal = ({ advisorId, onClose, refreshAdvisor }) => {
  // 2. VALIDACIÓN DE PROPS INICIALES
  if (!advisorId) {
    console.error("advisorId es undefined en RegisterAdvanceModal");
    return null;
  }

  // Badge Bootstrap helper
  const Badge = ({ text, color = "secondary" }) => (
    <span className={`badge rounded-pill fw-bold fs-6 bg-${color}`}>{text}</span>
  );

  // 3. ESTADOS PRINCIPALES
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState([]);
  const [advanceValue, setAdvanceValue] = useState("");
  const { form, changed } = UserForm({
    advisor_id: advisorId.id,
    policy_id: advisorId.policies?.id || null,
    advanceAmount: "",
  });
  const [operationType, setOperationType] = useState(""); // ANTICIPO o COMISION
  const [selectedPolicies, setSelectedPolicies] = useState([]); // pólizas seleccionadas
  const advanceValueRef = useRef(null);

  // NUEVO: Estados para filtrado avanzado
  const [filterMode, setFilterMode] = useState(""); // "", "TODAS", "POR_CLIENTE", "POR_POLIZA"
  const [customers, setCustomers] = useState([]); // Clientes únicos del asesor
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [policySearch, setPolicySearch] = useState("");
  const [selectedPolicyId, setSelectedPolicyId] = useState(""); // Para el select de pólizas
  const [policiesList, setPoliciesList] = useState([]); // Lista básica de pólizas para dropdown

  // 4. CALCULAR ANTICIPOS TOTALES DEL ASESOR (helper)
  const advisorTotalAdvances = useMemo(
    () => getAdvisorTotalAdvances(advisorId),
    [advisorId]
  );

  // 5. MEMOIZAR POLIZAS CON ANTICIPO HISTÓRICO APLICADO
  const policiesWithFavor = useMemo(
    () => {
      // Si hay pólizas seleccionadas, devolverlas directamente SIN filtrar por saldo
      // El filtro de saldo solo debe aplicarse al REGISTRAR, no al MOSTRAR
      return selectedPolicies;
    },
    [selectedPolicies]
  );

  // 6. DISTRIBUIR EL VALOR ACTUAL DEL FORMULARIO ENTRE LAS POLIZAS
  const distributedPolicies = useMemo(
    () => {
      if (policiesWithFavor.length === 0) return [];

      const withHistorical = applyHistoricalAdvance(policiesWithFavor, advisorTotalAdvances);
      const afterDistribute = distributeAdvance(withHistorical, advanceValue);

      return afterDistribute.map((policy) => ({
        ...policy,
        ...getPolicyFields(policy),
      }));
    },
    [policiesWithFavor, advanceValue, advisorTotalAdvances]
  );

  // 7. LIMPIAR LOCALSTORAGE AL ABRIR MODAL (para evitar pólizas antiguas sin saldo)
  useEffect(() => {
    if (advisorId?.id) {
      // Limpiar siempre al abrir para evitar datos obsoletos
      localStorage.removeItem(`selectedPolicies_${advisorId.id}`);
      setSelectedPolicies([]);
    }
  }, [advisorId]);

  // 8. GUARDAR SELECCIÓN EN LOCALSTORAGE AL CAMBIAR
  useEffect(() => {
    if (advisorId?.id) saveSelectedPolicies(advisorId.id, selectedPolicies);
  }, [selectedPolicies, advisorId]);

  // NUEVO: Cargar pólizas bajo demanda según filtros
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
  const [loadedPolicies, setLoadedPolicies] = useState([]);

  // 9. CARGAR PÓLIZAS BAJO DEMANDA MEDIANTE API OPTIMIZADA
  /*
  useEffect(() => {
    const loadPolicies = async () => {
      const shouldLoad = operationType === "COMISION" && (
        filterMode === "TODAS" ||
        (filterMode === "POR_CLIENTE" && selectedCustomerId) ||
        (filterMode === "POR_POLIZA" && (policySearch || selectedPolicyId))
      );

      if (shouldLoad) {
        setIsLoadingPolicies(true);

        try {
          // Construir parámetros para el endpoint optimizado
          const params = new URLSearchParams();
          params.append('page', '1');
          params.append('limit', '1000'); // Límite alto para obtener todas las que coincidan

          if (filterMode === "POR_CLIENTE" && selectedCustomerId) {
            params.append('customerId', selectedCustomerId);
          } else if (filterMode === "POR_POLIZA") {
            if (selectedPolicyId && selectedPolicyId !== "TODAS") {
              params.append('policyId', selectedPolicyId);
            } else if (policySearch) {
              params.append('search', policySearch);
            }
          }

          // Usar el endpoint optimizado que ya tienes
          const response = await http.get(
            `advisor/get-advisor-optimized/${advisorId.id}?${params.toString()}`
          );

          if (response.data && response.data.advisorById && response.data.advisorById.policies) {
            const loadedPolicies = response.data.advisorById.policies;

            // Filtrar solo pólizas con comisiones a favor > 0.01 (mínimo 1 centavo)
            const policiesWithBalance = loadedPolicies.filter((policy) => {
              const released = calculateReleasedCommissions(policy);
              const total = calculateTotalAdvisorCommissionsGenerated(policy);
              const paid = Array.isArray(policy.commissions)
                ? policy.commissions.reduce(
                  (sum, payment) => sum + (Number(payment.advanceAmount) || 0),
                  0
                )
                : 0;
              const maxReleased = Math.min(released, total);
              const balance = maxReleased - paid;

              // Filtrar solo pólizas con saldo real a favor (mínimo 1 centavo)
              return balance > 0.01; // Excluye balances menores a $0.01 por redondeo
            });

            setSelectedPolicies(policiesWithBalance);
          } else {
            setSelectedPolicies([]);
          }
        } catch (error) {
          console.error("Error cargando pólizas:", error);
          alerts("Error", "No se pudieron cargar las pólizas. Intenta nuevamente.", "error");
          setSelectedPolicies([]);
        }

        setIsLoadingPolicies(false);
      } else if (operationType === "ANTICIPO") {
        setSelectedPolicies([]);
        setFilterMode("");
        // Limpiar localStorage cuando cambia a ANTICIPO
        if (advisorId?.id) {
          localStorage.removeItem(`selectedPolicies_${advisorId.id}`);
        }
      } else {
        setSelectedPolicies([]);
      }
    };

    loadPolicies();
  }, [operationType, advisorId.id, filterMode, selectedCustomerId, policySearch, selectedPolicyId]);
*/
  useEffect(() => {
    const loadPolicies = async () => {
      const shouldLoad = operationType === "COMISION" && (
        filterMode === "TODAS" ||
        (filterMode === "POR_CLIENTE" && selectedCustomerId) ||
        (filterMode === "POR_POLIZA" && (policySearch || selectedPolicyId))
      );

      if (shouldLoad) {
        setIsLoadingPolicies(true);

        try {
          // Construir parámetros para el endpoint optimizado
          const params = new URLSearchParams();
          params.append('page', '1');
          params.append('limit', '50'); // ✅ REDUCIR de 1000 a 100 para evitar colapso

          if (filterMode === "POR_CLIENTE" && selectedCustomerId) {
            params.append('customerId', selectedCustomerId);
          } else if (filterMode === "POR_POLIZA") {
            if (selectedPolicyId && selectedPolicyId !== "TODAS") {
              params.append('policyId', selectedPolicyId);
            } else if (policySearch) {
              params.append('search', policySearch);
            }
          }

          // Usar el endpoint optimizado CON FILTROS
          const response = await http.get(
            `advisor/get-advisor-optimized/${advisorId.id}?${params.toString()}`
          );

          if (response.data && response.data.advisorById && response.data.advisorById.policies) {
            const loadedPolicies = response.data.advisorById.policies;

            // Filtrar solo pólizas con comisiones a favor > 0.01
            const policiesWithBalance = loadedPolicies.filter((policy) => {
              const released = calculateReleasedCommissions(policy);
              const total = calculateTotalAdvisorCommissionsGenerated(policy);
              const paid = Array.isArray(policy.commissions)
                ? policy.commissions.reduce(
                  (sum, payment) => sum + (Number(payment.advanceAmount) || 0),
                  0
                )
                : 0;
              const maxReleased = Math.min(released, total);
              const balance = maxReleased - paid;

              return balance > 0.01;
            });

            console.log('✅ Pólizas filtradas con saldo:', policiesWithBalance.length);
            console.log('📋 Pólizas:', policiesWithBalance.map(p => p.numberPolicy));

            setSelectedPolicies(policiesWithBalance);
          } else {
            setSelectedPolicies([]);
          }
        } catch (error) {
          console.error("Error cargando pólizas:", error);
          alerts("Error", "No se pudieron cargar las pólizas. Intenta nuevamente.", "error");
          setSelectedPolicies([]);
        }

        setIsLoadingPolicies(false);
      } else if (operationType === "ANTICIPO") {
        setSelectedPolicies([]);
        setFilterMode("");
        if (advisorId?.id) {
          localStorage.removeItem(`selectedPolicies_${advisorId.id}`);
        }
      } else {
        setSelectedPolicies([]);
      }
    };

    loadPolicies();
  }, [operationType, advisorId.id, filterMode, selectedCustomerId, policySearch, selectedPolicyId]);
  // 10. REMOVER POLIZA DE LA SELECCIÓN
  const removePolicy = useCallback((policyId) => {
    setSelectedPolicies((prev) =>
      prev.filter((policy) => policy.id !== policyId)
    );
  }, []);

  // 11. FUNCION PARA OBTENER CAMPOS DE POLIZA (PASADA AL HELPER)
  const policyFieldsHelper = useCallback(
    (policy) => getPolicyFields(policy),
    []
  );

  // 12. OBTENER TOTALES GLOBALES USANDO EL HELPER
  const globalTotals = useMemo(
    () =>
      getTotals(
        distributedPolicies,
        advanceValue,
        operationType,
        policyFieldsHelper
      ),
    [distributedPolicies, advanceValue, operationType, policyFieldsHelper]
  );

  // 13. CARGAR MÉTODOS DE PAGO, CLIENTES Y PÓLIZAS BÁSICAS
  /*
  const fetchData = useCallback(async () => {
    try {
      const paymentMethodResponse = await http.get("policy/get-payment-method");
      setPaymentMethod(paymentMethodResponse.data.allPaymentMethod || []);

      // Cargar lista básica de clientes y pólizas usando el endpoint optimizado (limit=1000 para obtener todos)
      try {
        const response = await http.get(
          `advisor/get-advisor-optimized/${advisorId.id}?page=1&limit=1000`
        );
        
        if (response.data && response.data.advisorById && response.data.advisorById.policies) {
          const policies = response.data.advisorById.policies;
          
          // Filtrar solo pólizas con comisiones a favor > 0.01 (mínimo 1 centavo)
          const policiesWithBalance = policies.filter((policy) => {
            const released = calculateReleasedCommissions(policy);
            const total = calculateTotalAdvisorCommissionsGenerated(policy);
            const paid = Array.isArray(policy.commissions)
              ? policy.commissions.reduce(
                  (sum, payment) => sum + (Number(payment.advanceAmount) || 0),
                  0
                )
              : 0;
            const maxReleased = Math.min(released, total);
            const balance = maxReleased - paid;
            return balance > 0.01; // Excluye balances menores a $0.01 por redondeo
          });
          
          // Extraer clientes únicos SOLO de pólizas con saldo a favor
          const customersMap = new Map();
          policiesWithBalance.forEach(policy => {
            if (policy.customer && policy.customer.id) {
              if (!customersMap.has(policy.customer.id)) {
                customersMap.set(policy.customer.id, policy.customer);
              }
            }
          });
          
          const uniqueCustomers = Array.from(customersMap.values())
            .sort((a, b) => 
              `${a.firstName || ''} ${a.surname || ''}`.localeCompare(`${b.firstName || ''} ${b.surname || ''}`)
            );
          
          setCustomers(uniqueCustomers);
          
          // Guardar lista de pólizas para el dropdown (solo las que tienen saldo)
          const basicPoliciesList = policiesWithBalance.map(p => ({
            id: p.id,
            numberPolicy: p.numberPolicy,
            customer: p.customer
          }));
          setPoliciesList(basicPoliciesList);
        }
      } catch (error) {
        console.warn("Error cargando lista de clientes/pólizas:", error);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      setPaymentMethod([]);
    }
  }, [advisorId.id]);
*/
  const fetchData = useCallback(async () => {
    try {
      const paymentMethodResponse = await http.get("policy/get-payment-method");
      setPaymentMethod(paymentMethodResponse.data.allPaymentMethod || []);

      // ✅ CAMBIO: Solo cargar lista básica de clientes SIN cargar todas las pólizas
      try {
        const response = await http.get(
          `advisor/get-advisor-optimized/${advisorId.id}?page=1&limit=50` // Solo primeras 50 para lista rápida
        );

        if (response.data && response.data.advisorById && response.data.advisorById.policies) {
          const policies = response.data.advisorById.policies;

          // Extraer clientes únicos
          const customersMap = new Map();
          policies.forEach(policy => {
            if (policy.customer && policy.customer.id) {
              if (!customersMap.has(policy.customer.id)) {
                customersMap.set(policy.customer.id, policy.customer);
              }
            }
          });

          const uniqueCustomers = Array.from(customersMap.values())
            .sort((a, b) =>
              `${a.firstName || ''} ${a.surname || ''}`.localeCompare(`${b.firstName || ''} ${b.surname || ''}`)
            );

          setCustomers(uniqueCustomers);

          // Lista básica de pólizas para dropdown (solo primeras 50)
          const basicPoliciesList = policies.map(p => ({
            id: p.id,
            numberPolicy: p.numberPolicy,
            customer: p.customer
          }));
          setPoliciesList(basicPoliciesList);
        }
      } catch (error) {
        console.warn("Error cargando lista de clientes/pólizas:", error);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      setPaymentMethod([]);
    }
  }, [advisorId.id]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 14. MANEJAR CAMBIO DE INPUT DE ANTICIPO CON VALIDACIÓN
  const handleAdvanceValueChange = useCallback(
    (e) => {
      const inputValue = e.target.value;
      const inputElement = advanceValueRef.current;

      const globalAfterBalance = getTotals(
        distributedPolicies,
        inputValue,
        operationType,
        policyFieldsHelper
      ).afterBalance;

      if (inputValue === "") {
        setAdvanceValue("");
        inputElement.setCustomValidity("");
      } else {
        const value = parseFloat(inputValue);
        setAdvanceValue(value);

        if (globalAfterBalance < 0) {
          inputElement.setCustomValidity(
            "El anticipo excede el saldo global a favor."
          );
        } else {
          inputElement.setCustomValidity("");
        }
      }

      changed(e);
    },
    [distributedPolicies, operationType, policyFieldsHelper, changed] // ✅ Agregar changed a dependencias
  );

  const option = "Escoja una opción";


  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const formElement = e.target;

      if (!formElement.checkValidity()) {
        e.stopPropagation();
        formElement.classList.add("was-validated");
        return;
      }

      setIsLoading(true);

      try {
        if (operationType === "COMISION") {
          // Ahora construimos el payload con policies (released_commission y advance_to_apply)
          const policiesPayload = distributedPolicies.map((policy) => ({
            policy_id: policy.id,
            released_commission: policy.released,
            advance_to_apply: policy.advanceApplied || 0,
          }));

          const payload = {
            advisor_id: advisorId.id,
            receiptNumber: String(form.receiptNumber || ""),
            createdAt: form.createdAt,
            observations: form.observations || "",
            payment_method_id: Number(form.payment_method_id),
            policies: policiesPayload,
          };

          const response = await http.post(
            "commissions-payments/apply-advance-distribution",
            payload
          );

          if (!response?.data?.status || response.data.status !== "success") {
            alerts(
              "Error",
              "No se pudo registrar la comisión. Verifica los datos.", // ✅ Corregir "Verifica"
              "error"
            );
            setIsLoading(false);
            return;
          }

          refreshAdvisor?.();
          alerts(
            "Registro exitoso",
            "Anticipo comisión registrada correctamente",
            "success"
          );
          localStorage.removeItem(`selectedPolicies_${advisorId.id}`);
          setTimeout(() => {
            document.querySelector("#user-form").reset();
            onClose();
          }, 500);
        } else {
          // ANTICIPO general (sin cambio)
          const payload = {
            receiptNumber: String(form.receiptNumber || ""),
            advanceAmount: Number(form.advanceAmount),
            createdAt: form.createdAt, // formato "YYYY-MM-DD" o ISO string
            observations: form.observations || "",
            advisor_id: advisorId.id,
            payment_method_id: Number(form.payment_method_id),
            status_advance_id: 1,
          };

          const response = await http.post(
            "commissions-payments/register-commissions",
            payload
          );

          if (response.data.status === "success") {
            if (typeof refreshAdvisor === "function") await refreshAdvisor();
            alerts(
              "Registro exitoso",
              "Anticipo registrado correctamente",
              "success"
            );
            localStorage.removeItem(`selectedPolicies_${advisorId.id}`);
            setTimeout(() => {
              document.querySelector("#user-form").reset();
              onClose();
            }, 500);
          } else {
            alerts(
              "Error",
              "Avance/anticipo no registrado correctamente. Verifica campos vacíos o números de recibo duplicados.", // ✅ Corregir "Verifica"
              "error"
            );
          }
        }
      } catch (error) {
        alerts("Error", "Error durante el registro", "error");
        console.error("Error registrando comisión:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [
      operationType,
      distributedPolicies,
      advisorId.id,
      form.receiptNumber,
      form.createdAt,
      form.observations,
      form.payment_method_id,
      form.advanceAmount,
      refreshAdvisor,
      onClose,
    ]
  );

  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto">
        <article className="modal-content text-center px-4 py-4" style={{ maxWidth: '95vw' }}>
          <div className="d-block conten-title-com rounded mb-3 py-2">
            <h5 className="text-white fw-bold mb-0">
              <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
              Registro de anticipo/comisión a: {advisorId.firstName}{" "}
              {advisorId.surname} {advisorId.secondSurname || ""}
            </h5>
          </div>

          {/*NUEVO: Filtros para COMISIÓN */}
          {operationType === "COMISION" && (
            <div className="card mb-3 shadow-sm border-0" style={{ backgroundColor: '#f8f9fa' }}>
              <div className="card-body py-3">
                <h6 className="card-title mb-3 fw-bold text-dark">
                  <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                  Filtrar pólizas a incluir
                </h6>
                <div className="row g-3">
                  {/* Modo de filtro */}
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Cargar pólizas por:</label>
                    <select
                      className="form-select"
                      value={filterMode}
                      onChange={(e) => {
                        setFilterMode(e.target.value);
                        setSelectedCustomerId("");
                        setPolicySearch("");
                        setSelectedPolicyId("");
                      }}
                    >
                      <option value="" disabled>Seleccione un filtro...</option>
                      <option value="TODAS">Cargar todas (puede ser lento)</option>
                      <option value="POR_CLIENTE">Por cliente específico</option>
                      <option value="POR_POLIZA">Por póliza específica</option>
                    </select>
                  </div>

                  {/* Selector de cliente */}
                  {filterMode === "POR_CLIENTE" && (
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        Seleccionar cliente:
                        <small className="text-muted ms-2">({customers?.length || 0} disponibles)</small>

                      </label>
                      <select
                        className="form-select"
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                      >
                        <option value="" disabled>Seleccione un cliente...</option>
                        {customers && customers.length > 0 ? (
                          customers
                            .sort((a, b) =>
                              `${a?.firstName || ''} ${a?.surname || ''}`.localeCompare(`${b?.firstName || ''} ${b?.surname || ''}`)
                            )
                            .map((customer) => (
                              <option key={customer.id} value={customer.id}>
                                {`${customer?.firstName || ''} ${customer?.secondName || ''} ${customer?.surname || ''} ${customer?.secondSurname || ''}`.trim()}
                              </option>
                            ))
                        ) : (
                          <option value="" disabled>
                            {customers === null || customers === undefined ? 'Cargando clientes...' : 'No hay clientes disponibles'}
                          </option>
                        )}
                      </select>
                    </div>
                  )}

                  {/* Selección de póliza */}
                  {filterMode === "POR_POLIZA" && (
                    <>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Seleccionar póliza:</label>
                        <select
                          className="form-select"
                          value={selectedPolicyId}
                          onChange={(e) => {
                            setSelectedPolicyId(e.target.value);
                            setPolicySearch(""); // Limpiar buscador al usar select
                          }}
                        >
                          <option value="" disabled>Seleccione una póliza...</option>
                          <option value="TODAS">TODAS (mostrar listado completo)</option>
                          {policiesList && policiesList.length > 0 && policiesList
                            .map((policy) => (
                              <option key={policy.id} value={policy.id}>
                                {policy.numberPolicy} - {policy.customer ?
                                  `${policy.customer.firstName} ${policy.customer.surname}` :
                                  "Sin cliente"}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">O buscar por número:</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ej: 12345..."
                          value={policySearch}
                          onChange={(e) => {
                            setPolicySearch(e.target.value);
                            setSelectedPolicyId(""); // Limpiar select al usar buscador
                          }}
                        />
                      </div>
                    </>
                  )}

                  {/* Mensaje informativo */}
                  {filterMode !== "" && (
                    <div className="col-12">
                      <div className={`alert mb-0 ${(filterMode === "TODAS") ||
                        (filterMode === "POR_CLIENTE" && selectedCustomerId) ||
                        (filterMode === "POR_POLIZA" && (selectedPolicyId || policySearch))
                        ? "alert-info"
                        : "alert-warning"
                        }`}>
                        <small>
                          {filterMode === "TODAS" && "Se cargarán todas las pólizas con saldo a favor. Esto puede tardar si hay muchas."}
                          {filterMode === "POR_CLIENTE" && !selectedCustomerId && "⚠️ Por favor, seleccione un cliente para cargar sus pólizas."}
                          {filterMode === "POR_CLIENTE" && selectedCustomerId && "Se cargarán solo las pólizas de este cliente."}
                          {filterMode === "POR_POLIZA" && !(selectedPolicyId || policySearch) && "⚠️ Por favor, seleccione una póliza o busque por número."}
                          {filterMode === "POR_POLIZA" && (selectedPolicyId || policySearch) &&
                            `Se ${selectedPolicyId === "TODAS" ? 'cargarán todas las pólizas con saldo a favor' : selectedPolicyId ? 'cargará la póliza seleccionada' : 'buscarán pólizas que coincidan con el número ingresado'}.`}
                        </small>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Indicador de carga */}
          {operationType === "COMISION" && isLoadingPolicies && (
            <div className="text-center my-4">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Cargando pólizas...</span>
              </div>
              <p className="mt-2 fw-bold">Cargando pólizas...</p>
            </div>
          )}

          {/*Tabla múltiple de pólizas solo para COMISIÓN */}
          {operationType === "COMISION" && !isLoadingPolicies && distributedPolicies.length > 0 && (
            <>
              <div className="row pt-2">
                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="table table-sm table-hover table-bordered mb-0" style={{ fontSize: '0.85rem' }}>
                    {/* TODA LA TABLA SE MANTIENE IGUAL - NO TOCAR LA LÓGICA CRÍTICA */}
                    <thead className="table-light sticky-top" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                      <tr>
                        <th className="text-center" style={{ minWidth: '100px' }}>N° de póliza</th>
                        <th className="text-center" style={{ minWidth: '120px' }}>Compañía</th>
                        <th className="text-center" style={{ minWidth: '150px' }}>Cliente</th>
                        <th className="text-center" style={{ minWidth: '100px' }}>Frecuencia</th>
                        <th className="text-center" style={{ minWidth: '80px' }}>Pagos por periodo/año</th>
                        <th className="text-center" style={{ minWidth: '80px' }}>Comisión por renovación</th>
                        <th className="text-center" style={{ minWidth: '80px' }}>N° Com. A pagar</th>
                        <th className="text-center" style={{ minWidth: '120px' }}>Comisiones totales</th>
                        <th className="text-center" style={{ minWidth: '120px' }}>Comisiones liberadas</th>
                        <th className="text-center" style={{ minWidth: '120px' }}>Comisiones pagadas</th>
                        <th className="text-center" style={{ minWidth: '120px' }}>Anticipo aplicado</th>
                        <th className="text-center" style={{ minWidth: '100px' }}>Desc. (Si aplica)</th>
                        <th className="text-center" style={{ minWidth: '120px' }}>Saldo (después del registro)</th>
                        <th className="text-center" style={{ minWidth: '120px' }}>Comisiones a favor</th>
                        <th className="text-center" style={{ minWidth: '80px' }}>Quitar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distributedPolicies.length === 0 ? (
                        <tr>
                          <td colSpan="15" className="text-center fw-bold">
                            No hay comisiones disponibles por el momento.
                          </td>
                        </tr>
                      ) : (
                        distributedPolicies.map((policy) => {
                          const afterBalance =
                            policy.commissionInFavor -
                            (policy.advanceApplied || 0);

                          // Calcular pagos liberados (AL DÍA) y total de pagos
                          const releasedPayments =
                            policy.payments?.filter(
                              (payment) =>
                                payment.paymentStatus &&
                                payment.paymentStatus.id == 2
                            ).length || 0;
                          const totalPayments = policy.payments?.length || 0;

                          return (
                            <tr key={policy.id}>
                              <td className="fw-bold text-center align-middle">{policy.numberPolicy}</td>
                              <td className="fw-bold bs-tertiary-color text-center align-middle">
                                {policy.company.companyName}
                              </td>
                              <td className="fw-bold text-start align-middle" style={{ fontSize: '0.8rem' }}>
                                {policy.customer?.firstName
                                  ? `${policy.customer.firstName} ${policy.customer.secondName || ''} ${policy.customer.surname} ${policy.customer.secondSurname || ''}`.trim()
                                  : "N/A"}
                              </td>
                              {/* Frecuencia */}
                              <td className="text-center align-middle">
                                <Badge
                                  text={
                                    policy.isCommissionAnnualized === false
                                      ? "Normal"
                                      : "Anualizada"
                                  }
                                  color={
                                    policy.isCommissionAnnualized === false
                                      ? "info"
                                      : "secondary"
                                  }
                                />
                              </td>

                              <td className="text-center align-middle fw-bold">
                                {policy.isCommissionAnnualized === false
                                  ? policy.numberOfPaymentsAdvisor
                                  : 1}
                              </td>
                              {/* Comisión por renovación */}
                              <td className="text-center align-middle">
                                <Badge
                                  text={
                                    policy.renewalCommission === true
                                      ? "SI"
                                      : "NO"
                                  }
                                  color={
                                    policy.renewalCommission === true
                                      ? "dark"
                                      : "danger"
                                  }
                                />
                              </td>
                              <td className="text-center align-middle">
                                <Badge
                                  text={releasedPayments + "/" + totalPayments}
                                  color={
                                    releasedPayments === totalPayments
                                      ? "success"
                                      : releasedPayments > 0
                                        ? "warning text-dark"
                                        : "secondary"
                                  }
                                />
                              </td>

                              <td className="fw-bold text-primary text-end align-middle">
                                ${policy.commissionTotal?.toFixed(2) ?? "0.00"}
                              </td>


                              <td className="fw-bold text-warning text-end align-middle">
                                ${policy.released?.toFixed(2) ?? "0.00"}
                              </td>
                              <td className="fw-bold text-success text-end align-middle">
                                ${policy.paid?.toFixed(2) ?? "0.00"}
                              </td>
                              <td
                                className="fw-bold text-end align-middle"
                                style={{ color: "#17a2b8" }}
                              >
                                $
                                {policy.appliedHistoricalAdvance?.toFixed(2) ??
                                  "0.00"}
                              </td>
                              <td className="fw-bold text-danger text-end align-middle">
                                ${policy.refundsAmount?.toFixed(2) ?? "0.00"}
                              </td>
                              <td
                                className={`fw-bold text-end align-middle ${afterBalance <= 0 ? "text-danger" : "text-dark"
                                  }`}
                              >
                                ${afterBalance.toFixed(2)}
                              </td>
                              <td
                                className="fw-bold text-end align-middle"
                                style={{ color: "#a259ff" }}
                              >
                                ${policy.commissionInFavor?.toFixed(2) ?? "0.00"}
                              </td>
                              <td className="text-center align-middle">
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => removePolicy(policy.id)}
                                  title="Quitar póliza"
                                >
                                  <FontAwesomeIcon icon={faRectangleXmark} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>

                    <tfoot className="table-light" style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
                      <tr className="fw-bold">
                        <th colSpan="5" className="text-start align-middle">Totales</th>
                        <th colSpan="1" className="text-end align-middle" style={{ fontSize: '0.8rem' }}>
                          Total de anticipos:
                        </th>
                        <th
                          className="text-white text-end align-middle"
                          style={{ backgroundColor: "#17a2b8" }}
                        >
                          ${advisorTotalAdvances.toFixed(2)}
                        </th>
                        <th className="bg-primary text-white text-end align-middle">
                          ${globalTotals.commissionTotal?.toFixed(2) ?? "0.00"}
                        </th>
                        <th className="bg-warning text-dark text-end align-middle">
                          ${globalTotals.released?.toFixed(2) ?? "0.00"}
                        </th>
                        <th className="bg-success text-white text-end align-middle">
                          ${globalTotals.paid?.toFixed(2) ?? "0.00"}
                        </th>
                        <th
                          className="text-white text-end align-middle"
                          style={{ backgroundColor: "#17a2b8" }}
                        >
                          $
                          {globalTotals.appliedHistoricalAdvance?.toFixed(2) ??
                            "0.00"}
                        </th>
                        <th className="bg-danger text-white text-end align-middle">
                          ${globalTotals.refundsAmount?.toFixed(2) ?? "0.00"}
                        </th>
                        <th
                          className={
                            globalTotals.afterBalance <= 0
                              ? "bg-danger fw-bold text-white text-end align-middle"
                              : "bg-secondary text-white fw-bold text-end align-middle"
                          }
                        >
                          ${globalTotals.afterBalance?.toFixed(2) ?? "0.00"}
                        </th>
                        <th
                          className="fw-bold text-white text-end align-middle"
                          style={{ backgroundColor: "#a259ff" }}
                        >
                          ${globalTotals.commissionInFavor?.toFixed(2) ?? "0.00"}
                        </th>
                        <th></th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {/* (Opcional) Desglose visual */}
                {advanceValue > 0 && (
                  <div className="alert alert-info mt-3">
                    <strong>Desglose de reparto:</strong>
                    <ul>
                      {distributedPolicies.map(
                        (policy) =>
                          (policy.appliedHistoricalAdvance > 0 ||
                            policy.advanceApplied > 0) && (
                            <li key={policy.id}>
                              Póliza {policy.numberPolicy}:
                              {policy.appliedHistoricalAdvance > 0 && (
                                <>
                                  {" "}
                                  Anticipo previo:{" "}
                                  <b>
                                    $
                                    {policy.appliedHistoricalAdvance.toFixed(2)}
                                  </b>
                                </>
                              )}
                              {policy.advanceApplied > 0 && (
                                <>
                                  {" "}
                                  {policy.appliedHistoricalAdvance > 0
                                    ? " + "
                                    : ""}{" "}
                                  Nuevo:{" "}
                                  <b>${policy.advanceApplied.toFixed(2)}</b>
                                </>
                              )}
                            </li>
                          )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
          <div className="card-commision shadow-sm mb-3 border-0">
            <div className="card-body py-3">
              <form
                onSubmit={handleSubmit}
                id="user-form"
                className="needs-validation was-validated"
                noValidate
              >
                <div className="row g-2">
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-bold text-dark">
                      <FontAwesomeIcon icon={faTags} className="me-2" />
                      Tipo de operación
                    </label>
                    <select
                      className="form-select"
                      value={operationType}
                      onChange={(e) => setOperationType(e.target.value)}
                      required
                    >
                      <option value="" disabled defaultValue>
                        {option}
                      </option>
                      <option value="ANTICIPO">ANTICIPO</option>
                      <option value="COMISION">COMISIÓN</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-4">
                    <label
                      htmlFor="receiptNumber"
                      className="form-label fw-bold text-dark"
                    >
                      <FontAwesomeIcon icon={faHashtag} className="me-2" />
                      Número de Recibo
                    </label>
                    <input
                      required
                      onChange={changed}
                      id="receiptNumber"
                      type="text"
                      className="form-control"
                      name="receiptNumber"
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label
                      htmlFor="payment_method_id"
                      className="form-label fw-bold text-dark"
                    >
                      <FontAwesomeIcon icon={faCreditCard} className="me-2" />
                      Método de abono
                    </label>
                    <select
                      className="form-select"
                      id="payment_method_id"
                      name="payment_method_id"
                      onChange={changed}
                      required
                      value={form.payment_method_id || ""}
                    >
                      <option value="" disabled defaultValue>
                        {option}
                      </option>
                      {paymentMethod.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.methodName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 col-md-4">
                    <label
                      htmlFor="advanceAmount"
                      className="form-label fw-bold text-dark"
                    >
                      <FontAwesomeIcon icon={faDollarSign} className="me-2" />
                      Valor del anticipo/comisión
                    </label>
                    <input
                      ref={advanceValueRef}
                      required
                      type="number"
                      className="form-control"
                      id="advanceAmount"
                      name="advanceAmount"
                      step="0.01"
                      onChange={handleAdvanceValueChange}
                      value={advanceValue}
                    />
                    <div className="invalid-feedback">
                      La comisión es mayor que la comisión de la póliza
                      seleccionada o el campo está vacío
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <label
                      htmlFor="createdAt"
                      className="form-label fw-bold text-dark"
                    >
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                      Fecha del anticipo
                    </label>
                    <input
                      required
                      type="date"
                      className="form-control"
                      id="createdAt"
                      name="createdAt"
                      onChange={changed}
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label
                      htmlFor="observations"
                      className="form-label fw-bold text-dark"
                    >
                      <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                      Observaciones
                    </label>
                    <textarea
                      className="form-control"
                      id="observations"
                      name="observations"
                      onChange={changed}
                      rows="2"
                    />
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-12 d-flex justify-content-center gap-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn btn-success fw-bold px-4 py-2"
                    >
                      <FontAwesomeIcon
                        className="me-2"
                        icon={faFloppyDisk}
                        beat
                      />
                      {isLoading
                        ? "Registrando..."
                        : "Registrar Comisión/Anticipo"}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn btn-danger fw-bold px-4 py-2"
                    >
                      <FontAwesomeIcon
                        className="me-2"
                        beat
                        icon={faRectangleXmark}
                      />
                      Cerrar
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </article>
      </div>
    </>
  );
};

// PropTypes se mantienen exactamente igual
RegisterAdvanceModal.propTypes = {
  advisorId: PropTypes.shape({
    id: PropTypes.number.isRequired,
    firstName: PropTypes.string.isRequired,
    secondName: PropTypes.string,
    surname: PropTypes.string.isRequired,
    secondSurname: PropTypes.string,
    commissions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        receiptNumber: PropTypes.string,
        company_id: PropTypes.number,
        payment_method_id: PropTypes.number,
        advanceAmount: PropTypes.number,
        createdAt: PropTypes.string,
        observations: PropTypes.string,
        status_advance_id: PropTypes.number,
        advanceStatus: PropTypes.shape({
          id: PropTypes.number,
          statusNameAdvance: PropTypes.string,
        }),
      })
    ),
    policies: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        numberPolicy: PropTypes.string.isRequired,
        payment_frequency_id: PropTypes.string,
        numberOfPaymentsAdvisor: PropTypes.number,
        paymentsToAdvisor: PropTypes.number,
        renewalCommission: PropTypes.bool,
        advisorPercentage: PropTypes.number,
        agencyPercentage: PropTypes.number,
        totalCommission: PropTypes.number,
        company_id: PropTypes.number,
        isCommissionAnnualized: PropTypes.bool,
        commissions: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number.isRequired,
            receiptNumber: PropTypes.string,
            company_id: PropTypes.number,
            payment_method_id: PropTypes.number,
            advanceAmount: PropTypes.number,
            createdAt: PropTypes.string,
            observations: PropTypes.string,
            status_advance_id: PropTypes.number,
          })
        ),
        payments: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number.isRequired,
            paymentDate: PropTypes.string,
            paymentAmount: PropTypes.number,
            paymentStatus: PropTypes.shape({
              id: PropTypes.number,
              statusName: PropTypes.string,
            }),
          })
        ),
        customer: PropTypes.shape({
          id: PropTypes.number,
          firstName: PropTypes.string,
          secondName: PropTypes.string,
          surname: PropTypes.string,
          secondSurname: PropTypes.string,
        }),
        commissionsRefunds: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number,
            amountRefunds: PropTypes.number,
            cancellationDate: PropTypes.string,
            reason: PropTypes.string,
          })
        ),
      })
    ),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  refreshAdvisor: PropTypes.func.isRequired,
};

export default RegisterAdvanceModal;
