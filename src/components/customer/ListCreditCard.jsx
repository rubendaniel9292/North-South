import { useState, useCallback } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import dayjs from "dayjs";
import Turnstile from "react-turnstile";
import useSearch from "../../hooks/useSearch";
import usePagination from "../../hooks/usePagination";

// ✅ Importar iconos de FontAwesome
import {
  faSearch,
  faCreditCard,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const ListCreditCard = () => {
  const [cards, setCards] = useState([]);
  const [turnstileToken, setTurnstileToken] = useState("");
  const itemsPerPage = 10;

  const siteKey = import.meta.env.VITE_REACT_APP_TURNSTILE_SITE_KEY;

  // ✅ Hook de búsqueda
  const {
    query,
    setQuery,
    filteredItems: searchedCards,
  } = useSearch(cards, [
    "cardNumber",
    "code",
    "customer.ci_ruc",
    "customer.firstName", 
    "customer.secondName",
    "customer.surname",
    "customer.secondSurname",
    "bank.bankName",
    "cardoption.cardName",
  ]);

  // ✅ Hook de paginación
  const {
    currentPage,
    currentItems: currentCards,
    totalPages,  
    paginate,
  } = usePagination(searchedCards, itemsPerPage);

  // ✅ Convertir a useCallback
  const getAllCards = useCallback(async () => {
    if (!turnstileToken) {
      alerts(
        "Error",
        "Debe completar la verificación de seguridad para listar las tarjetas",
        "error"
      );
      return;
    }
    try {
      const response = await http.get(
        `creditcard/all-cards?turnstileToken=${turnstileToken}`
      );

      if (response.data.status === "success") {
        const cardsData = response.data.allCards || [];
        setCards(cardsData);

        // ✅ Solo mostrar mensaje informativo, no error
        if (cardsData.length === 0) {
          alerts(
            "Información",
            "No hay tarjetas registradas en el sistema",
            "info"
          );
        }
      } else {
        alerts(
          "Error",
          response.data.message || "Error al consultar las tarjetas",
          "error"
        );
        console.error("Error fetching cards:", response.data.message);
      }
    } catch (error) {
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching cards:", error);
    }
  }, [turnstileToken]);

  return (
    <>
      <section>
        <div className="text-center py-2">
          <h2 className="py-2">Lista de tarjetas de crédito</h2>
          
          <div id="turnstile-container" className="my-3">
            <Turnstile
              sitekey={siteKey}
              onVerify={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken("")}
              debug={true}
            />
          </div>

          {cards.length === 0 ? (
            <button
              onClick={getAllCards}
              className="fw-bold btn btn-primary mt-2"
              disabled={!turnstileToken}
            >
              Cargar tarjetas
            </button>
          ) : (
            <>
              {/* Header con información y controles */}
              <div className="row mb-4">
                {/* Total de tarjetas */}
                <div className="col-md-4">
                  <div className="card bg-warning text-dark">
                    <div className="card-body py-2">
                      <h5 className="card-title mb-1">
                        <FontAwesomeIcon icon={faCreditCard} className="me-2" />
                        Total de tarjetas
                      </h5>
                      <h3 className="mb-0">{cards.length}</h3>
                    </div>
                  </div>
                </div>

                {/* Buscador */}
                <div className="col-md-8">
                  <div className="mb-3">
                    <label htmlFor="cardQuery" className="form-label fw-bold">
                      <FontAwesomeIcon icon={faSearch} className="me-2" />
                      Buscar por número, cliente, cédula o banco
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="cardQuery"
                      placeholder="Ingrese número de tarjeta, nombre, cédula o banco..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <small className="text-dark fs-5 mt-2">
                    {searchedCards.length} tarjeta(s) encontrada(s)
                  </small>
                </div>
              </div>

              {/* Tabla de tarjetas */}
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Número de tarjeta</th>
                    <th>Código</th>
                    <th>Fecha de expiración</th>
                    <th>Cédula / RUC</th>
                    <th colSpan="4" scope="row">
                      Cliente
                    </th>
                    <th>Banco</th>
                    <th>Tipo de tarjeta</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCards.length === 0 ? (
                    <tr>
                      <td colSpan="13" className="text-center">
                        {query ? "No se encontraron tarjetas" : "No hay tarjetas para mostrar"}
                      </td>
                    </tr>
                  ) : (
                    currentCards.map((card, index) => (
                      <tr key={card.id}>
                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td>{card.cardNumber || "-"}</td>
                        <td>{card.code || "-"}</td>
                        <td>
                          {card.expirationDate
                            ? dayjs.utc(card.expirationDate).format("DD/MM/YYYY")
                            : "Sin fecha"}
                        </td>
                        <td>{card.customer?.ci_ruc || "-"}</td>
                        <td>{card.customer?.firstName || "-"}</td>
                        <td>{card.customer?.secondName || "-"}</td>
                        <td>{card.customer?.surname || "-"}</td>
                        <td>{card.customer?.secondSurname || "-"}</td>
                        <td>{card.bank?.bankName || "-"}</td>
                        <td>{card.cardoption?.cardName || "-"}</td>
                        <td>
                          <span
                            className={`badge fw-bold ${
                              card.cardstatus?.id == 1
                                ? "bg-success"           // Activa
                                : card.cardstatus?.id == 2
                                ? "bg-warning text-dark" // Inactiva  
                                : card.cardstatus?.id == 3
                                ? "bg-danger"            // Bloqueada
                                : "bg-light text-dark"   // Default
                            }`}
                          >
                            {card.cardstatus?.cardStatusName || "Sin estado"}
                          </span>
                        </td>
                        <td className="d-flex gap-2">
                          {(card.cardstatus?.id == 2 || card.cardstatus?.id == 3) && (
                            <button className="btn bg-danger text-white fw-bold w-100 my-1">
                              Eliminar tarjeta
                            </button>
                          )}
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
              {searchedCards.length > itemsPerPage && (
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
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default ListCreditCard;
