import PropTypes from "prop-types";
//import { useState } from "react";
//import alerts from "../../helpers/Alerts";
//import http from "../../helpers/Http";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
//import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { faFile } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "dayjs";
const CardsModal = ({ cards, onClose }) => {
  if (!cards) return null;
  // eslint-disable-next-line no-unused-vars, react-hooks/rules-of-hooks
  //const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto ">
        <article className="modal-content text-center px-5 py-4">
          <div className="d-flex justify-content-center align-items-center conten-title mb-3 rounded">
            <h3 className="text-white">
              Lista de tarjetas caducadas o por por caducar
            </h3>
          </div>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>N°</th>
                <th>Número de tarjeta</th>
                <th>Fecha de expiración</th>
                <th>Cédula / RUC</th>
                <th colSpan="4" scope="row">
                  Cliente
                </th>
                <th>Numero Telefónico</th>
                <th>Banco</th>
                <th>Tipo de tarjeta</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card, index) => (
                <tr key={card.id}>
                  <td>{index + 1}</td>
                  <td>{card.cardNumber}</td>
                  <td>
                    <td>
                      {dayjs.utc(card.expirationDate).format("DD/MM/YYYY")}
                    </td>
                  </td>
                  <td>{card.customer.ci_ruc}</td>
                  <td>{card.customer.firstName}</td>
                  <td>{card.customer.secondName}</td>
                  <td>{card.customer.surname}</td>
                  <td>{card.customer.secondName}</td>
                  <td>{card.customer.numberPhone}</td>
                  <td>{card.bank.bankName}</td>
                  <td>{card.cardoption.cardName}</td>
                  <td
                    className={
                      card.cardstatus.id == 2
                        ? "bg-warning text-white fw-bold"
                        : card.cardstatus.id == 3
                        ? "bg-danger text-white fw-bold"
                        : ""
                    }
                  >
                    {card.cardstatus.cardStatusName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>{" "}
          <div className="d-flex justify-content-around mt-1">
            <div className="">
              <button
                type="submit"
                onClick={onClose}
                id="btnc"
                className="btn bg-danger mx-5 text-white fw-bold"
              >
                Cerrar
                <FontAwesomeIcon
                  className="mx-2"
                  beat
                  icon={faRectangleXmark}
                />
              </button>
            </div>
          </div>
        </article>
      </div>
    </>
  );
};

CardsModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  cards: PropTypes.arrayOf(
    PropTypes.shape({
      cardNumber: PropTypes.string.isRequired,
      expirationDate: PropTypes.string.isRequired,
      code: PropTypes.string,
      customer: PropTypes.shape({
        ci_ruc: PropTypes.string.isRequired,
        firstName: PropTypes.string.isRequired,
        secondName: PropTypes.string,
        surname: PropTypes.string.isRequired,
        secondSurname: PropTypes.string,
        numberPhone: PropTypes.string.isRequired,
      }).isRequired,
      cardoption: PropTypes.object.isRequired, // Agregar detalles según la estructura de cardoption
      bank: PropTypes.object.isRequired, // Agregar detalles según la estructura de bank
      cardstatus: PropTypes.object.isRequired, // Agregar detalles según la estructura de cardstatus
    })
  ).isRequired,
};
export default CardsModal;
