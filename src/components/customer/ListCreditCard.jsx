import { useEffect, useState } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import dayjs from "dayjs";

const ListCreditCard = () => {
  
  const [cards, setCards] = useState([]); 

  //const { auth } = useAuth();

  useEffect(() => {
    getAllCards();
  }, []);
  const getAllCards = async () => {
    try {
      const response = await http.get("creditcard/all-cards");
      if (response.data.status === "success") {
        setCards(response.data.allCards); // Asume que la respuesta contiene un array de usuarios bajo la clave 'allUser'
      } else {
        alerts(
          "Error",
          "No existen tarjetas registradas",
          "error"
        );
        console.error("Error fetching users:", response.message);
      }
    } catch (error) {
      //setError(error);
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching users:", error);
    }
  };

  return (
    <>
      <div>
        <h2>Lista de tarjetas</h2>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>N°</th>
              <th>Número de tarjeta</th>
              <th>Código</th>
              <th>Fecha de expiración</th>
              <th>Cédula / RUC</th>
              <th>Primer Nombre</th>
              <th>Segundo Nombre</th>
              <th>Primer Apellido</th>
              <th>Primer Segundo</th>
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
                <td>{card.cardNumber}</td>
                <td>{card.code}</td>
                <td>
                  {dayjs(card.expirationDate).format("MM/YYYY").toString()}
                </td>
                <td>{card.customer.ci_ruc}</td>
                <td>{card.customer.firstName}</td>
                <td>{card.customer.secondName}</td>
                <td>{card.customer.surname}</td>
                <td>{card.customer.secondName}</td>
                <td>{card.bank.bankName}</td>
                <td>{card.cardoption.cardName}</td>
                <td
                  className={
                    card.cardstatus.id == 2
                      ? "bg-warning text-white fw-bold"
                      : card.cardstatus.id == 3
                      ? "bg-danger text-white fw-bold"
                      : "bg-success-subtle"
                  }
                >
                  {card.cardstatus.cardStatusName}
                </td>
                <td>
                  <button
                    //onClick={() => deleteUser(user.uuid)}
                    className="btn btn-success text-white fw-bold"
                  >
                    Actualziar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ListCreditCard;