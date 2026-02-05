import PropTypes from "prop-types";
import { useState, useEffect, useCallback } from "react";
import {
    faRectangleXmark,
    faCreditCard,
    faKey,
    faCalendarAlt,
    faUniversity,
    faTags,
    faUser,
    faExclamationTriangle,
    faEye,
    faClock
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import alerts from "../Alerts";
import http from "../Http";
import dayjs from "dayjs";

const ViewCreditCardDetailsModal = ({ cardId, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [cardDetails, setCardDetails] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(30);

    // ✅ Obtener datos sensibles de la tarjeta
    const fetchCardDetails = useCallback(async () => {
        try {
            setIsLoading(true);

            const response = await http.get(`creditcard/reveal-card/${cardId}`);

            if (response.data.status === "success") {
                setCardDetails(response.data.cardDetails);

                alerts(
                    "Advertencia",
                    response.data.warning || "Estos datos no deben ser almacenados ni compartidos",
                    "warning"
                );
            } else {
                alerts("Error", response.data.message || "Error al obtener los datos", "error");
                onClose();
            }

        } catch (error) {
            console.error("Error fetching card details:", error);

            if (error.response?.data?.message) {
                alerts("Error", error.response.data.message, "error");
            } else {
                alerts("Error", "No se pudieron obtener los datos sensibles", "error");
            }

            onClose();
        } finally {
            setIsLoading(false);
        }
    }, [cardId, onClose]);

    // ✅ Cargar datos al montar el componente
    useEffect(() => {
        fetchCardDetails();
    }, [fetchCardDetails]);

    // ✅ Temporizador de 30 segundos para cerrar automáticamente
    useEffect(() => {
        if (!cardDetails) return;

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    alerts(
                        "Tiempo agotado",
                        "El modal se ha cerrado por seguridad después de 30 segundos",
                        "info"
                    );
                    onClose();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [cardDetails, onClose]);

    if (!cardDetails && !isLoading) return null;

    return (
        <>
            <div className="modal d-flex justify-content-center align-items-center mx-auto">
                <article className="modal-content text-center px-4 py-3" style={{ maxWidth: "700px", width: "90%" }}>
                    <div className="d-flex justify-content-center align-items-center conten-title py-3 mb-3 rounded position-relative">
                        <h3 className="text-white mb-0">
                            <FontAwesomeIcon icon={faEye} className="me-2" />
                            Datos Sensibles de Tarjeta
                        </h3>

                        {/* Temporizador visible */}
                        {cardDetails && (
                            <div
                                className="position-absolute end-0 me-3 badge bg-danger fs-6 px-3 py-2"
                                style={{ top: "50%", transform: "translateY(-50%)" }}
                            >
                                <FontAwesomeIcon icon={faClock} className="me-2" />
                                {timeRemaining}s
                            </div>
                        )}
                    </div>

                    {/* ✅ Overlay de loading */}
                    {isLoading && (
                        <div
                            className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.8)',
                                zIndex: 10,
                                borderRadius: '8px'
                            }}
                        >
                            <div className="text-center">
                                <div className="spinner-border text-primary mb-2" role="status">
                                    <span className="visually-hidden">Cargando...</span>
                                </div>
                                <p className="fw-bold text-primary mb-0">Obteniendo datos sensibles...</p>
                            </div>
                        </div>
                    )}

                    {cardDetails && (
                        <>
                            {/* Advertencia de seguridad */}
                            <div className="alert alert-warning d-flex align-items-center mb-4" role="alert">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="me-3 fs-4" />
                                <div className="text-start">
                                    <strong>¡ADVERTENCIA DE SEGURIDAD!</strong>
                                    <p className="mb-0 small">
                                        Estos datos son altamente sensibles. No los comparta ni los almacene.
                                        Este modal se cerrará automáticamente en {timeRemaining} segundos.
                                    </p>
                                </div>
                            </div>

                            <div className="row">
                                {/* Información del cliente */}
                                <div className="col-12 mb-3">
                                    <div className="card bg-light">
                                        <div className="card-body py-2">
                                            <h6 className="card-title mb-1">
                                                <FontAwesomeIcon icon={faUser} className="me-2" />
                                                Cliente
                                            </h6>
                                            <p className="mb-0">
                                                <strong>
                                                    {cardDetails.customer?.firstName} {cardDetails.customer?.secondName || ""} {cardDetails.customer?.surname} {cardDetails.customer?.secondSurname || ""}
                                                </strong>
                                                <br />
                                                <small>CI/RUC: {cardDetails.customer?.ci_ruc}</small>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Número de tarjeta completo */}
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-bold text-danger">
                                        <FontAwesomeIcon icon={faCreditCard} className="me-2" />
                                        Número de Tarjeta Completo
                                    </label>
                                    <div className="form-control bg-danger bg-opacity-10 border-danger text-center fs-5 fw-bold">
                                        {cardDetails.cardNumber || "N/A"}
                                    </div>
                                </div>

                                {/* Código de seguridad completo */}
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-bold text-danger">
                                        <FontAwesomeIcon icon={faKey} className="me-2" />
                                        Código de Seguridad
                                    </label>
                                    <div className="form-control bg-danger bg-opacity-10 border-danger text-center fs-5 fw-bold">
                                        {cardDetails.code || "N/A"}
                                    </div>
                                </div>

                                {/* Fecha de expiración */}
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-bold">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                                        Fecha de Expiración
                                    </label>
                                    <div className="form-control bg-light text-center">
                                        {cardDetails.expirationDate
                                            ? dayjs(cardDetails.expirationDate).format("DD/MM/YYYY")
                                            : "N/A"}
                                    </div>
                                </div>

                                {/* Banco */}
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-bold">
                                        <FontAwesomeIcon icon={faUniversity} className="me-2" />
                                        Banco
                                    </label>
                                    <div className="form-control bg-light text-center">
                                        {cardDetails.bank?.bankName || "N/A"}
                                    </div>
                                </div>

                                {/* Tipo de tarjeta */}
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-bold">
                                        <FontAwesomeIcon icon={faTags} className="me-2" />
                                        Tipo de Tarjeta
                                    </label>
                                    <div className="form-control bg-light text-center">
                                        {cardDetails.cardoption?.cardName || "N/A"}
                                    </div>
                                </div>

                                {/* Estado de la tarjeta */}
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-bold">
                                        Estado de la Tarjeta
                                    </label>
                                    <div className="form-control-plaintext text-center">
                                        <span
                                            className={`badge fw-bold fs-6 ${cardDetails.cardstatus?.id == 1
                                                    ? "bg-success"           // Activa
                                                    : cardDetails.cardstatus?.id == 2
                                                        ? "bg-warning text-dark" // Inactiva  
                                                        : cardDetails.cardstatus?.id == 3
                                                            ? "bg-danger"            // Bloqueada
                                                            : "bg-light text-dark"   // Default
                                                }`}
                                        >
                                            {cardDetails.cardstatus?.cardStatusName || "Sin estado"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Botón de cerrar */}
                            <div className="d-flex justify-content-center gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="btn btn-danger fw-bold px-5 py-2"
                                >
                                    <FontAwesomeIcon icon={faRectangleXmark} className="me-2" />
                                    Cerrar ({timeRemaining}s)
                                </button>
                            </div>

                            {/* Nota final de seguridad */}
                            <div className="mt-3">
                                <small className="text-muted">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                                    Los datos sensibles solo deben usarse para verificación y nunca deben ser compartidos.
                                </small>
                            </div>
                        </>
                    )}
                </article>
            </div>
        </>
    );
};

ViewCreditCardDetailsModal.propTypes = {
    cardId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    onClose: PropTypes.func.isRequired,
};

export default ViewCreditCardDetailsModal;
