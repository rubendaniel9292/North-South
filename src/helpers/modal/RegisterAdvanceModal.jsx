import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import http from "../../helpers/Http";

const RegisterAdvanceModal = ({ advisorId, onClose }) => {
  if (!advisorId) return null;
  const [isLoading, setIsLoading] = useState(false);
  // Manejar el caso de datos no disponibles, pero después de llamar a los hooks
  const [isDataValid, setIsDataValid] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState([]);
  const option = "Escoja una opción";
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companyResponse, paymentMethodResponse] = await Promise.all([
          http.get("company/get-all-company"),
          http.get("policy/get-payment-method"),
        ]);
        setCompanies(companyResponse.data.allCompanies);
        console.log("Compañias: ", companyResponse.data.allCompanies);
        setPaymentMethod(paymentMethodResponse.data.allPaymentMethod);
      } catch (error) {
        //alerts("Error", "Error fetching data.", error);
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto">
        <article className="modal-content text-center px-5 py-5">
          <div className="d-flex justify-content-center align-items-center conten-title rounded mb-3">
            <h3 className="text-white fw-bold">
              Registro de anticipio a: {advisorId.firstName} {advisorId.surname}
            </h3>
          </div>
          <div className="d-flex justify-content-around mt-5">
            <form onSubmit={""} id="user-form">
              <div className="row">
                <div className="mb-4  d-none">
                  <label htmlFor="advisor_id" className="form-label">
                    Id Asesor
                  </label>
                  <input
                    required
                    type="number"
                    className="form-control"
                    id="advisor_id"
                    name="advisor_id"
                    //onChange={handleChange}
                    value={advisorId.id}
                    readOnly
                  />
                </div>
                <div className="mb-3 col-4">
                  <label htmlFor="receiptNumber" className="form-label">
                    Número de Recibo
                  </label>
                  <input
                    required
                    readOnly
                    id="receiptNumber"
                    type="string"
                    className="form-control"
                    name="receiptNumber"
                    //value={form.renewalNumber}
                    //onChange={handleChange}
                  />
                </div>
                <div className="mb-3 col-4">
                  <label htmlFor="company_id" className="form-label">
                    Compañía
                  </label>
                  <select
                    className="form-select"
                    id="company_id"
                    name="company_id"
                    //onChange={changed}
                    defaultValue={option}
                  >
                    <option disabled>{option}</option>
                    {companies.map((copmany) => (
                      <option key={copmany.id} value={copmany.id}>
                        {copmany.companyName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3 col-4">
                  <label htmlFor="payment_method_id" className="form-label">
                    Metodo de abono
                  </label>
                  <select
                    className="form-select"
                    id="payment_method_id"
                    name="payment_method_id"
                    //onChange={handlePaymentMethodChange} // Cambiado aquí
                    defaultValue={option}
                  >
                    <option disabled>{option}</option>
                    {paymentMethod.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.methodName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3 col-4">
                  <label htmlFor=" advanceValue" className="form-label">
                    Valor del anticipio
                  </label>
                  <input
                    required
                    type="number"
                    className="form-control"
                    id=" advanceValue"
                    name=" advanceValue"
                    step="0.01"
                    //value={Number(form.value).toFixed(2)}
                    //onChange={handleChange}
                    readOnly
                  />
                </div>

                <div className="mb-3 col-4">
                  <label htmlFor="balance" className="form-label">
                    Fecha del anticipo
                  </label>
                  <input
                    required
                    type="date"
                    className="form-control"
                    id="createdAt"
                    name="createdAt"
                    //value={form.createdAt}
                    //onChange={handleChange}
                  />
                </div>

                <div className="mb-3 col-4">
                  <label htmlFor="observations" className="form-label">
                    Observaciones
                  </label>
                  <textarea
                    type="text"
                    className="form-control"
                    id="observations"
                    name="observations"
                    //onChange={handleChange}
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
                      "Registrar Pago"
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

RegisterAdvanceModal.propTypes = {
  advisorId: PropTypes.shape({
    id: PropTypes.number.isRequired,
    firstName: PropTypes.string.isRequired,
    secondName: PropTypes.string,
    surname: PropTypes.string.isRequired,
    secondSurname: PropTypes.string,
  }).isRequired,
};
export default RegisterAdvanceModal;
