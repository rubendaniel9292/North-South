import PropTypes from "prop-types";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  faRectangleXmark,
  faFloppyDisk,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import http from "../../helpers/Http";
import UserForm from "../../hooks/UserForm";
import alerts from "../../helpers/Alerts";
import {
  saveSelectedPolicies,
  loadSelectedPolicies,
} from "../../helpers/localStorageUtils";
import {
  calculateCommissionValue,
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
    <span className={`badge rounded-pill bg-${color} fw-semibold`}>{text}</span>
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

  // 4. CALCULAR ANTICIPOS TOTALES DEL ASESOR (helper)
  const advisorTotalAdvances = useMemo(
    () => getAdvisorTotalAdvances(advisorId),
    [advisorId]
  );

  // 5. MEMOIZAR POLIZAS CON ANTICIPO HISTÓRICO APLICADO
  const policiesWithFavor = useMemo(
    () =>
      applyHistoricalAdvance(
        selectedPolicies,
        advisorTotalAdvances,
        calculateCommissionValue,
        calculateReleasedCommissions
      ),
    [selectedPolicies, advisorTotalAdvances]
  );

  // 6. DISTRIBUIR EL VALOR ACTUAL DEL FORMULARIO ENTRE LAS POLIZAS

  const distributedPolicies = useMemo(
    () =>
      distributeAdvance(policiesWithFavor, advanceValue).map((policy) => ({
        ...policy,
        ...getPolicyFields(policy),
      })),
    [policiesWithFavor, advanceValue]
  );

  // 7. CARGAR SELECCIÓN PREVIA DE POLIZAS DESDE LOCALSTORAGE
  useEffect(() => {
    if (advisorId?.id) {
      const prev = loadSelectedPolicies(advisorId.id);
      if (prev) setSelectedPolicies(prev);
    }
  }, [advisorId]);

  // 8. GUARDAR SELECCIÓN EN LOCALSTORAGE AL CAMBIAR
  useEffect(() => {
    if (advisorId?.id) saveSelectedPolicies(advisorId.id, selectedPolicies);
  }, [selectedPolicies, advisorId]);

  // 9. CAMBIAR POLIZAS SELECCIONADAS SEGÚN EL TIPO DE OPERACIÓN
  useEffect(() => {
    if (operationType === "COMISION" && Array.isArray(advisorId.policies)) {
      const releasedPolicies = advisorId.policies.filter((policy) => {
        const released = calculateReleasedCommissions(policy);
        const total = calculateCommissionValue(policy);
        const paid = Array.isArray(policy.commissions)
          ? policy.commissions.reduce(
              (sum, payment) => sum + (Number(payment.advanceAmount) || 0),
              0
            )
          : 0;
        const maxReleased = Math.min(released, total);
        const balance = maxReleased - paid;
        return balance > 0; // Solo pólizas con saldo a favor
      });
      setSelectedPolicies(releasedPolicies);
    }
    if (operationType === "ANTICIPO") {
      setSelectedPolicies([]); // Limpiar para anticipos
    }
  }, [operationType, advisorId]);

  // 10. REMOVER POLIZA DE LA SELECCIÓN
  const removePolicy = useCallback((policyId) => {
    setSelectedPolicies((prev) =>
      prev.filter((policy) => policy.id !== policyId)
    );
  }, []);

  // 11. FUNCION PARA OBTENER CAMPOS DE POLIZA (PASADA AL HELPER)
  const policyFieldsHelper = useCallback(
    (policy) =>
      getPolicyFields(
        policy,
        calculateCommissionValue,
        calculateReleasedCommissions
      ),
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
  // 13. CALCULAR EL SALDO GLOBAL TRAS EL REGISTRO
  /*
  const afterBalanceGlobal =
    globalTotals.afterBalance -
    (Number(advanceValue) || 0) -
    advisorTotalAdvances;
*/
  // 13. CARGAR MÉTODOS DE PAGO AL MONTAR
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [paymentMethodResponse] = await Promise.all([
          http.get("policy/get-payment-method"),
        ]);
        setPaymentMethod(paymentMethodResponse.data.allPaymentMethod);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

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
    [distributedPolicies, operationType, policyFieldsHelper]
  );
  const option = "Escoja una opción";
  const handleSubmit = async (e) => {
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
            "No se pudo aplicar el anticipo a las pólizas. Verifica los datos.",
            "error"
          );
          setIsLoading(false);
          return;
        }

        refreshAdvisor?.();
        alerts(
          "Registro exitoso",
          "Anticipo aplicado correctamente",
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
          //await getAllPayments().then(setAllPayments);
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
            "Avance/anticipo no registrado correctamente. Verifica campos vacíos o números de recibo duplicados.",
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
  };

  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto">
        <article className="modal-content text-center px-5 py-5">
          <div className="d-block conten-title-com rounded ">
            <h3 className="text-white fw-bold ">
              Registro de anticipio a : {advisorId.firstName}{" "}
              {advisorId.surname} {advisorId.secondSurname}{" "}
              {advisorId.secondSurname}
            </h3>
            <div className="row pt-2"></div>
          </div>

          {/*Tabla múltiple de pólizas solo para COMISIÓN */}
          {operationType === "COMISION" && (
            <>
              <div className="row pt-2">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>N° de póliza</th>
                      <th>Compañia</th>
                      <th>Cliente</th>
                      <th>Frecuencia</th>
                      <th>Pagos por periodo/año</th>
                      <th>Comisión por renovación</th>
                      <th>Comisiones totales</th>
                      <th>Comisiones liberadas</th>
                      <th>Comisiones pagadas</th>
                      <th>Anticipo aplicado</th>
                      <th>Desc. por cancelacion (si aplica)</th>
                      <th>Saldo (después del registro)</th>
                      <th>Comisiones a favor</th>
                      <th>Quitar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distributedPolicies.length === 0 ? (
                      <tr>
                        <td colSpan="13" className="text-center fw-bold">
                          No hay comisiones disponibles por el momento.
                        </td>
                      </tr>
                    ) : (
                      distributedPolicies.map((policy) => {
                        const afterBalance =
                          policy.commissionInFavor -
                          (policy.advanceApplied || 0);

                        return (
                          <tr key={policy.id}>
                            <td className="fw-bold">{policy.numberPolicy}</td>
                            <td className="fw-bold bs-tertiary-color">
                              {policy.company.companyName}
                            </td>
                            <td className="fw-bold">
                              {policy.customer
                                ? [
                                    policy.customer.firstName,
                                    policy.customer.secondName,
                                    policy.customer.surname,
                                    policy.customer.secondSurname,
                                  ]
                                    .filter(Boolean)
                                    .join(" ")
                                : "N/A"}
                            </td>
                            {/* Frecuencia */}
                            <td>
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
                            <td>
                              {policy.isCommissionAnnualized === false
                                ? policy.numberOfPaymentsAdvisor
                                : 1}
                            </td>
                            {/* Comisión por renovación */}
                            <td>
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
                            {/* Las siguientes celdas solo texto, sin bg-* */}
                            <td className="fw-bold text-primary">
                              ${policy.commissionTotal?.toFixed(2) ?? "0.00"}
                            </td>
                            <td className="fw-bold text-warning">
                              ${policy.released?.toFixed(2) ?? "0.00"}
                            </td>
                            <td className="fw-bold text-success">
                              ${policy.paid?.toFixed(2) ?? "0.00"}
                            </td>
                            <td
                              className="fw-bold "
                              style={{ color: "#17a2b8" }}
                            >
                              $
                              {policy.appliedHistoricalAdvance?.toFixed(2) ??
                                "0.00"}
                            </td>
                            <td className="fw-bold text-danger">
                              ${policy.refundsAmount?.toFixed(2) ?? "0.00"}
                            </td>
                            <td
                              className={`fw-bold ${
                                afterBalance <= 0 ? "text-danger" : "text-dark"
                              }`}
                            >
                              ${afterBalance.toFixed(2)}
                            </td>
                            <td
                              className="fw-bold"
                              style={{ color: "#a259ff" }}
                            >
                              ${policy.commissionInFavor?.toFixed(2) ?? "0.00"}
                            </td>
                            <td>
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

                  <tfoot>
                    <tr>
                      <th colSpan="3">Totales</th>
                      <th colSpan="1" className="text-end ">
                        Total de anticipos:
                      </th>
                      <th
                        className="text-white"
                        style={{ backgroundColor: "#17a2b8" }}
                      >
                        ${advisorTotalAdvances.toFixed(2)}
                      </th>
                      <th className="bg-primary text-white">
                        ${globalTotals.commissionTotal?.toFixed(2) ?? "0.00"}
                      </th>
                      <th className="bg-warning">
                        ${globalTotals.released?.toFixed(2) ?? "0.00"}
                      </th>
                      <th className="bg-success text-white">
                        ${globalTotals.paid?.toFixed(2) ?? "0.00"}
                      </th>
                      <th
                        className="text-white"
                        style={{ backgroundColor: "#17a2b8" }}
                      >
                        $
                        {globalTotals.appliedHistoricalAdvance?.toFixed(2) ??
                          "0.00"}
                      </th>
                      <th className="bg-danger text-white">
                        ${globalTotals.refundsAmount?.toFixed(2) ?? "0.00"}
                      </th>
                      <th
                        className={
                          globalTotals.afterBalance <= 0
                            ? "bg-danger fw-bold text-white"
                            : "bg-secondary text-white fw-bold"
                        }
                      >
                        ${globalTotals.afterBalance?.toFixed(2) ?? "0.00"}
                      </th>
                      <th
                        className="fw-bold text-white"
                        style={{ backgroundColor: "#a259ff" }}
                      >
                        ${globalTotals.commissionInFavor?.toFixed(2) ?? "0.00"}
                      </th>
                    </tr>
                  </tfoot>
                </table>
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
          <div className="card-commision shadow-sm mb-4 ">
            <div className="card-body">
              <form
                onSubmit={handleSubmit}
                id="user-form"
                className="needs-validation was-validated"
                noValidate
              >
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-bold text-dark">
                      Tipo de operación
                    </label>
                    <select
                      className="form-select"
                      value={operationType}
                      onChange={(e) => setOperationType(e.target.value)}
                      required
                    >
                      <option selected value={""} disabled>
                        {option}
                      </option>
                      <option value="ANTICIPO">ANTICIPO</option>
                      <option value="COMISION">COMISIÓN</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-bold text-dark">
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
                    <label className="form-label fw-bold text-dark">
                      Método de abono
                    </label>
                    <select
                      className="form-select"
                      id="payment_method_id"
                      name="payment_method_id"
                      onChange={changed}
                      defaultValue={option}
                      required
                    >
                      <option selected value={""} disabled>
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
                    <label className="form-label fw-bold text-dark">
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
                    <label className="form-label fw-bold text-dark">
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
                    <label className="form-label fw-bold text-dark">
                      Observaciones
                    </label>
                    <textarea
                      className="form-control"
                      id="observations"
                      name="observations"
                      onChange={changed}
                    />
                  </div>
                </div>
                <div className="row mt-5">
                  <div className="col-12 d-flex justify-content-center gap-3">
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
          firstName: PropTypes.string.isRequierd,
          secondName: PropTypes.stringisRequierd,
          surname: PropTypes.string.isRequierd,
          secondSurname: PropTypes.string.isRequierd,
        }),
        commissionsRefunds: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.numberisRequierd,
            amountRefunds: PropTypes.number.isRequierd,
            cancellationDate: PropTypes.string.isRequierd,
            reason: PropTypes.string.isRequierd,
          })
        ),
      })
    ),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  refreshAdvisor: PropTypes.func.isRequired,
};
export default RegisterAdvanceModal;
