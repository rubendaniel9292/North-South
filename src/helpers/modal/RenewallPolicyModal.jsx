import PropTypes from "prop-types";
import UserForm from "../../hooks/UserForm";
import { useEffect, useState } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
//import dayjs from "dayjs";
//import "dayjs/locale/es";
import { useCallback } from "react";
import { calculateAdvisorAndAgencyPayments } from "../../helpers/CommissionUtils";
const RenewallPolicyModal = ({ policy, onClose, onPolicyUpdated }) => {
  if (!policy) return null;

  console.log("poliza obtenida: ", policy);
  const [isLoading, setIsLoading] = useState(false);
  const { form, changed, setForm } = UserForm({
    policy_id: policy.id,
    //createdAt:  dayjs(form.createdAt).toISOString(), // Usar versión ISO o convertir
    coverageAmount: policy.coverageAmount,
    policyValue: policy.policyValue,
    policyFee: policy.policyFee || 0,
    agencyPercentage: policy.agencyPercentage,
    advisorPercentage: policy.advisorPercentage,
    paymentsToAgency: policy.paymentsToAgency,
    paymentsToAdvisor: policy.paymentsToAdvisor,
  });
  const addClassSafely = (id, className) => {
    const element = document.getElementById(id);
    if (element) element.classList.add(className);
  };

  const [isDataValid, setIsDataValid] = useState(true);

  // Actualizar el número de renovacion cuando se recibe el prop `policy`
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
  }, [policy]);

  useEffect(() => {
    if (!policy) {
      console.error("Error al recibir el objeto", policy);
      setIsDataValid(false);
      return null;
    }
  }, [policy]);

  // Calcula el pago al asesor con usecallback,  evita la recreación innecesaria de la función en cada renderizado
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
  ]);

  useEffect(() => {
    calculateAdvisorPayment();
  }, [form.policyValue, form.advisorPercentage, calculateAdvisorPayment]);

  const renewalAndUpdatePolicy = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // 2. actualizar y renovar la póliza

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
  };
  if (!isDataValid) {
    return <div>Error: Datos de póliza o frecuencia de pago no válidos.</div>;
  }
  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto">
        <article className="modal-content modal-content-renewal  text-center px-5 py-5">
          <div className="d-flex justify-content-center align-items-center conten-title rounded">
            <h3 className="text-white fw-bold">
              Poliza selecionada a renovar: {policy.numberPolicy}
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
                  <label htmlFor="numberRenewal" className="form-label">
                    Número de renovación
                  </label>
                  <input
                    required
                    readOnly
                    id="numberRenewal"
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
                    onChange={changed} // Llamada a la función
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
                    onChange={changed} // Llamada a la función
                  />
                </div>
                <div className="mb-3 col-2">
                  <label htmlFor="agencyPercentage" className="form-label">
                    Procentaje de la Agencia
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
                    onChange={changed} // Llamada a la función
                    value={form.advisorPercentage}
                  />
                </div>
                <div className="mb-3 col-2">
                  <label htmlFor="balance" className="form-label">
                    Fecha de renovacion
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

                <div className="mb-3 col-2">
                  <label htmlFor="paymentsToAgency" className="form-label">
                    Comisiones de la agencia
                  </label>
                  <input
                    readOnly
                    required
                    type="number"
                    className="form-control"
                    id=" paymentsToAgency"
                    name=" paymentsToAgency"
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
                    type="text"
                    className="form-control"
                    id="observations"
                    name="observations"
                    onChange={changed}
                    value={""}
                  />
                </div>
                <div className="mt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn bg-success mx-5 text-white fw-bold "
                  >
                    {isLoading ? (
                      <div className="spinner-border text-light" role="status">
                        <span className="visually-hidden">Registrando...</span>
                      </div>
                    ) : (
                      "Renovar Póliza"
                    )}

                    <FontAwesomeIcon
                      className="mx-2 "
                      icon={faFloppyDisk}
                      beat
                    />
                  </button>
                  <button
                    type="submit"
                    onClick={onClose}
                    id="btnc"
                    className="btn bg-danger mx-5 text-white fw-bold"
                  >
                    Cerrar
                    <FontAwesomeIcon
                      className="mx-2"
                      beat
                      icon={faRectangleXmark}
                    />
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
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Hacer opcional y permitir string o number
    coverageAmount: PropTypes.number.isRequired,
    policyValue: PropTypes.number.isRequired,
    policyFee: PropTypes.number.isRequired,
    agencyPercentage: PropTypes.number.isRequired,
    advisorPercentage: PropTypes.number.isRequired,
    paymentsToAgency: PropTypes.number.isRequired,
    paymentsToAdvisor: PropTypes.number.isRequired,
    renewals: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired, // Hacer opcional y permitir string o number
        renewalNumber: PropTypes.string.isRequired,
        createdAt: PropTypes.string.isRequired,
      }).isRequired
    ),
  }).isRequired,

  onClose: PropTypes.func.isRequired,
};
export default RenewallPolicyModal;
