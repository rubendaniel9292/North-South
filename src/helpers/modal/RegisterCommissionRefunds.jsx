import PropTypes from "prop-types";
import { useState } from "react";
import {
  faRectangleXmark,
  faFloppyDisk,
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
    amountRefunds: "",
    cancellationDate: "",
    reason: "",
  });

  // Handler para el envío del formulario
  const saveRefundsSubmit = async (e) => {
    e.preventDefault();
    if (!e.target.checkValidity()) {
      e.stopPropagation();
      e.target.classList.add("was-validated");
      return;
    }
    setIsLoading(true);
    try {
      // Aquí deberías llamar a tu endpoint de reembolsos
      // await http.post('/commission-refunds', form);
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
          "Descuento no registrado correctamente. Verifica campos vacíos",
          "error"
        );
      }
    } catch (error) {
      /*equivalente a if (typeof refreshAdvisor === "function") {
            refreshAdvisor();
        } */
      alerts(
        "Error",
        "Ocurrió un erro durante el registro de Descuento.",
        "error"
      );
      console.error("Error registrando descuento:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal d-flex justify-content-center align-items-center mx-auto">
      <article className="modal-content text-center px-5 py-5">
        <div className="d-block conten-title-com rounded">
          <h3 className="text-white fw-bold">
            Registro de descuento de comisión a : {advisorId.firstName}{" "}
            {advisorId.secondName}
            {advisorId.surname} {advisorId.secondSurname}
          </h3>
        </div>
        <div className="container-fuild d-flex justify-content-around mt-2">
          <form
            onSubmit={saveRefundsSubmit}
            id="refund-form"
            className="needs-validation was-validated"
            noValidate
          >
            <div className="row">
              {/* Selección de póliza */}
              <div className=" d-none">
                <label htmlFor="advisor_id" className="form-label">
                  Id Asesor
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
              <div className="mb-3 col-2">
                <label htmlFor="policy_id" className="form-label">
                  Selecciona la póliza
                </label>
                <select
                  className="form-select"
                  id="policy_id"
                  name="policy_id"
                  value={form.policy_id}
                  onChange={changed}
                  required
                >
                  <option value="" disabled selected>
                    Seleccione una póliza
                  </option>
                  {advisorId.policies
                    ?.filter((policy) => policy.isCommissionAnnualized === true)
                    .map((policy) => (
                      <option key={policy.id} value={policy.id}>
                        {policy.numberPolicy}
                      </option>
                    ))}
                </select>
              </div>

              {/* Monto del reembolso */}
              <div className="mb-3 col-2">
                <label htmlFor="amountRefunds" className="form-label">
                  Monto del descuento
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  id="amountRefunds"
                  name="amountRefunds"
                  onChange={changed}
                  required
                />
              </div>

              {/* Fecha de cancelación */}
              <div className="mb-3 col-4">
                <label htmlFor="cancellationDate" className="form-label">
                  Fecha de cancelación
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="cancellationDate"
                  name="cancellationDate"
                  onChange={changed}
                  required
                />
              </div>
              {/* Observaciones */}

              {/* Motivo */}
              <div className="mb-3 col-4">
                <label htmlFor="reason" className="form-label">
                  Motivo del descuento
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="reason"
                  name="reason"
                  onChange={changed}
                  required
                />
              </div>

              {/* Botones */}
              <div className="row">
                <div className="mt-4 col-12">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn bg-success fw-bold text-white"
                  >
                    {isLoading ? (
                      <div className="spinner-border text-light" role="status">
                        <span className="visually-hidden">Registrando...</span>
                      </div>
                    ) : (
                      "Registrar reembolso"
                    )}
                    <FontAwesomeIcon
                      className="mx-2"
                      icon={faFloppyDisk}
                      beat
                    />
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
