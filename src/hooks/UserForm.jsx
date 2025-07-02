import { useState, useEffect } from "react";
import dayjs from "../helpers/Day";
const DECIMAL_FIELDS = [
  "coverageAmount",
  "agencyPercentage",
  "advisorPercentage",
  "policyValue",
  "policyFee",
  "paymentsToAgency",
  "paymentsToAdvisor",
  "amountRefunds",
  "advanceAmount",
];
const UserForm = (initialObj) => {
  const [form, setForm] = useState(initialObj);

  useEffect(() => {
    if (!form.password && !form.username && !form.cardNumber && !form.code) {
      console.log("Estado actualizado del formulario:", form);
    }
  }, [form]);

  const changed = (changes) => {
    if (changes.target) {
      const { name, value, type } = changes.target;

      // --- Validación para campos decimales ---
      if (DECIMAL_FIELDS.includes(name)) {
        let cleanValue = value;
        // Si el valor es string y tiene coma, reemplaza la coma por punto
        if (typeof cleanValue === "string") {
          cleanValue = cleanValue.replace(",", ".");
        }
        // Convierte a número si es posible
        cleanValue = cleanValue === "" ? "" : Number(cleanValue);
        setForm((prevForm) => ({
          ...prevForm,
          [name]: cleanValue,
        }));
        return; // Ya manejamos el cambio, salimos
      }

      // Si es un campo de texto (excepto password y ci_ruc), convertir a mayúsculas
      if (type === "text" && name !== "username" && name !== "username") {
        setForm((prevForm) => ({
          ...prevForm,
          [name]: value.toUpperCase(),
        }));
      }

      // Para campos de fecha
      else if (type === "date") {
        if (value) {
          try {
            // Guardar el valor original para el input
            const isoValue = dayjs(value).toISOString();
            setForm((prevForm) => ({
              ...prevForm,
              [name]: value,
              // Guardar una propiedad adicional con el formato ISO
              [`${name}ForBackend`]: isoValue,
            }));
          } catch (error) {
            console.error(`Error procesando fecha ${name}:`, error);
          }
        }
      } else {
        let finalValue = value;

        // Manejo especial para radios
        if (
          name === "personalData" ||
          name === "isCommissionAnnualized" ||
          (name === "renewalCommission" && type === "radio")
        ) {
          finalValue = value === "true"; // Convierte el valor a booleano
        }

        setForm((prevForm) => ({
          ...prevForm,
          [name]: finalValue,
          //[name]: finalValue === "true" ? true : false,
        }));
      }
    }
    // Múltiples cambios
    else if (Array.isArray(changes)) {
      setForm((prevForm) => {
        const newForm = { ...prevForm };
        changes.forEach(({ name, value }) => {
          newForm[name] = value;
        });
        return newForm;
      });
    }
    // Objeto simple
    else {
      const { name, value } = changes;
      setForm((prevForm) => ({
        ...prevForm,
        [name]: value,
      }));
    }
  };

  return { form, changed, setForm };
};

export default UserForm;
