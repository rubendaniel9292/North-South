import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import http from "../Http";
import alerts from "../Alerts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk, faTimes } from "@fortawesome/free-solid-svg-icons";
import UserForm from "../../hooks/UserForm";

// Utilidad para obtener el año de inicio de la póliza
const getInitialYear = (policy) => {
  if (policy.startDate) return new Date(policy.startDate).getFullYear();
  if (policy.createdAt) return new Date(policy.createdAt).getFullYear();
  return new Date().getFullYear(); // Fallback
};

const EditPolicyValuesModal = ({ policy, onClose, onPolicyUpdated }) => {
  // Inicializa el form SOLO una vez, con valores básicos. No se re-inicializa automáticamente.
  // Usa los periodos del policy si existen, si no genera uno por defecto
  const initialPeriods =
    Array.isArray(policy.periods) && policy.periods.length > 0
      ? policy.periods.map((period) => ({
          policy_id: policy.id,
          year: period.year,
          value: period.policyValue,
          agencyPercentage: period.agencyPercentage,
          advisorPercentage: period.advisorPercentage,
          policyFee: period.policyFee,
          isChanged: false,
        }))
      : [
          {
            policy_id: policy.id,
            year: getInitialYear(policy),
            value: policy.policyValue,
            agencyPercentage: policy.agencyPercentage,
            advisorPercentage: policy.advisorPercentage,
            policyFee: policy.policyFee,
            isChanged: false,
          },
        ];
  const { form, setForm } = UserForm({ periods: initialPeriods });
  console.log("polizas con periodos:", policy);

  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Carga los periodos del backend SOLO cuando cambia la policy.id
  const fetchPeriods = useCallback(async () => {
    if (!policy?.id) return;
    setFetchError(false);
    setIsLoading(true);
    try {
      const res = await http.get(`policy/${policy.id}/periods`);
      const periods = Array.isArray(res.data)
        ? res.data.map((period) => ({
            year: period.year,
            value: period.policyValue ?? period.policy_value,
            agencyPercentage:
              period.agencyPercentage ?? period.agency_percentage,
            advisorPercentage:
              period.advisorPercentage ?? period.advisor_percentage,
            policyFee: period.policyFee ?? period.policy_fee,

            isChanged: false,
          }))
        : [];
      setForm({ periods });
    } catch (error) {
      setFetchError(true);
      setForm({ periods: initialPeriods });
    } finally {
      setIsLoading(false);
    }
  }, [policy?.id]);

  //useEffect para cargar los datos cuando cambia la póliza

  useEffect(() => {
    // Solo recarga si hay dudas sobre la frescura de los datos,
    // o si policy.periods está vacío y quieres intentar traerlos del backend.
    if (!Array.isArray(policy.periods) || policy.periods.length === 0) {
      fetchPeriods();
    }
  }, [fetchPeriods, policy.periods]);

  // Función para obtener el nombre completo del cliente en mayúsculas
  const getCustomerName = () =>
    policy.customer
      ? [
          policy.customer.firstName,
          policy.customer.secondName,
          policy.customer.surname,
          policy.customer.secondSurname,
        ]
          .filter(Boolean)
          .join(" ")
          .toUpperCase()
      : "";

  // Manejador de cambios en los inputs
  const handleFieldChange = useCallback(
    (idx, field, value) => {
      const newPeriods = [...form.periods];
      newPeriods[idx] = {
        ...newPeriods[idx],
        [field]: value,
        isChanged: true,
      };
      setForm({ periods: newPeriods });
    },
    [form.periods, setForm]
  ); // ✅ Dependencias

  // Enviar los cambios al backend (pagos + periodos anuales)
  const handleUpdate = useCallback(async () => {
    setIsLoading(true);
    // 1. Valida antes de enviar
    const periodsToUpdate = form.periods.filter((row) => row.isChanged);

    if (periodsToUpdate.length === 0) {
      alerts("Nada que actualizar", "No has modificado ningún valor.", "info");
      setIsLoading(false);
      return;
    }

    // 2. Validación de campos
    for (let row of periodsToUpdate) {
      if (
        isNaN(row.value) ||
        row.value === "" ||
        row.value < 0 ||
        isNaN(row.agencyPercentage) ||
        row.agencyPercentage < 0 ||
        row.agencyPercentage > 100 ||
        isNaN(row.advisorPercentage) ||
        row.advisorPercentage < 0 ||
        row.advisorPercentage > 100 ||
        row.policyFee === "" ||
        isNaN(row.policyFee) ||
        row.policyFee < 0
      ) {
        alerts(
          "Error de validación",
          `Hay valores inválidos en el año ${row.year}.`,
          "warning"
        );
        setIsLoading(false);
        return;
      }
    }

    try {
      const responses = await Promise.allSettled(
        periodsToUpdate.map((row) =>
          http.put(`policy/update-values-by-year/${policy.id}/${row.year}`, {
            policy_id: policy.id,
            year: Number(row.year),
            policyValue: parseFloat(row.value),
            agencyPercentage: parseFloat(row.agencyPercentage),
            advisorPercentage: parseFloat(row.advisorPercentage),
            policyFee: parseFloat(row.policyFee),
          })
        )
      );

      // Busca al menos un éxito real, según la estructura del response
      const fulfilled = responses.filter((res) => res.status === "fulfilled");

      const atLeastOneSuccess = fulfilled.some(
        (res) =>
          // Si tu helper http retorna el objeto Axios completo
          res.value?.data?.status === "success" ||
          // Si retorna directamente el objeto JSON (fetch)
          res.value?.status === "success"
      );

      if (atLeastOneSuccess) {
        await fetchPeriods();
        onPolicyUpdated();
        setTimeout(() => {
          alerts(
            "¡Actualizado!",
            "Los valores han sido actualizados correctamente",
            "success"
          );

          onClose();
        }, 500);
      } else {
        alerts("Error", "No se pudo actualizar ningún periodo", "error");
        onClose();
      }
    } catch (error) {
      console.log("ERROR EN CATCH:", error);
      alerts("Error", "No se pudo actualizar los valores", "error");
      setIsLoading(false);
      onClose();
    }
  }, [form.periods, policy.id, fetchPeriods, onPolicyUpdated, onClose]); // ✅ Dependencias
  // Manejo robusto de carga y error
  if (fetchError) {
    return (
      <div className="text-center py-5 text-danger">
        Error al cargar periodos de la póliza.
        <br />
        <button
          className="btn btn-secondary mt-2"
          onClick={fetchPeriods}
          disabled={isLoading}
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!form.periods.length || isLoading) {
    return (
      <div className="text-center py-5">Cargando periodos de la póliza...</div>
    );
  }

  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center">
        <article
          className="modal-content "
          style={{ maxWidth: "900px", width: "92vw" }}
        >
          <div className="modal-header  conten-title text-white text-center">
            <h2 className="modal-title mb-0">
              <i className="fas fa-edit m-2"></i>
              Editar valores y porcentajes por año
            </h2>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={isLoading}
            ></button>
          </div>

          <div className="modal-body">
            {/* Info Card */}
            <div className="card mb-2 border-3 bg-light">
              <div className="card-body py-2">
                <div className="row">
                  <div className="col-md-6">
                    <strong className="text-muted">Póliza:</strong>
                    <span className="badge bg-primary ms-2 fs-6">
                      {policy.numberPolicy}
                    </span>
                  </div>
                  <div className="col-md-6">
                    <strong className="text-muted">Cliente:</strong>
                    <span className="ms-2 fw-semibold">
                      {getCustomerName()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdate();
              }}
            >
              {/* Períodos Cards */}
              <div className="row">
                {[...form.periods]
                  .sort((a, b) => Number(a.year) - Number(b.year))
                  .map((row, idx) => {
                    const realIdx = form.periods.findIndex(
                      (p) => p.year === row.year
                    );

                    return (
                      <div className="col-12" key={row.year}>
                        <div
                          className={`card border-start border-3 ${
                            row.isChanged
                              ? "border-warning"
                              : "border-secondary"
                          }`}
                        >
                          <div className="card-header bg-transparent">
                            <div className="d-flex align-items-center">
                              <span className="badge bg-dark fs-6 me-2">
                                AÑO {row.year}
                              </span>
                              {row.isChanged && (
                                <span className="badge bg-warning text-dark">
                                  <i className="fas fa-exclamation-triangle me-1"></i>
                                  Modificado
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="card-body">
                            <div className="row g-3">
                              {/* Valor de Póliza */}
                              <div className="col-lg-3 col-md-6">
                                <label className="form-label fw-semibold text-muted small">
                                  <i className="fas fa-dollar-sign me-1"></i>
                                  VALOR DE LA PÓLIZA
                                </label>
                                <div className="input-group">
                                  <span className="input-group-text">$</span>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={row.value}
                                    onChange={(e) =>
                                      handleFieldChange(
                                        realIdx,
                                        "value",
                                        e.target.value
                                      )
                                    }
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                              </div>

                              {/* Derecho de Póliza */}
                              <div className="col-lg-3 col-md-6">
                                <label className="form-label fw-semibold text-muted small">
                                  <i className="fas fa-receipt me-1"></i>
                                  DERECHO DE PÓLIZA
                                </label>
                                <div className="input-group">
                                  <span className="input-group-text">$</span>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={row.policyFee}
                                    onChange={(e) =>
                                      handleFieldChange(
                                        realIdx,
                                        "policyFee",
                                        e.target.value
                                      )
                                    }
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                              </div>

                              {/* % Agencia */}
                              <div className="col-lg-3 col-md-6">
                                <label className="form-label fw-semibold text-muted small">
                                  <i className="fas fa-building me-1"></i>%
                                  AGENCIA
                                </label>
                                <div className="input-group">
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={row.agencyPercentage}
                                    onChange={(e) =>
                                      handleFieldChange(
                                        realIdx,
                                        "agencyPercentage",
                                        e.target.value
                                      )
                                    }
                                    min="0"
                                    max="100"
                                    step="0.01"
                                  />
                                  <span className="input-group-text">%</span>
                                </div>
                              </div>

                              {/* % Asesor */}
                              <div className="col-lg-3 col-md-6">
                                <label className="form-label fw-semibold text-muted small">
                                  <i className="fas fa-user-tie me-1"></i>%
                                  ASESOR
                                </label>
                                <div className="input-group">
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={row.advisorPercentage}
                                    onChange={(e) =>
                                      handleFieldChange(
                                        realIdx,
                                        "advisorPercentage",
                                        e.target.value
                                      )
                                    }
                                    min="0"
                                    max="100"
                                    step="0.01"
                                  />
                                  <span className="input-group-text">%</span>
                                </div>
                              </div>
                            </div>

                            {/* Preview de cálculos */}
                            <div className="row mt-1">
                              <div className="col-12">
                                <div className="alert alert-info py-1">
                                  <small>
                                    <strong>Comisión Agencia:</strong> $
                                    {(
                                      ((row.value - row.policyFee) *
                                        row.agencyPercentage) /
                                      100
                                    ).toFixed(2)}{" "}
                                    |
                                    <strong className="ms-2">
                                      Comisión Asesor:
                                    </strong>{" "}
                                    $
                                    {(
                                      ((row.value - row.policyFee) *
                                        row.advisorPercentage) /
                                      100
                                    ).toFixed(2)}
                                  </small>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </form>
          </div>

          {/* Footer con botones */}
          <div className="modal-footer bg-light">
            <div className="w-100 d-flex justify-content-between">
              <button
                className="btn btn-danger px-4 fw-bold"
                type="button"
                onClick={onClose}
                disabled={isLoading}
              >
                <FontAwesomeIcon className="me-2" icon={faTimes} />
                Cancelar
              </button>

              <button
                className="btn btn-success px-4 fw-bold"
                type="submit"
                disabled={isLoading}
                onClick={handleUpdate}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Actualizando...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon className="me-2" icon={faFloppyDisk} />
                    Actualizar Campos
                  </>
                )}
              </button>
            </div>
          </div>
        </article>
      </div>
    </>
  );
};

EditPolicyValuesModal.propTypes = {
  policy: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    numberPolicy: PropTypes.string,
    policyValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    agencyPercentage: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    policyFee: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    advisorPercentage: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    startDate: PropTypes.string,
    createdAt: PropTypes.string,
    customer: PropTypes.object,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdated: PropTypes.func.isRequired,
};

export default EditPolicyValuesModal;
