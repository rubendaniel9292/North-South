import { useState, useEffect } from "react";

const UserForm = (initialObj) => {
  const [form, setForm] = useState(initialObj);
  /*
  useEffect(() => {
    console.log("Estado actualizado del formulario:", form);
  }, [form])*/

  const changed = ({ target }) => {
    const { name, value } = target; //Extrae nombre del campo del formulario el valor actual del campo del elemento del formulario que disparó el evento.

    if (name === "personalData" || name === "renewalCommission") {
      value === "true";
    }

    setForm({
      ...form,
      [name]: value,
    });
  };
  return { form, changed };
};

export default UserForm;
