import { useState, useCallback } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import dayjs from "dayjs";
import Turnstile from "react-turnstile";
import useSearch from "../../hooks/useSearch";
import usePagination from "../../hooks/usePagination";
import Modal from "../../helpers/modal/Modal";

// ✅ Importar iconos de FontAwesome
import {
  faSearch,
  faCreditCard,
  faEdit,
  faTrash,
  faHashtag,
  faKey,
  faCalendarAlt,
  faIdCard,
  faUser,
  faBuilding,
  faCheckCircle,
  faCogs,
  faEye
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const ListCreditCard = () => {
  const [cards, setCards] = useState([]);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
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

  // ✅ Funciones para manejar el modal de actualización
  const handleUpdateCard = (card) => {
    console.log("🔄 Abriendo modal para actualizar tarjeta:", card);
    setSelectedCard(card);
    setShowUpdateModal(true);
  };

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    setSelectedCard(null);
  };

  // ✅ Funciones para manejar el modal de visualización de datos sensibles
  const handleViewCardDetails = (card) => {
    console.log("👁️ Abriendo modal para ver datos sensibles:", card);
    setSelectedCard(card);
    setShowViewDetailsModal(true);
  };

  const handleCloseViewDetailsModal = () => {
    setShowViewDetailsModal(false);
    setSelectedCard(null);
  };

  // ✅ Función para eliminar tarjeta
  const handleDeleteCard = useCallback(async (card) => {
    try {
      const result = await alerts(
        "¿Está seguro?",
        `¿Desea eliminar la tarjeta ${card.cardNumber} del cliente ${card.customer?.firstName} ${card.customer?.surname}?`,
        "warning",
        {
          showCancelButton: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#3085d6",
          confirmButtonText: "Sí, eliminar",
          cancelButtonText: "Cancelar"
        }
      );

      if (result.isConfirmed) {
        const response = await http.delete(`creditcard/delete-card/${card.id}`);

        if (response.data.status === "success") {
          alerts("Éxito", "Tarjeta eliminada correctamente", "success");

          // Actualizar el estado eliminando la tarjeta
          setCards((prevCards) => prevCards.filter((c) => c.id !== card.id));
        } else {
          alerts(
            "Error",
            response.data.message || "Error al eliminar la tarjeta",
            "error"
          );
        }
      }
    } catch (error) {
      console.error("Error al eliminar tarjeta:", error);

      if (error.response?.data?.message) {
        alerts("Error", error.response.data.message, "error");
      } else {
        alerts("Error", "No se pudo eliminar la tarjeta", "error");
      }
    }
  }, []);

  const handleCardUpdated = useCallback((updatedCard) => {
    console.log("✅ Tarjeta actualizada:", updatedCard);

    // Actualizar la tarjeta en el estado local
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === updatedCard.id
          ? { ...card, ...updatedCard }
          : card
      )
    );

    // Opcional: Recargar todas las tarjetas desde el servidor
    setTimeout(() => {
      getAllCards();
    }, 500);
  }, [getAllCards]);

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
                    <th>
                      <FontAwesomeIcon icon={faHashtag} className="me-2" />
                      Número de tarjeta
                    </th>

                    <th>
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                      Fecha de expiración
                    </th>

                    <th colSpan="4" scope="row">
                      <FontAwesomeIcon icon={faUser} className="me-2" />
                      Cliente
                    </th>
                    <th>
                      <FontAwesomeIcon icon={faBuilding} className="me-2" />
                      Banco
                    </th>
                    <th>
                      <FontAwesomeIcon icon={faCreditCard} className="me-2" />
                      Tipo de tarjeta
                    </th>
                    <th>
                      <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                      Estado
                    </th>
                    <th>
                      <FontAwesomeIcon icon={faCogs} className="me-2" />
                      Acciones
                    </th>
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

                        <td>
                          {card.expirationDate
                            ? dayjs.utc(card.expirationDate).format("DD/MM/YYYY")
                            : "Sin fecha"}
                        </td>

                        <td>{card.customer?.firstName || "-"}</td>
                        <td>{card.customer?.secondName || "-"}</td>
                        <td>{card.customer?.surname || "-"}</td>
                        <td>{card.customer?.secondSurname || "-"}</td>
                        <td>{card.bank?.bankName || "-"}</td>
                        <td>{card.cardoption?.cardName || "-"}</td>
                        <td>
                          <span
                            className={`badge fw-bold fs-6 ${card.cardstatus?.id == 1
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
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-primary text-white fw-bold w-100"
                              onClick={() => handleViewCardDetails(card)}
                              title="Ver datos sensibles"
                            >
                              Ver datos
                              <FontAwesomeIcon icon={faEye} className="me-2" />
                            </button>
                            <button
                              className="btn btn-sm btn-success text-white fw-bold w-100"
                              onClick={() => handleUpdateCard(card)}
                              title="Actualizar tarjeta"
                            >
                              Actualziar
                              <FontAwesomeIcon icon={faEdit} className="me-2" />
                            </button>
                            <button
                              className="btn btn-sm btn-danger text-white fw-bold w-100"
                              onClick={() => handleDeleteCard(card)}
                              title="Eliminar tarjeta"
                            >
                              Eliminar
                              <FontAwesomeIcon icon={faTrash} className="me-2"/>
                            </button>
                          </div>
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

      {/* ✅ Modal para actualizar tarjeta */}
      {showUpdateModal && selectedCard && (
        <Modal
          isOpen={showUpdateModal}
          onClose={handleCloseUpdateModal}
          modalType="updateCreditCard"
          selectedCard={selectedCard}
          onCardUpdated={handleCardUpdated}
          // ✅ Props obligatorias del Modal (con valores por defecto)
          policies={[]}
          cards={[]}
          payments={[]}
          onAdvisorUpdated={() => { }}
          onCustomerUpdated={() => { }}
          onPolicyUpdated={() => { }}
          onPaymentUpdated={() => { }}
          commissionHistory={() => { }}
          commissionRefunds={() => { }}
          editPoliciesValues={[]}
          onTaskDeleted={() => { }}
          tasks={{ id: 0, description: "", estatusTask: "" }}
        />
      )}

      {/* ✅ Modal para ver datos sensibles de la tarjeta */}
      {showViewDetailsModal && selectedCard && (
        <Modal
          isOpen={showViewDetailsModal}
          onClose={handleCloseViewDetailsModal}
          modalType="viewCreditCardDetails"
          selectedCard={selectedCard}
          // ✅ Props obligatorias del Modal (con valores por defecto)
          policies={[]}
          cards={[]}
          payments={[]}
          onAdvisorUpdated={() => { }}
          onCustomerUpdated={() => { }}
          onPolicyUpdated={() => { }}
          onPaymentUpdated={() => { }}
          onCardUpdated={() => { }}
          commissionHistory={() => { }}
          commissionRefunds={() => { }}
          editPoliciesValues={[]}
          onTaskDeleted={() => { }}
          tasks={{ id: 0, description: "", estatusTask: "" }}
        />
      )}
    </>
  );
};

export default ListCreditCard;
