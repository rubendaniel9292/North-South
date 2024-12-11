import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const PaymentModalContent = ({ policy, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  // Manejar el caso de datos no disponibles, pero después de llamar a los hooks
  const [isDataValid, setIsDataValid] = useState(true);

  //const [payment, setPayment] = useState(null);

  //const { form, changed } = UserForm({ balance: 0.0 });
  const [form, setForm] = useState({
    //number_payment: 1,
    number_payment: policy.payments.number_payment || 1,
    value: 0,
    balance: 0,
    total: 0,
    observations: "",
  });
  useEffect(() => {
    console.log("poliza recibida en el modal: ", policy);
    console.log("Estado actualizado del formulario de pago:", form);
  }, [form, policy]);

  // Actualizar el número de pago cuando se recibe el prop `policy`
  useEffect(() => {
    if (policy && policy.payments) {
      const lastPaymentNumber = policy.payments.length
        ? policy.payments[policy.payments.length - 1].number_payment
        : 0;
      setForm((prevForm) => ({
        ...prevForm,
        number_payment: lastPaymentNumber + 1, // Incrementar el último número de pago
      }));
    } else {
      setForm((prevForm) => ({
        ...prevForm,
        number_payment: 1, // Valor por defecto si no hay datos de `payment`
      }));
    }
  }, [policy]);

  useEffect(() => {
    if (!policy) {
      console.error("Error al recibir el objeto", policy);
      setIsDataValid(false);
      return null;
    }
    const calculatePaymentValue = () => {
      const paymentFrequency = Number(policy.payment_frequency_id);
      console.log("frecuencia de pago: ", paymentFrequency);
      let value = 0;

      switch (paymentFrequency) {
        case 1: // Pago mensual
          value = (policy.policyValue / 12).toFixed(2);
          break;
        case 2: // Pago trimestral
          value = (policy.policyValue / 4).toFixed(2);
          break;
        case 3: // Pago semestral
          value = (policy.policyValue / 2).toFixed(2);
          break;
        default: // Pago anual
          value = policy.policyValue;
          break;
      }
      return value;
    };
    const value = calculatePaymentValue();
    const credit = Number(form.credit) || 0;
    const balance = (value - credit).toFixed(2);
    const total = value - balance;

    setForm((prevForm) => ({
      ...prevForm,
      policy_id: policy.id,
      value: Number(value),
      balance: Number(balance).toFixed(2),
      total: Number(total),
      //number_payment:payment?.number_payment
    }));
  }, [policy, form.credit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => {
      const updatedForm = { ...prevForm, [name]: value };

      if (name === "credit") {
        const credit = Number(value) || 0;
        const balance = Number(updatedForm.value) - credit;
        updatedForm.balance = balance;
        updatedForm.total = credit;
      }

      return updatedForm;
    });
  };

  const savedPayment = async (e) => {
    setIsLoading(true);
    try {
      e.preventDefault();
      //let newPayment = form;
      const newPayment = { ...form, policy_id: policy.id };
      const request = await http.post("payment/register-payment", newPayment);
      console.log(request.data);
      if (request.data.status === "success") {
        alerts("Registro exitoso", "Pago registrado correctamente", "success");
        document.querySelector("#user-form").reset();
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        alerts(
          "Error",
          "Pago no registrado correctamente. Verificar que no haya campos vacios o números de pago duplicados",
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
          <h4 className=" fw-bold">Valor de la Póliza: {policy.policyValue}</h4>
          <div className="d-flex justify-content-around mt-5">
            <form onSubmit={savedPayment} id="user-form">
              <div className="row">
                <div className="mb-4 col-3">
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
                <div className="mb-3 col-3">
                  <label htmlFor="number_payment" className="form-label">
                    Número de pago
                  </label>
                  <input
                    required
                    readOnly
                    id="number_payment"
                    type="number"
                    className="form-control"
                    name="number_payment"
                    value={form.number_payment}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3 col-3">
                  <label htmlFor="valueToPayment" className="form-label">
                    Valor a pagar
                  </label>
                  <input
                    required
                    type="number"
                    className="form-control"
                    id="value"
                    name="value"
                    step="0.01"
                    value={Number(form.value).toFixed(2)} // Mostrar el valor calculado
                    onChange={handleChange}
                    readOnly
                  />
                </div>
                <div className="mb-3 col-3">
                  <label htmlFor="credit" className="form-label">
                    Abono o Pago
                  </label>
                  <input
                    required
                    type="number"
                    className="form-control"
                    id="credit"
                    name="credit"
                    step="0.01"
                    value={form.credit}
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-3 col-3">
                  <label htmlFor="balance" className="form-label">
                    Saldo
                  </label>
                  <input
                    required
                    type="number"
                    className="form-control"
                    id="balance"
                    name="balance"
                    step="0.01"
                    value={form.balance}
                    //onChange={handleChange }
                    readOnly
                  />
                </div>
                <div className="mb-3 col-3">
                  <label htmlFor="total" className="form-label">
                    Total pagado
                  </label>
                  <input
                    required
                    type="number"
                    className="form-control"
                    id="total"
                    name="total"
                    value={form.total}
                    step="0.01"
                    readOnly
                  />
                </div>
                
                <div className="mb-3 col-3">
                  <label htmlFor="balance" className="form-label">
                    Fecha de pago
                  </label>
                  <input
                    required
                    type="date"
                    className="form-control"
                    id="balance"
                    name="balance"
                    value={form.createdAt}
                
                  />
                </div>
                <div className="mb-3 col-3">
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
// Validación de propiedades con PropTypes
PaymentModalContent.propTypes = {
  policy: PropTypes.shape({
    id: PropTypes.string.isRequired,
    numberPolicy: PropTypes.number.isRequired,
    number_payment: PropTypes.number.isRequired,
    policyValue: PropTypes.number.isRequired,
    payment_frequency_id: PropTypes.number.isRequired,

    // Validación del array de pagos dentro de 'policy'
    payments: PropTypes.arrayOf(
      PropTypes.shape({
        number_payment: PropTypes.number.isRequired,
      })
    ).isRequired, // Es obligatorio que haya pagos en este array
  }).isRequired,

  onClose: PropTypes.func.isRequired,
};

export default PaymentModalContent;
