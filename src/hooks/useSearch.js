/*
Hook Personalizado useSearch:

useSearch acepta dos parámetros: items (la lista de elementos a buscar) y searchFields (un array de campos por los cuales buscar).
query es el estado que almacena la cadena de búsqueda.
setQuery es la función para actualizar la cadena de búsqueda.
filteredItems es la lista de elementos filtrados en base a la cadena de búsqueda.

✅ Ahora soporta propiedades anidadas como "customer.firstName"
 */
import { useState } from "react";

const useSearch = (items, searchFields) => {
  const [query, setQuery] = useState("");

  // ✅ Función auxiliar para acceder a propiedades anidadas
  const getNestedProperty = (obj, path) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  };

  const filteredItems = items.filter((item) => {
    return searchFields.some((field) => {
      // ✅ Usar la función auxiliar para propiedades anidadas
      const value = getNestedProperty(item, field);
      return value?.toString().toLowerCase().includes(query.toLowerCase());
    });
  });

  return {
    query,
    setQuery,
    filteredItems,
  };
};

export default useSearch;