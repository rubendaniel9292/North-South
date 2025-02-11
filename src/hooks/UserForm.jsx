import { useState, useEffect } from "react";
import dayjs from "../helpers/Day";
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
  

      // Si es un campo de texto (excepto password y ci_ruc), convertir a mayúsculas
      if (type === "text") {
        setForm((prevForm) => ({
          ...prevForm,
          [name]: value.toUpperCase(),
        }));
      }
      // Manejo específico para fechas
      else if (type === "date") {
        const formattedDate = dayjs(value).utc(true).toISOString();
        setForm((prevForm) => ({
          ...prevForm,
          [name]: formattedDate,
        }));
      }
      let finalValue = value;

      // Manejo especial para radios

      if (name === "personalData" && type === "radio") {
        finalValue = value === "true"; // Convierte el valor a booleano
      }

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
