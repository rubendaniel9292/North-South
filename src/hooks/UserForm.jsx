import { useState, useEffect } from "react";

const UserForm = (initialObj) => {
  const [form, setForm] = useState(initialObj);

  useEffect(() => {
    console.log("Estado actualizado del formulario:", form);
  }, [form]);

  const changed = (changes) => {
    if (changes.target) {
      const { name, value, type } = changes.target;
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
