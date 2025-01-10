// UserForm.js
import { useState, useEffect } from "react";

const UserForm = (initialObj) => {
  const [form, setForm] = useState(initialObj);

  useEffect(() => {
    console.log("Estado actualizado del formulario:", form);
  }, [form]);

  const changed = (changes) => {
    // Si es un evento
    if (changes.target) {
      const { name, value } = changes.target;
      setForm((prevForm) => ({
        ...prevForm,
        [name]: value,
      }));
    }
    // Si son múltiples cambios
    else if (Array.isArray(changes)) {
      setForm((prevForm) => {
        const newForm = { ...prevForm };
        changes.forEach(({ name, value }) => {
          newForm[name] = value;
        });
        return newForm;
      });
    }
    // Si es un objeto simple
    else {
      const { name, value } = changes;
      setForm((prevForm) => ({
        ...prevForm,
        [name]: value,
      }));
    }
  };

  return { form, changed };
};

export default UserForm;
