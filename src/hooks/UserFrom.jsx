import { useState } from "react";

const UserFrom = (initialObj) => {
    const [form, setFrom] = useState(initialObj);
    /*
    es una función que toma un evento ({ target }) como argumento */

    const changed = ({ target }) => {
        const { name, value } = target;//Extrae nombre del campo del formulario el valor actual del campo del elemento del formulario que disparó el evento.
      
        /*
        añadir nuevos valores dentro del formulario con el contenido que ya tuviera el form 
        mas clave y valor que quiero añadir.
         Actualiza el estado form con una copia del estado actual 
         (...form) y sobrescribe o añade el campo representado por name con el valor value
        */
        setFrom({
            ...form, [name]: value
        })
        //console.log(form);
    }
    return { form, changed };

}

export default UserFrom;
