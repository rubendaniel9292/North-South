import { useState, useCallback } from "react"; // ✅ Importar useCallback
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import dayjs from "dayjs";
import Turnstile from "react-turnstile";

const ListCreditCard = () => {
  const [cards, setCards] = useState([]);
  const [turnstileToken, setTurnstileToken] = useState("");

  const siteKey = import.meta.env.VITE_REACT_APP_TURNSTILE_SITE_KEY;

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
  }, [turnstileToken]); // ✅ Dependencia: se recrea solo cuando turnstileToken cambia

  return (
    <>
      <div className="text-center py-2">
        <h2>Lista de tarjetas</h2>
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
            disabled={!turnstileToken} // ✅ Deshabilitar si no hay token
          >
            Cargar tarjetas
          </button>
        ) : null}

        {/* ✅ Mostrar tabla solo si hay tarjetas */}
        {cards.length > 0 && (
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
              {cards.map((card, index) => (
                <tr key={card.id}>
                  <td>{index + 1}</td>
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
                  <td
                    className={
                      card.cardstatus?.id == 2
                        ? "bg-warning text-white fw-bold"
                        : card.cardstatus?.id == 3
                        ? "bg-danger text-white fw-bold"
                        : "bg-success-subtle"
                    }
                  >
                    {card.cardstatus?.cardStatusName || "Sin estado"}
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
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default ListCreditCard;
