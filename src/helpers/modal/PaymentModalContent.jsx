import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const PaymentModalContent = ({ policy, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDataValid, setIsDataValid] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusPaymentResponse] = await Promise.all([
          http.get("payment/get-payment-status"),
        ]);
        setPaymentStatus(statusPaymentResponse.data.paymentStatus);
      } catch (error) {
        alerts("Error", "Error fetching data.", error);
      }
    };
    fetchData();
  }, []);

  const [form, setForm] = useState({
    value: 0,
    balance: 0,
    total: 0,
    createdAt: policy.startDate,
  });

  useEffect(() => {
    console.log("poliza recibida en el modal: ", policy);
    console.log("Estado actualizado del formulario de pago:", form);
  }, [form, policy]);

  useEffect(() => {
    if (policy) {
      const lastPayment = policy.payments.length
        ? policy.payments[policy.payments.length - 1]
        : null;
      const pendingValue = lastPayment
        ? Number(lastPayment.pending_value)
        : Number(policy.policyValue);
      const lastPaymentNumber = lastPayment ? lastPayment.number_payment : 1;

      setForm((prevForm) => ({
        ...prevForm,
        number_payment: lastPaymentNumber, // Mantener el número de pago actual
        pending_value: pendingValue - Number(form.credit),
      }));
    }
  }, [form.credit, policy]);

  useEffect(() => {
    if (!policy) {
      console.error("Error al recibir el objeto", policy);
      setIsDataValid(false);
      return null;
    }
    const calculatePaymentValue = () => {
      const paymentFrequency = Number(policy.paymentFrequency.id);
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
      credit: Number(value),
    }));
  }, [policy, form.credit]);

  const option = "Escoja una opción";
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => {
      if (name === "credit") {
        if (!value) {
          const initialPendingValue = policy.payments.length
            ? Number(policy.payments[policy.payments.length - 1].pending_value)
            : Number(policy.policyValue);

          return {
            ...prevForm,
            balance: prevForm.value.toFixed(2),
            total: 0,
            pending_value: initialPendingValue.toFixed(2),
          };
        }

        const credit = Number(value);
        const currentPendingValue = policy.payments.length
          ? Number(policy.payments[policy.payments.length - 1].pending_value)
          : Number(policy.policyValue);

        if (credit > currentPendingValue || credit > form.value) {
          alerts(
            "Error",
            "El pago no puede ser mayor al saldo pendiente o al valor a pagar",
            "error"
          );
          return prevForm;
        }

        const balance = Number(prevForm.value) - credit;
        const newPendingValue = currentPendingValue;

        return {
          ...prevForm,
          credit: credit,
          balance: balance.toFixed(2),
          total: credit,
          pending_value: newPendingValue.toFixed(2),
        };
      }
      return {
        ...prevForm,
        [name]: value,
      };
    });
  };

  const savePayment = async (e) => {
    setIsLoading(true);
    try {
      e.preventDefault();
      const updatedPayment = { ...form, policy_id: policy.id };
      const lastPaymentId = policy.payments.length
        ? policy.payments[policy.payments.length - 1].id
        : null;
      const request = await http.put(
        `payment/update-payment/${lastPaymentId}`,
        updatedPayment
      );

      if (request.data.status === "success") {
        // Llamar después de actualizar exitosamente
        alerts(
          "Actualización exitosa",
          "Pago actualizado correctamente",
          "success"
        );

        document.querySelector("#user-form").reset();
        setTimeout(() => {
          onClose();
        }, 500);
        //await onPaymentUpdate();
      } else {
        alerts(
          "Error",
          "Pago no actualizado correctamente. Verificar que no haya campos vacíos o datos incorrectos",
          "error"
        );
      }
    } catch (error) {
      alerts("Error", "Error actualizando el pago.", "error");
      console.error("Error actualizando el pago:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isDataValid) {
    return <div>Error: Datos de póliza o frecuencia de pago no válidos.</div>;
  }

  return (
    <div className="modal d-flex justify-content-center align-items-center mx-auto">
      <article className="modal-content text-center px-5 py-5">
        <div className="d-flex justify-content-center align-items-center conten-title rounded mb-3">
          <h3 className="text-white fw-bold">
            Póliza seleccionada: {policy.numberPolicy}
          </h3>
        </div>
        <h4 className="fw-bold">Valor de la Póliza: {policy.policyValue}</h4>
        <div className="d-flex justify-content-around mt-5">
          <form onSubmit={savePayment} id="user-form">
            <div className="row">
              <div className="mb-4 d-none">
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
                  Saldo pendiente
                </label>
                <input
                  required
                  type="number"
                  className="form-control"
                  id="valuep"
                  name="valuep"
                  step="0.01"
                  value={Number(form.pending_value).toFixed(2)}
                  onChange={handleChange}
                  readOnly
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
                  value={Number(form.value).toFixed(2)}
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
                  //readOnly
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
                  readOnly
                  //value={form.createdAt}
                  value={form.createdAt ? form.createdAt.split("T")[0] : ""}
                />
              </div>
              <div className="mb-3 col-3">
                <label htmlFor="status_payment_id" className="form-label">
                  Estado del pago
                </label>
                <select
                  className="form-select"
                  id="status_payment_id"
                  name="status_payment_id"
                  onChange={handleChange}
                  defaultValue={option}
                >
                  {" "}
                  <option disabled>{option}</option>
                  {paymentStatus.map((item) => (
                    <option key={item.id} value={item.id}>
                      {`${item.statusNamePayment}`.trim()}
                    </option>
                  ))}
                </select>
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
                  className="btn bg-success fw-bold text-white"
                >
                  {isLoading ? (
                    <div className="spinner-border text-light" role="status">
                      <span className="visually-hidden">Actualizando...</span>
                    </div>
                  ) : (
                    "Actualizar Pago"
                  )}
                  <FontAwesomeIcon className="mx-2" icon={faFloppyDisk} beat />
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
  );
};

PaymentModalContent.propTypes = {
  policy: PropTypes.shape({
    id: PropTypes.number.isRequired,
    numberPolicy: PropTypes.number.isRequired,
    number_payment: PropTypes.number.isRequired,
    policyValue: PropTypes.number.isRequired,
    startDate: PropTypes.string.isRequired,
    paymentFrequency: PropTypes.shape({
      id: PropTypes.number.isRequired,
      frequencyName: PropTypes.string.isRequired,
    }).isRequired,
    payments: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        pending_value: PropTypes.number.isRequired,
        number_payment: PropTypes.number.isRequired,
      })
    ).isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  //onPaymentUpdate: PropTypes.func,
};

export default PaymentModalContent;
