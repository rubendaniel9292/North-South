/*
Hook Personalizado useSearch:

useSearch acepta dos parámetros: items (la lista de elementos a buscar) y searchFields (un array de campos por los cuales buscar).
query es el estado que almacena la cadena de búsqueda.
setQuery es la función para actualizar la cadena de búsqueda.
filteredItems es la lista de elementos filtrados en base a la cadena de búsqueda.
 */
import { useState } from "react";

const useSearch = (items, searchFields) => {
  const [query, setQuery] = useState("");

  const filteredItems = items.filter((item) => {
    return searchFields.some((field) => {
      return item[field]?.toLowerCase().includes(query.toLowerCase());
    });
  });

  return {
    query,
    setQuery,
    filteredItems,
  };
};

export default useSearch;