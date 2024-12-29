import { useEffect, useState } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import "@fontsource/roboto/500.css";
import { NavLink } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleExclamation,
  faClock,
  faWallet,
  faCreditCard,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../../helpers/modal/Modal";
const Home = () => {
  const [cards, setCards] = useState([]);
  const [cardStatus, setCardStatus] = useState(false);

  const [allPolicies, setAllPolicies] = useState([]);
  const [policy, setPolicy] = useState(false);

  const [policies, setPolicies] = useState([]);
  const [policyStatus, setPolicyStatus] = useState(false);

  const [payments, setPayments] = useState([]);
  const [paymentStatusId, setPaymentStatus] = useState(false);

  const [modalType, setModalType] = useState(""); // Estado para controlar el tipo de modal
  const [showModal, setShowModal] = useState(false); // Estado para mostrar/ocultar modal

  useEffect(() => {
    getAllCardsExpireds();
    getAllPoliciesStatus();
    getAllPolicies();
    getPaymenstByStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const getAllCardsExpireds = async (type) => {
    try {
      const response = await http.get("creditcard/all-cards-expireds");
      if (response.data.status === "success") {
        setCards(response.data.allCardsExpired); // Asume que la respuesta contiene un array de usuarios bajo la clave 'allUser'
        //setModalData(response.data.allCardsExpired);
        setCardStatus(true);
        if (type === "cardsByStatus") {
          setModalType(type);
          openModal();
        }
      } else {
        setCardStatus(false);
      }
    } catch (error) {
      //setError(error);
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching users:", error);
    }
  };

  const getAllPoliciesStatus = async (type) => {
    try {
      const response = await http.get("policy/get-all-policy-status");
      if (response.data.status === "success") {
        setPolicies(response.data.policiesStatus);
        //setModalData(response.data.policiesStatus);
        setPolicyStatus(true);
        if (type === "policyByStatus") {
          setModalType(type); // Establece el tipo de modal a mostrar
          openModal();
        }
      } else {
        setPolicyStatus(false);
      }
    } catch (error) {
      //setError(error);
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching póilzas:", error);
    }
  };

  const getAllPolicies = async () => {
    try {
      const response = await http.get("policy/get-all-policy");
      if (response.data.status === "success") {
        setAllPolicies(response.data.allPolicy);
        setPolicy(true);
      } else {
        setPolicy(false);
        console.error("Error fetching polizas:", response.message);
      }
    } catch (error) {
      console.error("Error fetching póilzas:", error);
    }
  };
  const getPaymenstByStatus = async (type) => {
    try {
      //console.log("intentando obtener las polizas por estado");
      const response = await http.get("payment/get-payment-1");
      if (response.data.status === "success") {
        console.log("Payments Data:", response.data.paymentByStatus);
        setPayments(response.data.paymentByStatus);
        setPaymentStatus(true);
        if (type === "paymentByStatus") {
          setModalType(type);
          openModal();
        }
      } else {
        setPaymentStatus(false);
      }
    } catch (error) {
      //setError(error);
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching póilzas:", error);
    }
  };

  const openModal = () => {
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <section>
        <h2 className="py-2">Detalle de pagos, pólizas y tarjetas </h2>
        <p className="py-1 fs-5">
          Coloque el cursor sobre el ícono correspondiente para saber más
          detalles
        </p>

        <div className="container-fluid text-center">
          <div className="row align-items-start justify-center-between pt-3  gap-2 ">
            <div className="col-2 card border-4 rounded-4 shadow-sm transition mx-1">
              <div className="p-4 text-center ">
                <div
                  className="d-inline-flex p-3 rounded-circle mb-3"
                  style={{ backgroundColor: "rgba(255, 193, 7, 0.1)" }}
                >
                  <button
                    onClick={() => getPaymenstByStatus("paymentByStatus")}
                  >
                    <FontAwesomeIcon
                      size={24}
                      style={{ color: "#ffc107" }}
                      bounce
                      icon={faCircleExclamation}
                    />
                  </button>
                </div>
                <h4 className="mb-3">Pólizas con pagos atrasados</h4>
                {!paymentStatusId ? (
                  <p
                    className="fs-4 fw-bold mb-0 "
                    style={{ color: "#ffc107" }}
                  >
                    No hay pagos atrasados
                  </p>
                ) : (
                  <p
                    className="fs-1 fw-bold mb-0 "
                    style={{ color: "#ffc107" }}
                  >
                    {payments.length}
                  </p>
                )}
              </div>
            </div>

            <div className="col-2 card border-4 rounded-4 shadow-sm transition mx-1">
              <div className="p-4 text-center ">
                <div
                  className="d-inline-flex p-3 rounded-circle mb-3"
                  style={{ backgroundColor: "rgba(255, 59, 48, 0.1)" }}
                >
                  <button
                    onClick={() => getAllPoliciesStatus("policyByStatus")}
                  >
                    <FontAwesomeIcon
                      size={24}
                      style={{ color: "#ff3b30" }}
                      icon={faClock}
                      bounce
                    />
                  </button>
                </div>
                <h4 className="mb-3">Pólizas culminadas o culminar</h4>
                {!policyStatus ? (
                  <p
                    className="fs-4 fw-bold mb-0 "
                    style={{ color: "#ff3b30" }}
                  >
                    No hay pólizas{" "}
                  </p>
                ) : (
                  <p
                    className="fs-1 fw-bold mb-0 "
                    style={{ color: "#ff3b30" }}
                  >
                    {policies.length}
                  </p>
                )}
              </div>
            </div>

            <div className="col-2 card border-4 rounded-4 shadow-sm transition mx-1">
              <div className="p-4 text-center ">
                <div
                  className="d-inline-flex p-3 rounded-circle mb-3"
                  style={{ backgroundColor: "rgba(52, 199, 89, 0.1)" }}
                >
                  <NavLink to="/management/get-all-policy">
                    <FontAwesomeIcon
                      size={24}
                      style={{ color: "#34c759" }}
                      icon={faWallet}
                      bounce
                    />
                  </NavLink>
                </div>
                <h4 className="mb-3">Pólizas Contratadas</h4>
                {!policy ? (
                  <p
                    className="fs-4 fw-bold mb-0 "
                    style={{ color: "#34c759" }}
                  >
                    No hay pólizas registardas
                  </p>
                ) : (
                  <p
                    className="fs-1 fw-bold mb-0 "
                    style={{ color: "#34c759" }}
                  >
                    {allPolicies.length}
                  </p>
                )}
              </div>
            </div>
            <div className="col-2 card border-4 rounded-4 shadow-sm transition mx-1">
              <div className="p-4 text-center ">
                <div
                  className="d-inline-flex p-3 rounded-circle mb-3"
                  style={{ backgroundColor: "rgba(88, 86, 214, 0.1)" }}
                >
                  <button onClick={() => getAllCardsExpireds("cardsByStatus")}>
                    <FontAwesomeIcon
                      size={24}
                      style={{ color: "#5856d6" }}
                      icon={faCreditCard}
                      bounce
                    />
                  </button>
                </div>
                <h4 className="mb-3">Tarjetas vencidas o por vencer</h4>
                {!cardStatus ? (
                  <p
                    className="fs-4 fw-bold mb-0 "
                    style={{ color: "#5856d6" }}
                  >
                    No hay tarjetas actualmete
                  </p>
                ) : (
                  <p
                    className="fs-1 fw-bold mb-0 "
                    style={{ color: "#5856d6" }}
                  >
                    {cards.length}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {showModal && (
          <Modal
            isOpen={showModal}
            onClose={closeModal}
            modalType={modalType}
            policies={policies}
            cards={cards}
            payments={payments}
          ></Modal>
        )}
      </section>
    </>
  );
};

export default Home;
