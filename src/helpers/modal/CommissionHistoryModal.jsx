import PropTypes from "prop-types";
import { useEffect, useCallback, useState } from "react";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import http from "../../helpers/Http";
import UserForm from "../../hooks/UserForm";
import alerts from "../../helpers/Alerts";
export const CommissionHistoryModal = ({ onClose, advisorId }) => {
  if (!advisorId) return null;
  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto">
        <article className="modal-content text-center px-5 py-4">
          <div className="d-flex justify-content-center align-items-center conten-title mb-3 rounded">
            <h3 className="text-white">
              Historial de comisiones o anticipos de {advisorId.firstName}{" "}
              {advisorId.surname} {advisorId.secondSurname}{" "}
              {advisorId.secondSurname}
            </h3>
          </div>
          <div className="d-flex justify-content-center align-items-center">
            <button
              className="btn btn-danger"
              onClick={() => {
                onClose();
              }}
            >
              <FontAwesomeIcon icon={faRectangleXmark} />
            </button>
          </div>
        </article>
      </div>
    </>
  );
};
export default CommissionHistoryModal;
CommissionHistoryModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  advisorId: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    firstName: PropTypes.string.isRequired,
    secondName: PropTypes.string,
    surname: PropTypes.string.isRequired,
    secondSurname: PropTypes.string,
  }).isRequired,
};
