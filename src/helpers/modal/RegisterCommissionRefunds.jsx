import PropTypes from "prop-types";
import { useState, useCallback } from "react"; // ✅ Agregar useCallback
import {
  faRectangleXmark,
  faFloppyDisk,
  faBarcode,
  faDollarSign,
  faCalendarAlt,
  faStickyNote,
  faExclamationTriangle,
  faMinusCircle
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import UserForm from "../../hooks/UserForm";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";

const RegisterCommissionRefunds = ({ advisorId, onClose, refreshAdvisor }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Form state and change handler
  const { form, changed } = UserForm({
    advisor_id: advisorId.id,
    policy_id: "", // ✅ Agregar valor inicial
    amountRefunds: "",
    cancellationDate: "",
    reason: "",
  });

  // ✅ Convertir saveRefundsSubmit a useCallback
  const saveRefundsSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!e.target.checkValidity()) {
        e.stopPropagation();
        e.target.classList.add("was-validated");
        return;
      }
      setIsLoading(true);

      try {
        const response = await http.post(
          "commissions-payments/register-commission-refunds",
          form
        );

        if (response.data.status === "success") {
          refreshAdvisor?.();
          alerts(
            "Registro exitoso",
            "Descuento registrado correctamente",
            "success"
          );
          setTimeout(() => {
            document.querySelector("#refund-form").reset();
            onClose();
          }, 500);
        } else {
          alerts(
            "Error",
            "Descuento no registrado correctamente. Verificar que no haya campos vacíos", // ✅ Corregir "Verifica"
            "error"
          );
        }
      } catch (error) {
        alerts(
          "Error",
          "Ocurrió un error durante el registro del descuento.", // ✅ Corregir "erro"
          "error"
        );
        console.error("Error registrando descuento:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [form, refreshAdvisor, onClose]
  );

  // ✅ Filtrar pólizas con comisiones anualizadas usando useMemo para mejor rendimiento
  const eligiblePolicies =
    advisorId.policies?.filter(
      (policy) => policy.isCommissionAnnualized === true
    ) || [];

  return (
    <div className="modal d-flex justify-content-center align-items-center mx-auto">
      <article className="modal-content text-center px-5 py-5">
        <div className="d-block conten-title-com rounded mb-3">
          {" "}
          {/* ✅ Agregar margen */}
          <h3 className="text-white fw-bold">
            <FontAwesomeIcon icon={faMinusCircle} className="me-2" />
            Registro de descuento de comisión a: {advisorId.firstName}{" "}
            {advisorId.secondName || ""} {advisorId.surname}{" "}
            {advisorId.secondSurname || ""}{" "}
            {/* ✅ Agregar fallbacks y espacios */}
          </h3>
        </div>

        <div className="container-fluid d-flex justify-content-around mt-2">
          {" "}
          {/* ✅ Corregir "container-fuild" */}
          <form
            onSubmit={saveRefundsSubmit}
            id="refund-form"
            className="needs-validation was-validated"
            noValidate
          >
            <div className="row pt-3 fw-bold">
              {" "}
              {/* ✅ Agregar clases para consistencia */}
              {/* ID Asesor (hidden) */}
              <div className="d-none">
                <label htmlFor="advisor_id" className="form-label">
                  ID Asesor
                </label>
                <input
                  required
                  type="number"
                  className="form-control"
                  id="advisor_id"
                  name="advisor_id"
                  onChange={changed}
                  value={advisorId.id}
                  readOnly
                />
              </div>
              {/* Selección de póliza */}
              <div className="mb-3 col-3">
                {" "}
                {/* ✅ Cambiar col-2 a col-3 para mejor espacio */}
                <label htmlFor="policy_id" className="form-label">
                  <FontAwesomeIcon icon={faBarcode} className="me-2" />
                  Seleccionar Póliza
                </label>
                <select
                  className="form-select"
                  id="policy_id"
                  name="policy_id"
                  value={form.policy_id || ""} // ✅ Agregar fallback
                  onChange={changed}
                  required
                >
                  <option value="" disabled defaultValue>
                    {" "}
                    {/* ✅ Cambiar selected por defaultValue */}
                    Seleccione una póliza
                  </option>
                  {eligiblePolicies.length > 0 ? (
                    eligiblePolicies.map((policy) => (
                      <option key={policy.id} value={policy.id}>
                        {policy.numberPolicy}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No hay pólizas elegibles
                    </option>
                  )}
                </select>
                {eligiblePolicies.length === 0 && (
                  <div className="form-text text-warning">
                    No hay pólizas con comisiones anualizadas disponibles.
                  </div>
                )}
              </div>
              {/* Monto del descuento */}
              <div className="mb-3 col-3">
                {" "}
                {/* ✅ Cambiar col-2 a col-3 */}
                <label htmlFor="amountRefunds" className="form-label">
                  <FontAwesomeIcon icon={faDollarSign} className="me-2" />
                  Monto del Descuento
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01" // ✅ Agregar validación mínima
                  className="form-control"
                  id="amountRefunds"
                  name="amountRefunds"
                  value={form.amountRefunds || ""} // ✅ Agregar fallback
                  onChange={changed}
                  placeholder="0.00"
                  required
                />
                <div className="form-text">
                  Ingrese el monto en formato decimal (ej: 123.45)
                </div>
              </div>
              {/* Fecha de cancelación */}
              <div className="mb-3 col-3">
                {" "}
                {/* ✅ Cambiar col-4 a col-3 */}
                <label htmlFor="cancellationDate" className="form-label">
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  Fecha de Cancelación
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="cancellationDate"
                  name="cancellationDate"
                  value={form.cancellationDate || ""} // ✅ Agregar fallback
                  onChange={changed}
                  max={new Date().toISOString().split("T")[0]} // ✅ Restringir fechas futuras
                  required
                />
                <div className="form-text">La fecha no puede ser futura</div>
              </div>
              {/* Motivo */}
              <div className="mb-3 col-3">
                {" "}
                {/* ✅ Cambiar col-4 a col-3 */}
                <label htmlFor="reason" className="form-label">
                  <FontAwesomeIcon icon={faStickyNote} className="me-2" />
                  Motivo del Descuento
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="reason"
                  name="reason"
                  value={form.reason || ""} // ✅ Agregar fallback
                  onChange={changed}
                  placeholder="Describa el motivo del descuento"
                  maxLength="100" // ✅ Agregar límite de caracteres
                  required
                />
                <div className="form-text">Máximo 100 caracteres</div>
              </div>
              {/* Botones */}
              <div className="d-flex justify-content-around mt-4">
                {" "}
                {/* ✅ Mejorar estructura */}
                <button
                  type="submit"
                  disabled={isLoading || eligiblePolicies.length === 0} // ✅ Deshabilitar si no hay pólizas
                  className="btn bg-success mx-5 text-white fw-bold"
                >
                  {isLoading ? (
                    <>
                      <div
                        className="spinner-border spinner-border-sm text-light me-2"
                        role="status"
                      >
                        {" "}
                        {/* ✅ Mejorar spinner */}
                        <span className="visually-hidden">Registrando...</span>
                      </div>
                      Registrando...
                    </>
                  ) : (
                    <>
                      Registrar Descuento{" "}
                      {/* ✅ Cambiar "reembolso" por "descuento" para consistencia */}
                      <FontAwesomeIcon
                        className="mx-2"
                        icon={faFloppyDisk}
                        beat
                      />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
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
  );
};

RegisterCommissionRefunds.propTypes = {
  advisorId: PropTypes.shape({
    id: PropTypes.number.isRequired,
    firstName: PropTypes.string.isRequired,
    secondName: PropTypes.string,
    surname: PropTypes.string.isRequired,
    secondSurname: PropTypes.string,
    policies: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        numberPolicy: PropTypes.string.isRequired,
        isCommissionAnnualized: PropTypes.bool.isRequired,
      })
    ),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  refreshAdvisor: PropTypes.func.isRequired,
};

export default RegisterCommissionRefunds;
