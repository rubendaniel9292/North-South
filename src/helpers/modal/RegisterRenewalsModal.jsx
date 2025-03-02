import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import alerts from "../Alerts";
import http from "../Http";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
const RegisterRenewalsModal = ({ policy, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  // Manejar el caso de datos no disponibles, pero después de llamar a los hooks
  const [isDataValid, setIsDataValid] = useState(true);
  const [form, setForm] = useState({
    renewalNumber: policy.renewals.renewalNumber,
  });
  useEffect(() => {
    console.log("poliza recibida en el modal: ", policy);
    console.log("Estado actualizado del formulario de pago:", form);
  }, [form, policy]);

  // Actualizar el número de renovacion cuando se recibe el prop `policy`
  useEffect(() => {
    if (policy && policy.renewals) {
      const lastRenowalNumber = policy.renewals.length
        ? policy.renewals[policy.renewals.length - 1].renewalNumber
        : 0;
      setForm((prevForm) => ({
        ...prevForm,
        renewalNumber: lastRenowalNumber + 1, // Incrementar el último número de pago
      }));
    } else {
      setForm((prevForm) => ({
        ...prevForm,
        renewalNumber: 1, // Valor por defecto si no hay datos de `payment`
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => {
      const updatedForm = { ...prevForm, [name]: value };
      return updatedForm;
    });
  };

  const savedRenoval = async (e) => {
    setIsLoading(true);
    try {
      e.preventDefault();
      //let newPayment = form;
      const newReneval = { ...form, policy_id: policy.id };
      const request = await http.post("policy/register-renewal", newReneval);
      console.log(request.data);
      if (request.data.status === "success") {
        alerts(
          "Registro exitoso",
          "Renovación registrada  correctamente",
          "success"
        );
        document.querySelector("#user-form").reset();
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        alerts(
          "Error",
          "Renovación no registrada correctamente. Verificar que no haya campos vacios o números de pago duplicados",
          "error"
        );
      }
    } catch (error) {
      alerts("Error", "Error fetching policy.", "error");
      console.error("Error fetching policy:", error);
    } finally {
      setIsLoading(false);
    }
  };
  // Si los datos son inválidos, renderizar nada o un mensaje de error
  if (!isDataValid) {
    return <div>Error: Datos de póliza o frecuencia de pago no válidos.</div>;
  }

  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto">
        <article className="modal-content text-center px-5 py-5">
          <div className="d-flex justify-content-center align-items-center conten-title rounded mb-3">
            <h3 className="text-white fw-bold">
              Póliza selecionada: {policy.numberPolicy}
            </h3>
          </div>
          <div className="d-flex justify-content-around mt-5">
            <form onSubmit={savedRenoval} id="user-form">
              <div className="row">
                <div className="mb-4 col-4 d-none">
                  <label htmlFor="policy_id" className="form-label">
                    Id de Póliza
                  </label>
                  <input
                    required
                    type="number"
                    className="form-control"
                    id="policy_id"
                    name="policy_id"
                    onChange={handleChange}
                    value={policy.id}
                    readOnly
                  />
                </div>
                <div className="mb-3 col-6">
                  <label htmlFor="numberRenewal" className="form-label">
                    Número renovacion
                  </label>
                  <input
                    required
                    readOnly
                    id="numberRenewal"
                    type="number"
                    className="form-control"
                    name="renewalNumber"
                    value={form.renewalNumber}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3 col-6">
                  <label htmlFor="balance" className="form-label">
                    Fecha de renovacion
                  </label>
                  <input
                    required
                    type="date"
                    className="form-control"
                    id="createdAt"
                    name="createdAt"
                    value={form.createdAt}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3 col-12">
                  <label htmlFor="observations" className="form-label">
                    Observaciones
                  </label>
                  <textarea
                    type="text"
                    className="form-control"
                    id="observations"
                    name="observations"
                    onChange={handleChange}
                  />
                </div>
                <div className="mt-4 col-12">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn bg-success fw-bold text-white "
                  >
                    {isLoading ? (
                      <div className="spinner-border text-light" role="status">
                        <span className="visually-hidden">Registrando...</span>
                      </div>
                    ) : (
                      "Registrar Renovación"
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

RegisterRenewalsModal.propTypes = {
  policy: PropTypes.shape({
    id: PropTypes.number.isRequired,
    numberPolicy: PropTypes.number.isRequired,

    // Validación del array de pagos dentro de 'policy'
    renewals: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        renewalNumber: PropTypes.number.isRequired,
        createdAt: PropTypes.instanceOf(Date).isRequired,
        observations: PropTypes.string,
      })
    ).isRequired, // Es obligatorio que haya renovaciones en este array
  }).isRequired,

  onClose: PropTypes.func.isRequired,
};
export default RegisterRenewalsModal;
