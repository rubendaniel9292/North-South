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
  /*
  useEffect(() => {
    if (!form.password && !form.username && !form.cardNumber && !form.code) {
      console.log("Estado actualizado del formulario:", form);
    }
  }, [form]);
*/
  /*
  const changed = (changes) => {
    if (changes.target) {
      const { name, value, type } = changes.target;

      // --- Validación para campos decimales ---

      if (DECIMAL_FIELDS.includes(name)) {
        let cleanValue = value;

        // Si el valor es string y tiene coma, reemplaza la coma por punto
        if (typeof cleanValue === "string" && cleanValue.includes(",")) {
          cleanValue = cleanValue.replace(",", ".");
        }

        // Permitir que el campo quede vacío
        if (cleanValue === "") {
          setForm((prevForm) => ({
            ...prevForm,
            [name]: cleanValue,
          }));
          return;
        }

        // Convertir a número y validar que sea un valor decimal válido
        const numericValue = parseFloat(cleanValue);
        if (isNaN(numericValue)) {
          console.error(`Valor inválido para ${name}: ${cleanValue}`);
          return; // No actualizar el estado si el valor no es válido
        }

        // Redondear a dos decimales si es necesario
        cleanValue = numericValue.toFixed(2);

        // Actualizar el estado del formulario
        setForm((prevForm) => ({
          ...prevForm,
          [name]: cleanValue,
        }));
      } else {
        // Actualizar otros campos normalmente
        setForm((prevForm) => ({
          ...prevForm,
          [name]: value,
        }));
      }

      // Si es un campo de texto (excepto password y ci_ruc), convertir a mayúsculas
      if (
        type === "text" &&
        name !== "ci_ruc" &&
        name !== "username" &&
        name !== "password" &&
        name !== "description"
      ) {
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
*/
  const changed = (changes) => {
    if (changes.target) {
      const { name, value, type } = changes.target;
      let finalValue = value;

      // --- Validación para campos decimales ---
      if (DECIMAL_FIELDS.includes(name)) {
        let cleanValue = value;

        // Reemplazar coma por punto
        if (typeof cleanValue === "string" && cleanValue.includes(",")) {
          cleanValue = cleanValue.replace(",", ".");
        }

        // ✅ Permitir valores vacíos y valores temporales durante la escritura
        if (cleanValue === "" || cleanValue === "." || cleanValue === "-") {
          finalValue = cleanValue;
        }
        // ✅ Permitir números decimales válidos durante la escritura
        else if (/^-?\d*\.?\d*$/.test(cleanValue)) {
          // ✅ CORRECCIÓN: Convertir a string antes de usar endsWith
          const cleanString = String(cleanValue);

          // Solo aplicar toFixed si el valor está "completo" (no termina en punto)
          if (!cleanString.endsWith(".")) {
            const numericValue = parseFloat(cleanValue);
            if (!isNaN(numericValue)) {
              finalValue = cleanValue; // Mantener el valor original durante la escritura
            } else {
              finalValue = cleanValue; // Permitir valores temporales
            }
          } else {
            finalValue = cleanValue; // Permitir "1." mientras escribe "1.5"
          }
        }
        // ✅ Si el formato no es válido, mantener el valor anterior
        else {
          console.warn(`Formato inválido para ${name}: ${cleanValue}`);
          return; // No actualizar si el formato es completamente inválido
        }
      }
      // Para campos de fecha
      else if (type === "date") {
        if (value) {
          try {
            const isoValue = dayjs(value).toISOString();
            setForm((prevForm) => ({
              ...prevForm,
              [name]: value,
              [`${name}ForBackend`]: isoValue,
            }));
            return;
          } catch (error) {
            console.error(`Error procesando fecha ${name}:`, error);
            return;
          }
        }
      }
      // Para campos de texto (convertir a mayúsculas)
      else if (
        type === "text" &&
        name !== "ci_ruc" &&
        name !== "username" &&
        name !== "password" &&
        name !== "description"
      ) {
        finalValue = value.toUpperCase();
      }
      // Para radios
      else if (
        name === "personalData" ||
        name === "isCommissionAnnualized" ||
        (name === "renewalCommission" && type === "radio")
      ) {
        finalValue = value === "true";
      }

      // ✅ UN SOLO setForm al final
      setForm((prevForm) => ({
        ...prevForm,
        [name]: finalValue,
      }));
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
