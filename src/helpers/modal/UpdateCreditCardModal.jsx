import PropTypes from "prop-types";
import UserForm from "../../hooks/UserForm";
import { useState, useEffect, useCallback } from "react";
import { 
    faRectangleXmark, 
    faCreditCard, 
    faSave, 
    faKey, 
    faCalendarAlt, 
    faUniversity, 
    faTags,
    faUser 
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import alerts from "../Alerts";
import http from "../Http";
import dayjs from "dayjs";

const UpdateCreditCardModal = ({ card, onClose, onCardUpdated }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [banks, setBanks] = useState([]);
    const [cardOptions, setCardOptions] = useState([]);

    // ✅ Usar UserForm para manejar el estado del formulario
    const { form, changed } = UserForm({
        cardNumber: card?.cardNumber || "",
        code: card?.code || "",
        expirationDate: card?.expirationDate
            ? dayjs(card.expirationDate).format("YYYY-MM-DD")
            : "",
        bank_id: card?.bank?.id || "",
        card_option_id: card?.cardoption?.id || ""
    });

    // ✅ Cargar datos iniciales con useCallback
    const fetchData = useCallback(async () => {
        try {
            const [banksResponse, cardOptionsResponse] = await Promise.all([
                http.get("creditcard/all-banks"),
                http.get("creditcard/all-types"),
            ]);

            setBanks(banksResponse.data?.allBanks || []);
            setCardOptions(cardOptionsResponse.data?.allTypes || []);

        } catch (error) {
            console.error("Error fetching data:", error);
            alerts("Error", "No se pudieron cargar los datos necesarios", "error");
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ✅ Función para actualizar la tarjeta con useCallback
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        try {
            setIsLoading(true);

            // Validaciones básicas
            if (!form.cardNumber.trim()) {
                alerts("Error", "El número de tarjeta es obligatorio", "error");
                return;
            }

            if (!form.code.trim()) {
                alerts("Error", "El código de seguridad es obligatorio", "error");
                return;
            }

            if (!form.expirationDate) {
                alerts("Error", "La fecha de expiración es obligatoria", "error");
                return;
            }

            if (!form.bank_id) {
                alerts("Error", "Debe seleccionar un banco", "error");
                return;
            }

            if (!form.card_option_id) {
                alerts("Error", "Debe seleccionar un tipo de tarjeta", "error");
                return;
            }

            // Preparar datos para envío (sin estado - lo determina el backend)
            const updateData = {
                cardNumber: form.cardNumber.trim(),
                code: form.code.trim(),
                expirationDate: form.expirationDate,
                bank_id: parseInt(form.bank_id),
                card_option_id: parseInt(form.card_option_id)
            };

            // Realizar petición de actualización
            const response = await http.put(`creditcard/update-card/${card.id}`, updateData);

            if (response.data.status === "success") {
                alerts("Éxito", "Tarjeta actualizada correctamente", "success");

                // Notificar al componente padre con los datos actualizados
                if (onCardUpdated) {
                    onCardUpdated(response.data.updatedCard || { ...card, ...updateData });
                }

                onClose();
            } else {
                alerts("Error", response.data.message || "Error al actualizar la tarjeta", "error");
            }

        } catch (error) {
            console.error("Error al actualizar tarjeta:", error);

            if (error.response?.data?.message) {
                alerts("Error", error.response.data.message, "error");
            } else {
                alerts("Error", "No se pudo actualizar la tarjeta", "error");
            }
        } finally {
            setIsLoading(false);
        }
    }, [form, card, onCardUpdated, onClose]);

    if (!card) return null;

    return (
        <>
            <div className="modal d-flex justify-content-center align-items-center mx-auto">
                <article className="modal-content text-center px-4 py-3" style={{ maxWidth: "600px", width: "90%" }}>
                    <div className="d-flex justify-content-center align-items-center conten-title py-3 mb-3 rounded">
                        <h3 className="text-white mb-0">
                            <FontAwesomeIcon icon={faCreditCard} className="me-2" />
                            Actualizar Tarjeta de Crédito
                        </h3>
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
                                    <span className="visually-hidden">Actualizando...</span>
                                </div>
                                <p className="fw-bold text-primary mb-0">Actualizando tarjeta...</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={isLoading ? 'opacity-50' : ''}>
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
                                            <strong>{card.customer?.firstName} {card.customer?.surname}</strong>
                                            <br />
                                            <small>CI/RUC: {card.customer?.ci_ruc}</small>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Número de tarjeta */}
                            <div className="col-md-6 mb-3">
                                <label htmlFor="cardNumber" className="form-label fw-bold">
                                    <FontAwesomeIcon icon={faCreditCard} className="me-2" />
                                    Número de Tarjeta *
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="cardNumber"
                                    name="cardNumber"
                                    value={form.cardNumber}
                                    onChange={changed}
                                    placeholder="Ej: 1234-5678-9012-3456"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Código de seguridad */}
                            <div className="col-md-6 mb-3">
                                <label htmlFor="code" className="form-label fw-bold">
                                    <FontAwesomeIcon icon={faKey} className="me-2" />
                                    Código de Seguridad *
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="code"
                                    name="code"
                                    value={form.code}
                                    onChange={changed}
                                    placeholder="Ej: 123"
                                    maxLength="4"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Fecha de expiración */}
                            <div className="col-md-6 mb-3">
                                <label htmlFor="expirationDate" className="form-label fw-bold">
                                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                                    Fecha de Expiración *
                                </label>
                                <input
                                    type="date"
                                    className="form-control"
                                    id="expirationDate"
                                    name="expirationDate"
                                    value={form.expirationDate}
                                    onChange={changed}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Banco */}
                            <div className="col-md-6 mb-3">
                                <label htmlFor="bank_id" className="form-label fw-bold">
                                    <FontAwesomeIcon icon={faUniversity} className="me-2" />
                                    Banco *
                                </label>
                                <select
                                    className="form-select"
                                    id="bank_id"
                                    name="bank_id"
                                    value={form.bank_id}
                                    onChange={changed}
                                    required
                                    disabled={isLoading}
                                >
                                    <option value="">Seleccione un banco</option>
                                    {banks.map((bank) => (
                                        <option key={bank.id} value={bank.id}>
                                            {bank.bankName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Tipo de tarjeta */}
                            <div className="col-md-6 mb-3">
                                <label htmlFor="cardoption_id" className="form-label fw-bold">
                                    <FontAwesomeIcon icon={faTags} className="me-2" />
                                    Tipo de Tarjeta *
                                </label>
                                <select
                                    className="form-select"
                                    id="card_option_id"
                                    name="card_option_id"
                                    value={form.card_option_id}
                                    onChange={changed}
                                    required
                                    disabled={isLoading}
                                    selected
                                >
                                    <option value="">Seleccione tipo de tarjeta</option>
                                    {cardOptions.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.cardName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* ✅ Estado actual de la tarjeta (solo lectura - lo determina el backend) */}
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-bold">
                                    Estado Actual
                                </label>
                                <div className="form-control-plaintext">
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
                                    <small className="fs-6 d-block text-muted mt-1">
                                        * El estado se actualiza automáticamente según la fecha de expiración
                                    </small>
                                </div>
                            </div>

                        </div>

                        {/* Botones */}
                        <div className="d-flex justify-content-center gap-3 mt-4">
                            <button
                                type="submit"
                                className="btn btn-success fw-bold px-4"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="spinner-border spinner-border-sm me-2" role="status">
                                            <span className="visually-hidden">Actualizando...</span>
                                        </div>
                                        Actualizando...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faSave} className="me-2" />
                                        Actualizar Tarjeta
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={onClose}
                                className="btn btn-danger fw-bold px-4"
                                disabled={isLoading}
                            >
                                <FontAwesomeIcon icon={faRectangleXmark} className="me-2" />
                                Cancelar
                            </button>
                        </div>
                    </form>
                </article>
            </div>
        </>
    );
};

UpdateCreditCardModal.propTypes = {
    card: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        cardNumber: PropTypes.string,
        code: PropTypes.string,
        expirationDate: PropTypes.string,
        customer: PropTypes.shape({
            ci_ruc: PropTypes.string,
            firstName: PropTypes.string,
            surname: PropTypes.string,
        }),
        bank: PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            bankName: PropTypes.string,
        }),
        cardoption: PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            cardName: PropTypes.string,
        }),
        cardstatus: PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            cardStatusName: PropTypes.string,
        }),
    }).isRequired,
    onClose: PropTypes.func.isRequired,
    onCardUpdated: PropTypes.func,
};

export default UpdateCreditCardModal;