/*
Hook Personalizado usePagination:

usePagination acepta dos parámetros: items (la lista de elementos a paginar)
 y itemsPerPage (el número de elementos por página).
currentPage es el estado que almacena la página actual.
currentItems es la lista de elementos en la página actual.
totalPages es el número total de páginas.
paginate es la función para cambiar de página.

useMemo asegura que currentItems solo se recalculen cuando items, indexOfFirstItem o indexOfLastItem cambien.

totalPages solo se recalculen cuando items.length o itemsPerPage cambien.
 */
import { useState, useMemo } from "react";

const usePagination = (items, itemsPerPage) => {
  const [currentPage, setCurrentPage] = useState(1);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // Calcular currentItems usando useMemo
  const currentItems = useMemo(() => {
    return items.slice(indexOfFirstItem, indexOfLastItem);
  }, [items, indexOfFirstItem, indexOfLastItem]);

  // Calcular totalPages usando useMemo
  const totalPages = useMemo(() => {
    return Math.ceil(items.length / itemsPerPage);
  }, [items.length, itemsPerPage]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  //const totalPages = Math.ceil(items.length / itemsPerPage);

  return {
    currentPage,
    currentItems,
    totalPages,
    paginate,
  };
};

export default usePagination;
