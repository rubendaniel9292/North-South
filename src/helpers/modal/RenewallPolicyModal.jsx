import PropTypes from "prop-types";
import UserForm from "../../hooks/UserForm";
import { useEffect, useState, useCallback } from "react"; 
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { 
  faRectangleXmark, 
  faFloppyDisk,
  faHashtag,
  faShield,
  faDollarSign,
  faPercent,
  faCalendarAlt,
  faMoneyBillWave,
  faFileAlt,
  faSync
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { calculateAdvisorAndAgencyPayments } from "../../helpers/CommissionUtils";
import { getFrequencyIdFromPayments } from "../../helpers/PolicyFormHelpers";

const RenewallPolicyModal = ({ policy, onClose, onPolicyUpdated }) => {
  const lastPeriod = policy.periods.reduce((a, b) => (a.year > b.year ? a : b));
  
  if (!policy) return null;

  console.log("poliza obtenida: ", policy);
  
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [isDataValid, setIsDataValid] = useState(true);
  const [minRenewalDate, setMinRenewalDate] = useState("");
  const [frequency, setFrequency] = useState([]);
  const [selectedFrequencyId, setSelectedFrequencyId] = useState(0);

  const { form, changed, setForm } = UserForm({
    policy_id: policy.id,
    coverageAmount: policy.coverageAmount,
    agencyPercentage: lastPeriod.agencyPercentage,
    advisorPercentage: lastPeriod.advisorPercentage,
    policyValue: lastPeriod.policyValue,
    policyFee: lastPeriod.policyFee,
    paymentsToAgency: policy.paymentsToAgency || 0,
    paymentsToAdvisor: policy.paymentsToAdvisor || 0,
    payment_frequency_id: getFrequencyIdFromPayments(policy.numberOfPayments),
    numberOfPayments: policy.numberOfPayments || 0,
  });


  const addClassSafely = useCallback((id, className) => {
    const element = document.getElementById(id);
    if (element) element.classList.add(className);
  }, []);

  const handleFrequencyChange = useCallback(
    (e) => {
      const selectedFrequencyId = Number(e.target.value);
      console.log(
        "selectedFrequencyId:",
        selectedFrequencyId && typeof selectedFrequencyId
      );

      const frequencyMap = {
        1: 12, // Mensual
        2: 4, // Trimestral
        3: 2, // Semestral
        4: 1, // Anual (default)
        5: "", // otro
      };

      const calculatedPayments = frequencyMap[selectedFrequencyId];

      changed([
        {
          name: "payment_frequency_id",
          value: selectedFrequencyId,
        },
        {
          name: "numberOfPayments",
          value: calculatedPayments,
        },
      ]);

      setSelectedFrequencyId(selectedFrequencyId);
    },
    [changed]
  );

  const calculateAdvisorPayment = useCallback(() => {
    const { paymentsToAgency, paymentsToAdvisor } =
      calculateAdvisorAndAgencyPayments(
        form.policyValue,
        form.policyFee,
        form.agencyPercentage,
        form.advisorPercentage
      );

    changed({
      target: {
        name: "paymentsToAgency",
        value: paymentsToAgency,
      },
    });

    changed({
      target: {
        name: "paymentsToAdvisor",
        value: paymentsToAdvisor,
      },
    });

    // Agregar clase is-valid a los campos calculados automáticamente de manera segura
    addClassSafely("paymentsToAgency", "is-valid");
    addClassSafely("paymentsToAdvisor", "is-valid");
    addClassSafely("numberOfPayments", "is-valid");
    addClassSafely("numberOfPaymentsAdvisor", "is-valid");
  }, [changed, addClassSafely]);


  const renewalAndUpdatePolicy = useCallback(async (e) => {
    e.preventDefault();
    const renewalDateValue = document.getElementById("createdAt").value;
    const enteredDate = new Date(renewalDateValue);
    const minDate = new Date(minRenewalDate);

    // Validación: la fecha debe ser igual o posterior a la fecha mínima calculada
    if (enteredDate < minDate) {
      addClassSafely("createdAt", "is-invalid");
      const minDateFormatted = minDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      setFormError(`La fecha de renovación debe ser igual o posterior a ${minDateFormatted}`);
      return;
    } else {
      document.getElementById("createdAt").classList.remove("is-invalid");
      addClassSafely("createdAt", "is-valid");
      setFormError("");
    }
    
    setIsLoading(true);
    
    try {
      const renewalData = {
        policy_id: policy.id,
        renewalNumber: form.renewalNumber,
        createdAt: form.createdAt,
        observations: form.observations || "",
        coverageAmount: form.coverageAmount,
        policyValue: form.policyValue,
        policyFee: form.policyFee,
        agencyPercentage: form.agencyPercentage,
        advisorPercentage: form.advisorPercentage,
        paymentsToAgency: form.paymentsToAgency,
        paymentsToAdvisor: form.paymentsToAdvisor,
        payment_frequency_id: form.payment_frequency_id,
        numberOfPayments: form.numberOfPayments,
      };

      const renewalRequest = await http.post(
        "policy/register-renewal",
        renewalData
      );

      if (renewalRequest.data.status === "success") {
        alerts(
          "Renovación exitosa",
          "Póliza renovada correctamente",
          "success"
        );

        // ✅ Recargar la póliza completa desde el servidor con sus pagos actualizados
        const updatedPolicyResponse = await http.get(`policy/get-policy-id/${policy.id}`);
        
        if (updatedPolicyResponse.data.status === "success") {
          // Llamar a la función de callback con la póliza actualizada completa
          onPolicyUpdated(updatedPolicyResponse.data.policyById);
        }
        
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        alerts(
          "Error durante la actualización de la póliza",
          "Póliza no actualizada correctamente.",
          "error"
        );
      }
    } catch (error) {
      alerts(
        "Error",
        "No se renovó la póliza, revise los campos e intente nuevamente.",
        "error"
      );
      console.error("Error fetching policy:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    form.renewalNumber,
    form.createdAt,
    form.observations,
    form.coverageAmount,
    form.policyValue,
    form.policyFee,
    form.agencyPercentage,
    form.advisorPercentage,
    form.paymentsToAgency,
    form.paymentsToAdvisor,
    form.payment_frequency_id,
    form.numberOfPayments,
    policy.id,
    onPolicyUpdated,
    onClose,
    addClassSafely,
    minRenewalDate
  ]);

  // Actualizar el número de renovación y calcular fecha mínima cuando se recibe el prop `policy`
  useEffect(() => {
    if (policy && policy.renewals) {
      // Usar directamente la longitud del array + 1 para asegurar secuencia correcta
      const newRenewalNumber = policy.renewals.length + 1;
      
      console.log("🔍 DEBUG - Calculando fecha de renovación:");
      console.log("- Total de pagos recibidos:", policy.payments?.length);
      console.log("- Pagos:", policy.payments);
      console.log("- Último periodo:", lastPeriod);
      
      // Calcular la fecha mínima de renovación basándose en los pagos existentes
      let calculatedMinDate;
      
      // Opción 1: Si hay pagos, buscar la fecha del último pago programado
      if (policy.payments && policy.payments.length > 0) {
        // Obtener todos los pagos y buscar el que tiene la fecha más reciente
        const paymentsWithDates = policy.payments.filter(p => 
          p.paymentDate || p.payment_date || p.fecha_pago_fija
        );
        
        if (paymentsWithDates.length > 0) {
          // Encontrar el pago con la fecha más reciente
          const lastPaymentWithDate = paymentsWithDates.reduce((latest, current) => {
            const latestDate = new Date(latest.paymentDate || latest.payment_date || latest.fecha_pago_fija);
            const currentDate = new Date(current.paymentDate || current.payment_date || current.fecha_pago_fija);
            return currentDate > latestDate ? current : latest;
          });
          
          const lastPaymentDate = new Date(
            lastPaymentWithDate.paymentDate || 
            lastPaymentWithDate.payment_date || 
            lastPaymentWithDate.fecha_pago_fija
          );
          
          // Calcular meses entre pagos según frecuencia
          const frequencyId = String(policy.paymentFrequency?.id || policy.payment_frequency_id);
          let monthsBetweenPayments = 3; // Trimestral por defecto
          
          switch (frequencyId) {
            case "1": monthsBetweenPayments = 1; break;   // Mensual
            case "2": monthsBetweenPayments = 3; break;   // Trimestral
            case "3": monthsBetweenPayments = 6; break;   // Semestral
            case "4": monthsBetweenPayments = 12; break;  // Anual
            case "5": monthsBetweenPayments = 3; break;   // Otro
          }
          
          // La fecha mínima de renovación es el siguiente periodo después del último pago
          calculatedMinDate = new Date(lastPaymentDate);
          calculatedMinDate.setMonth(calculatedMinDate.getMonth() + monthsBetweenPayments);
        }
      }
      
      // Opción 2: Basarse en el último periodo si no hay pagos con fechas
      if (!calculatedMinDate && lastPeriod) {
        // Año del último periodo + 1, usar la fecha de inicio como referencia
        const startDate = new Date(policy.startDate);
        calculatedMinDate = new Date(lastPeriod.year + 1, startDate.getMonth(), startDate.getDate());
      }
      
      // Opción 3: Fallback - usar la fecha de inicio de la póliza + años transcurridos
      if (!calculatedMinDate) {
        const startDate = new Date(policy.startDate);
        const yearsElapsed = policy.renewals.length;
        calculatedMinDate = new Date(startDate.getFullYear() + yearsElapsed + 1, startDate.getMonth(), startDate.getDate());
      }
      
      console.log("📅 Fecha mínima de renovación calculada:", calculatedMinDate);
      
      // Formatear la fecha para el input date (YYYY-MM-DD) usando hora local
      const year = calculatedMinDate.getFullYear();
      const month = String(calculatedMinDate.getMonth() + 1).padStart(2, '0');
      const day = String(calculatedMinDate.getDate()).padStart(2, '0');
      const minDateString = `${year}-${month}-${day}`;
      
      console.log("📅 Fecha formateada para input:", minDateString);
      setMinRenewalDate(minDateString);
      
      setForm((prevForm) => ({
        ...prevForm,
        renewalNumber: newRenewalNumber,
        createdAt: minDateString, // Establecer como valor por defecto
      }));
    } else {
      // Si no hay renovaciones, usar el año siguiente a la fecha de inicio
      const startDate = new Date(policy.startDate);
      const nextYear = new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
      const minDateString = nextYear.toISOString().split('T')[0];
      setMinRenewalDate(minDateString);
      
      setForm((prevForm) => ({
        ...prevForm,
        renewalNumber: 1, // Valor por defecto si no hay renovaciones
        createdAt: minDateString,
      }));
    }
  }, [policy, setForm, lastPeriod]);

  const fetchData = useCallback(async () => {
    try {
      const frecuencyResponse = await http.get("policy/get-frecuency");
      setFrequency(frecuencyResponse.data.allFrecuency);
    } catch (error) {
      console.error("Error fetching frequency data:", error);
      alerts("Error", "Error fetching frequency data.", "error");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!policy) {
      console.error("Error al recibir el objeto", policy);
      setIsDataValid(false);
      return;
    }
  }, [policy]);

  useEffect(() => {
    calculateAdvisorPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.policyValue, form.policyFee, form.agencyPercentage, form.advisorPercentage]);

  const lastRenewalYear =
    policy.renewals?.[policy.renewals.length - 1]?.createdAt?.year ||
    new Date(policy.startDate).getFullYear();

  if (!isDataValid) {
    return <div>Error: Datos de póliza o frecuencia de pago no válidos.</div>;
  }

  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto">
        <article className="modal-content modal-content-renewal text-center px-5 py-5">
          <div className="d-flex justify-content-center align-items-center conten-title rounded mb-3">
            <h3 className="text-white fw-bold">
              <FontAwesomeIcon icon={faSync} className="me-2" />
              Póliza seleccionada a renovar: {policy.numberPolicy} {/* ✅ Corregir "selecionada" */}
            </h3>
          </div>
          
          <div className="justify-content-around mt-1">
            <form
              onSubmit={renewalAndUpdatePolicy}
              id="user-form"
              className="needs-validation was-validated"
            >
              <div className="row pt-3 fw-bold">
                <div className="d-none">
                  <label htmlFor="policy_id" className="form-label">
                    Id de Póliza
                  </label>
                  <input
                    required
                    type="number"
                    className="form-control"
                    id="policy_id"
                    name="policy_id"
                    value={policy.id}
                    readOnly
                  />
                </div>

                <div className="mb-3 col-2">
                  <label htmlFor="renewalNumber" className="form-label"> {/* ✅ Corregir htmlFor */}
                    <FontAwesomeIcon icon={faHashtag} className="me-2" />
                    Número de renovación
                  </label>
                  <input
                    required
                    readOnly
                    id="renewalNumber" // ✅ Corregir ID inconsistente
                    type="number"
                    className="form-control"
                    name="renewalNumber"
                    value={form.renewalNumber || 1}
                    onChange={changed}
                  />
                </div>

                <div className="mb-3 col-2">
                  <label htmlFor="coverageAmount" className="form-label">
                    <FontAwesomeIcon icon={faShield} className="me-2" />
                    Monto de Cobertura
                  </label>
                  <input
                    required
                    type="number"
                    className="form-control"
                    id="coverageAmount"
                    name="coverageAmount"
                    onChange={changed}
                    value={form.coverageAmount}
                  />
                </div>

                <div className="mb-3 col-2">
                  <label htmlFor="policyValue" className="form-label">
                    <FontAwesomeIcon icon={faDollarSign} className="me-2" />
                    Valor de la Póliza
                  </label>
                  <input
                    required
                    type="number"
                    className="form-control"
                    id="policyValue"
                    name="policyValue"
                    value={form.policyValue}
                    onChange={changed}
                  />
                </div>

                <div className="mb-3 col-2">
                  <label htmlFor="policyFee" className="form-label">
                    <FontAwesomeIcon icon={faDollarSign} className="me-2" />
                    Derecho de póliza
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="policyFee"
                    name="policyFee"
                    value={form.policyFee}
                    onChange={changed}
                  />
                </div>

                <div className="mb-3 col-2">
                  <label htmlFor="agencyPercentage" className="form-label">
                    <FontAwesomeIcon icon={faPercent} className="me-2" />
                    Porcentaje de la Agencia {/* ✅ Corregir "Procentaje" */}
                  </label>
                  <input
                    required
                    type="number"
                    className="form-control"
                    id="agencyPercentage"
                    name="agencyPercentage"
                    onChange={changed}
                    value={form.agencyPercentage}
                  />
                </div>

                <div className="mb-3 col-2">
                  <label htmlFor="advisorPercentage" className="form-label">
                    <FontAwesomeIcon icon={faPercent} className="me-2" />
                    Porcentaje del Asesor
                  </label>
                  <input
                    required
                    type="number"
                    className="form-control"
                    id="advisorPercentage"
                    name="advisorPercentage"
                    onChange={changed}
                    value={form.advisorPercentage}
                  />
                </div>

                <div className="mb-3 col-2">
                  <label htmlFor="createdAt" className="form-label"> 
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                    Fecha de renovación
                  </label>
                  <input
                    required
                    type="date"
                    className="form-control"
                    id="createdAt"
                    name="createdAt"
                    value={form.createdAt || ""}
                    min={minRenewalDate}
                    onChange={changed}
                  />
                  {formError && (
                    <div className="invalid-feedback d-block">{formError}</div>
                  )}
                  <small className="text-muted text-danger fs-6">
                    Fecha mínima: {minRenewalDate && (() => {
                      const [year, month, day] = minRenewalDate.split('-');
                      const date = new Date(year, month - 1, day);
                      return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
                    })()}
                  </small>
                </div>

                <div className="mb-3 col-2">
                  <label htmlFor="payment_frequency_id" className="form-label">
                    <FontAwesomeIcon icon={faSync} className="me-2" />
                    Frecuencia de pago
                  </label>
                  <select
                    className="form-select"
                    id="payment_frequency_id"
                    name="payment_frequency_id"
                    onChange={handleFrequencyChange}
                    value={form.payment_frequency_id || 0} // Establece el valor predeterminado
                  >
                    <option value={0} disabled>Escoja una opción</option>
                    {frequency.map((freq) => (
                      <option key={freq.id} value={freq.id}>
                        {freq.frequencyName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3 col-2">
                  <label htmlFor="numberOfPayments" className="form-label">
                    <FontAwesomeIcon icon={faHashtag} className="me-2" />
                    Número de Pagos
                  </label>
                  <input
                    readOnly
                    type="number"
                    className="form-control"
                    id="numberOfPayments"
                    name="numberOfPayments"
                    value={form.numberOfPayments || 0}
                  />
                </div>

                <div className="mb-3 col-2">
                  <label htmlFor="paymentsToAgency" className="form-label">
                    <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                    Comisiones de la agencia
                  </label>
                  <input
                    readOnly
                    required
                    type="number"
                    className="form-control"
                    id="paymentsToAgency" 
                    name="paymentsToAgency" 
                    value={form.paymentsToAgency || 0}
                  />
                </div>

                <div className="mb-3 col-2">
                  <label htmlFor="paymentsToAdvisor" className="form-label">
                    <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                    Comisiones de asesor
                  </label>
                  <input
                    readOnly
                    required
                    type="number"
                    className="form-control"
                    id="paymentsToAdvisor"
                    name="paymentsToAdvisor"
                    value={form.paymentsToAdvisor || 0}
                  />
                </div>

                <div className="mb-2 col-6">
                  <label htmlFor="observations" className="form-label">
                    <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                    Observaciones
                  </label>
                  <textarea
                    className="form-control"
                    id="observations"
                    name="observations"
                    onChange={changed}
                    value={form.observations || ""} // ✅ Corregir valor hardcodeado
                    rows="3"
                    placeholder="Ingrese observaciones de la renovación..."
                  />
                </div>

                <div className="d-flex justify-content-around mt-4"> {/* ✅ Mejorar estructura */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn bg-success mx-5 text-white fw-bold"
                  >
                    {isLoading ? (
                      <>
                        <div className="spinner-border spinner-border-sm text-light me-2" role="status">
                          <span className="visually-hidden">Renovando...</span> {/* ✅ Corregir texto */}
                        </div>
                        Renovando...
                      </>
                    ) : (
                      <>
                        Renovar Póliza
                        <FontAwesomeIcon className="mx-2" icon={faFloppyDisk} beat />
                      </>
                    )}
                  </button>

                  <button
                    type="button" // ✅ Cambiar de "submit" a "button"
                    onClick={onClose}
                    className="btn bg-danger mx-5 text-white fw-bold"
                  >
                    Cerrar
                    <FontAwesomeIcon className="mx-2" beat icon={faRectangleXmark} />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </article>
      </div>
    </>
  );
};

RenewallPolicyModal.propTypes = {
  policy: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    numberPolicy: PropTypes.string.isRequired,
    coverageAmount: PropTypes.number.isRequired,
    startDate: PropTypes.string.isRequired,
    paymentsToAgency: PropTypes.number,
    paymentsToAdvisor: PropTypes.number,
    periods: PropTypes.arrayOf(
      PropTypes.shape({
        year: PropTypes.number.isRequired,
        agencyPercentage: PropTypes.number.isRequired,
        advisorPercentage: PropTypes.number.isRequired,
        policyValue: PropTypes.number.isRequired,
        policyFee: PropTypes.number.isRequired,
      })
    ).isRequired,
    renewals: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        renewalNumber: PropTypes.number.isRequired,
        createdAt: PropTypes.shape({
          year: PropTypes.number.isRequired,
        }).isRequired,
      })
    ),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onPolicyUpdated: PropTypes.func.isRequired,
};

export default RenewallPolicyModal;