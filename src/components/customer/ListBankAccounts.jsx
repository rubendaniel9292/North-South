import { useEffect, useState, useCallback } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import useSearch from "../../hooks/useSearch";
import usePagination from "../../hooks/usePagination";

// ✅ Importar iconos de FontAwesome
import {
  faSearch,
  faUniversity,
  faHashtag,
  faIdCard,
  faUser,
  faBuilding,
  faFolderOpen,
  faStickyNote,
  faCogs
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const ListBankAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const itemsPerPage = 10;

  // ✅ Hook de búsqueda
  const {
    query,
    setQuery,
    filteredItems: searchedAccounts,
  } = useSearch(accounts, [
    "accountNumber",
    "customer.ci_ruc",
    "customer.firstName",
    "customer.secondName", 
    "customer.surname",
    "customer.secondSurname",
    "bank.bankName",
    "accountType.typeName",
  ]);

  // ✅ Hook de paginación
  const {
    currentPage,
    currentItems: currentAccounts,
    totalPages,
    paginate,
  } = usePagination(searchedAccounts, itemsPerPage);

  // ✅ Convertir a useCallback
  const getAllAccounts = useCallback(async () => {
    try {
      const response = await http.get("bankaccount/get-all-account");
      if (response.data.status === "success") {
        console.log('cuentas registradas: ', response.data);
        const accountsData = response.data.allBankAccounts || [];
        setAccounts(accountsData);

        // ✅ Solo mostrar mensaje informativo si no hay cuentas
        if (accountsData.length === 0) {
          alerts(
            "Información",
            "No hay cuentas bancarias registradas en el sistema",
            "info"
          );
        }
      } else {
        alerts(
          "Error", 
          response.data.message || "Error al consultar las cuentas",
          "error"
        );
        console.error("Error fetching:", response.message);
      }
    } catch (error) {
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching accounts:", error);
    }
  }, []);

  useEffect(() => {
    getAllAccounts();
  }, [getAllAccounts]);

  return (
    <>
      <section>
        <div className="text-center py-2">
          <h2 className="py-2">Lista de cuentas bancarias</h2>

          {/* Header con información y controles */}
          <div className="row mb-4">
            {/* Total de cuentas */}
            <div className="col-md-4">
              <div className="card bg-info text-white">
                <div className="card-body py-2">
                  <h5 className="card-title mb-1">
                    <FontAwesomeIcon icon={faUniversity} className="me-2" />
                    Total de cuentas
                  </h5>
                  <h3 className="mb-0">{accounts.length}</h3>
                </div>
              </div>
            </div>

            {/* Buscador */}
            <div className="col-md-8">
              <div className="mb-3">
                <label htmlFor="accountQuery" className="form-label fw-bold">
                  <FontAwesomeIcon icon={faSearch} className="me-2" />
                  Buscar por número de cuenta, cliente, cédula o banco
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="accountQuery"
                  placeholder="Ingrese número de cuenta, nombre, cédula o banco..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <small className="text-dark  fs-5 mt-2">
                {searchedAccounts.length} cuenta(s) encontrada(s)
              </small>
            </div>
          </div>

          {/* Tabla de cuentas */}
          <table className="table table-striped py-2">
            <thead>
              <tr>
                <th>N°</th>
                <th>
                  <FontAwesomeIcon icon={faHashtag} className="me-2" />
                  Número de cuenta
                </th>
                <th>
                  <FontAwesomeIcon icon={faIdCard} className="me-2" />
                  Cédula / RUC
                </th>
                <th colSpan="4" scope="row">
                  <FontAwesomeIcon icon={faUser} className="me-2" />
                  Cliente
                </th>
                <th>
                  <FontAwesomeIcon icon={faUniversity} className="me-2" />
                  Banco
                </th>
                <th>
                  <FontAwesomeIcon icon={faFolderOpen} className="me-2" />
                  Tipo de cuenta
                </th>
                <th>
                  <FontAwesomeIcon icon={faStickyNote} className="me-2" />
                  Observaciones
                </th>
                <th>
                  <FontAwesomeIcon icon={faCogs} className="me-2" />
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {currentAccounts.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center">
                    {query 
                      ? "No se encontraron cuentas bancarias" 
                      : "No hay cuentas bancarias registradas"
                    }
                  </td>
                </tr>
              ) : (
                currentAccounts.map((item, index) => (
                  <tr key={item.id}>
                    <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td>{item.accountNumber}</td>
                    <td>{item.customer?.ci_ruc || "-"}</td>
                    <td>{item.customer?.firstName || "-"}</td>
                    <td>{item.customer?.secondName || "-"}</td>
                    <td>{item.customer?.surname || "-"}</td>
                    <td>{item.customer?.secondSurname || "-"}</td>
                    <td>{item.bank?.bankName || "-"}</td>
                    <td>{item.accountType?.typeName || "-"}</td>
                    <td>{item.observations || "N/A"}</td>
                    <td>
                      <button className="btn btn-success text-white fw-bold w-100 my-1">
                        Actualizar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Paginación */}
          {searchedAccounts.length > itemsPerPage && (
            <nav aria-label="page navigation example">
              <ul className="pagination">
                <li className={`page-item${currentPage === 1 ? " disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => paginate(currentPage - 1)}
                  >
                    Anterior
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                  <li
                    key={number}
                    className={`page-item${currentPage === number ? " active" : ""}`}
                  >
                    <button
                      onClick={() => paginate(number)}
                      className="page-link"
                    >
                      {number}
                    </button>
                  </li>
                ))}
                <li className={`page-item${currentPage === totalPages ? " disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => paginate(currentPage + 1)}
                  >
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </section>
    </>
  );
};

export default ListBankAccounts;
