import PropTypes from "prop-types";
import UserForm from "../../hooks/UserForm";
import { useEffect, useState, useCallback } from "react"; 
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { calculateAdvisorAndAgencyPayments } from "../../helpers/CommissionUtils";

const RenewallPolicyModal = ({ policy, onClose, onPolicyUpdated }) => {
  const lastPeriod = policy.periods.reduce((a, b) => (a.year > b.year ? a : b));
  
  if (!policy) return null;

  console.log("poliza obtenida: ", policy);
  
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [isDataValid, setIsDataValid] = useState(true);

  const { form, changed, setForm } = UserForm({
    policy_id: policy.id,
    coverageAmount: policy.coverageAmount,
    agencyPercentage: lastPeriod.agencyPercentage,
    advisorPercentage: lastPeriod.advisorPercentage,
    policyValue: lastPeriod.policyValue,
    policyFee: lastPeriod.policyFee,
    paymentsToAgency: policy.paymentsToAgency || 0,
    paymentsToAdvisor: policy.paymentsToAdvisor || 0,
  });

  // ✅ Convertir addClassSafely a useCallback
  const addClassSafely = useCallback((id, className) => {
    const element = document.getElementById(id);
    if (element) element.classList.add(className);
  }, []);

  // ✅ Convertir calculateAdvisorPayment a useCallback
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
  }, [
    form.policyValue,
    form.policyFee,
    form.agencyPercentage,
    form.advisorPercentage,
    changed,
    addClassSafely
  ]);

  // ✅ Convertir renewalAndUpdatePolicy a useCallback
  const renewalAndUpdatePolicy = useCallback(async (e) => {
    e.preventDefault();
    const renewalDateValue = document.getElementById("createdAt").value;
    const enteredYear = new Date(renewalDateValue).getFullYear();

    // Validation: year must be greater than last renewal year
    if (enteredYear < lastRenewalYear) {
      addClassSafely("createdAt", "is-invalid");
      setFormError(`El año de renovación debe ser mayor a ${lastRenewalYear}`);
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

        // Llamar a la función de callback para propagar el cambio
        onPolicyUpdated(renewalRequest.data.newRenewal);
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
    policy.id,
    onPolicyUpdated,
    onClose,
    addClassSafely
  ]);

  // Actualizar el número de renovación cuando se recibe el prop `policy`
  useEffect(() => {
    if (policy && policy.renewals) {
      // Usar directamente la longitud del array + 1 para asegurar secuencia correcta
      const newRenewalNumber = policy.renewals.length + 1;
      setForm((prevForm) => ({
        ...prevForm,
        renewalNumber: newRenewalNumber,
      }));
    } else {
      setForm((prevForm) => ({
        ...prevForm,
        renewalNumber: 1, // Valor por defecto si no hay renovaciones
      }));
    }
  }, [policy, setForm]);

  useEffect(() => {
    if (!policy) {
      console.error("Error al recibir el objeto", policy);
      setIsDataValid(false);
      return;
    }
  }, [policy]);

  useEffect(() => {
    calculateAdvisorPayment();
  }, [calculateAdvisorPayment]);

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
                  <label htmlFor="createdAt" className="form-label"> {/* ✅ Corregir htmlFor */}
                    Fecha de renovación
                  </label>
                  <input
                    required
                    type="date"
                    className="form-control"
                    id="createdAt"
                    name="createdAt"
                    onChange={changed}
                  />
                  {formError && (
                    <div className="invalid-feedback d-block">{formError}</div>
                  )}
                </div>

                <div className="mb-3 col-2">
                  <label htmlFor="paymentsToAgency" className="form-label">
                    Comisiones de la agencia
                  </label>
                  <input
                    readOnly
                    required
                    type="number"
                    className="form-control"
                    id="paymentsToAgency" // ✅ Corregir espacio extra
                    name="paymentsToAgency" // ✅ Corregir espacio extra
                    value={form.paymentsToAgency || 0}
                  />
                </div>

                <div className="mb-3 col-2">
                  <label htmlFor="paymentsToAdvisor" className="form-label">
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