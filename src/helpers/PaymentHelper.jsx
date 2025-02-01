// helpers/paymentHelper.js
import http from "../../helpers/Http";
import { useState, useEffect } from "react";

const usePaymentForm = (policy, initialForm = {}) => {
  const [form, setForm] = useState({
    number_payment: initialForm.number_payment || 1,
    value: initialForm.value || 0,
    balance: initialForm.balance || 0,
    total: initialForm.total || 0,
    observations: initialForm.observations || "",
    credit: initialForm.credit || 0,
    createdAt: initialForm.createdAt || "",
    status_payment_id: initialForm.status_payment_id || "",
  });

  const [paymentStatus, setPaymentStatus] = useState([]);
  //const [isLoading, setIsLoading] = useState(false);
  //const [isDataValid, setIsDataValid] = useState(true);

  useEffect(() => {
    // Llamada para obtener los estados de pago
    const fetchData = async () => {
      try {
        const response = await fetch("payment/get-payment-status");
        const data = await response.json();
        setPaymentStatus(data.paymentStatus);
      } catch (error) {
        console.error("Error fetching payment status:", error);
      }
    };
    fetchData();
  }, []);
  /*
    useEffect(() => {
      if (!policy) {
        setIsDataValid(false);
        return;
      }*/

  const calculatePaymentValue = () => {
    const paymentFrequency = Number(policy.payment_frequency_id);
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
  }));

  // Actualizar el número de pago
  const lastPaymentNumber = policy.payments?.length
    ? policy.payments[policy.payments.length - 1].number_payment
    : 0;
  setForm((prevForm) => ({
    ...prevForm,
    number_payment: lastPaymentNumber + 1, // Incrementar el último número de pago
  }));
};

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

const handleSubmit = async (e) => {
  setIsLoading(true);
  e.preventDefault();

  const newPayment = { ...form, policy_id: policy.id };

  try {
    const response = await http.post("payment/register-payment");

    const data = await response.json();

    if (data.status === "success") {
      console.log("Pago registrado correctamente");
      setTimeout(() => {
        // Aquí puedes cerrar el modal o hacer algo después de guardar
      }, 500);
    } else {
      console.error("Error al registrar el pago");
    }
  } catch (error) {
    console.error("Error al registrar el pago:", error);
  } finally {
    setIsLoading(false);
  }
};

return {
  form,
  paymentStatus,
  isLoading,
  isDataValid,
  handleChange,
  handleSubmit,
};

export default usePaymentForm;
