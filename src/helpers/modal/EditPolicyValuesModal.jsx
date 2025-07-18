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

  // SOLO UN useEffect para cargar los datos cuando cambia la póliza

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
  const handleFieldChange = (idx, field, value) => {
    const newPeriods = [...form.periods];
    newPeriods[idx] = {
      ...newPeriods[idx],
      [field]: value,
      isChanged: true,
    };
    setForm({ periods: newPeriods });
  };

  // Enviar los cambios al backend (pagos + periodos anuales)
  const handleUpdate = async () => {
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
        alerts(
          "¡Actualizado!",
          "Los valores han sido actualizados correctamente",
          "success"
        );
        await fetchPeriods();
        onPolicyUpdated();
        onClose();
      } else {
        alerts("Error", "No se pudo actualizar ningún periodo", "error");
        onClose();
      }
    } catch (error) {
      // Este catch solo se ejecutaría si Promise.allSettled lanza error, lo cual es raro.
      console.log("ERROR EN CATCH:", error); //
      alerts("Error", "No se pudo actualizar los valores", "error");
      setIsLoading(false);
      onClose();
    }
  };

  // Manejo robusto de carga y error
  if (fetchError) {
    return (
      <div className="text-center py-5 text-danger">
        Error al cargar periodos de la póliza.
        <br />
        <button
          className="btn btn-secondary mt-3"
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
    <div className="modal d-flex justify-content-center align-items-center ">
      <article className="modal-content text-center">
        <div className="container py-2">
          <h2 className="">Editar valores y porcentajes por año</h2>
          <div className="py-1">
            <strong>Póliza:</strong>{" "}
            <span className="badge bg-secondary">{policy.numberPolicy}</span>
          </div>
          <div className="py-1">
            <strong>Cliente:</strong> {getCustomerName()}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdate();
            }}
          >
            {form.periods.map((row, idx) => (
              <div className="row" key={row.year}>
                <div className="col-3  mt-1">
                  <label className="form-label fw-semibold mx-1">AÑO</label>
                  <div className="badge bg-light text-dark border mx-1">
                    {row.year}
                  </div>
                </div>
                <div className="d-none">
                  <input
                    type="number"
                    required
                    name="policy_id"
                    value={policy.id}
                  />
                </div>
                <div className="col-2  mt-1">
                  <label className="form-label fw-semibold mx-1">
                    VALOR DE LA PÓLIZA
                  </label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={row.value}
                    onChange={(e) =>
                      handleFieldChange(idx, "value", e.target.value)
                    }
                    min="0"
                  />
                </div>
                <div className="col-2 mt-1">
                  <label className="form-label fw-semibold mx-1">
                    DERECHO DE PÓLIZA
                  </label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={row.policyFee}
                    onChange={(e) =>
                      handleFieldChange(idx, "policyFee", e.target.value)
                    }
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-2 mt-1">
                  <label className="form-label fw-semibold mx-1">
                    % AGENCIA
                  </label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={row.agencyPercentage}
                    onChange={(e) =>
                      handleFieldChange(idx, "agencyPercentage", e.target.value)
                    }
                    min="0"
                    max="100"
                  />
                </div>
                <div className="col-2 mt-1">
                  <label className="form-label fw-semibold mx-1">
                    % ASESOR
                  </label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={row.advisorPercentage}
                    onChange={(e) =>
                      handleFieldChange(
                        idx,
                        "advisorPercentage",
                        e.target.value
                      )
                    }
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            ))}

            <div className="d-flex justify-content-between mt-2">
              <button
                className="btn btn-success  fw-bold d-flex align-items-center justify-content-center"
                style={{ minWidth: 200, transition: "transform 0.2s" }}
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Actualizando..." : "ACTUALIZAR CAMPOS"}

                <FontAwesomeIcon
                  className="ms-2"
                  icon={faFloppyDisk}
                  beat={!isLoading}
                />
              </button>
              <button
                className="btn btn-danger  fw-bold d-flex align-items-center justify-content-center"
                style={{ minWidth: 200, transition: "transform 0.2s" }}
                type="button"
                onClick={onClose}
                disabled={isLoading}
              >
                CERRAR
                <FontAwesomeIcon className="ms-2" icon={faTimes} beat />
              </button>
            </div>
          </form>
        </div>
      </article>
    </div>
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
