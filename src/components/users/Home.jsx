import { useEffect, useState, useCallback } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import "@fontsource/roboto/500.css";
import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleExclamation,
  faClock,
  faWallet,
  faCreditCard,
  faListCheck,
  faPlus,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../../helpers/modal/Modal";
const Home = () => {
  const { auth, loading } = useAuth();

  const [cards, setCards] = useState([]);
  const [cardStatus, setCardStatus] = useState(false);

  const [allPolicies, setAllPolicies] = useState([]);
  const [policy, setPolicy] = useState(false);

  const [policies, setPolicies] = useState([]);
  const [policyStatus, setPolicyStatus] = useState(false);

  const [payments, setPayments] = useState([]);
  const [paymentStatusId, setPaymentStatus] = useState(false);

  const [task, setTask] = useState([]); // Estado para las tareas pendientes
  const [taskStatus, setTaskStatus] = useState(false); // Nuevo estado para controlar si hay tareas

  const [modalType, setModalType] = useState(""); // Estado para controlar el tipo de modal
  const [showModal, setShowModal] = useState(false); // Estado para mostrar/ocultar modal

  const getAllCardsExpireds = useCallback(async (type) => {
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
  }, []);

  const getAllPoliciesStatus = useCallback(async (type) => {
    try {
      const response = await http.get("policy/get-all-policy-status");
      if (response.data.status === "success") {
        setPolicies(response.data.policiesStatus);
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
  }, []);

  const getAllPolicies = useCallback(async () => {
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
  }, []);
  const getPaymenstByStatus = useCallback(async (type) => {
    try {
      //console.log("intentando obtener las polizas por estado");
      const response = await http.get("payment/get-payment-by-status");
      if (response.data.status === "success") {
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
  }, []);

  const getTask = useCallback(async (userId) => {
    try {
      // Usar el endpoint específico que creaste
      const response = await http.get(`users/get-task/${userId}/tasks`);
      console.log("response", response.data.tasks);
      if (response.data.status === "success") {
        setTask(response.data.tasks);
        setTaskStatus(response.data.tasks.length > 0);
      } else {
        setTaskStatus(false);
        console.error("Error fetching tasks:", response.message);
      }
    } catch (error) {
      setTaskStatus(false);
      console.error("Error fetching tasks:", error);
    }
  }, []);

  // Función para manejar cuando se crea una nueva tarea
  const handleTaskCreated = (newTask) => {
    setTask((prevTasks) => [...prevTasks, newTask]);
    setTaskStatus(true);
    // Refrescar las tareas desde el servidor para asegurar sincronización
    if (auth?.uuid) {
      getTask(auth.uuid);
    }
  };

  //  SOLO ejecutar una vez cuando auth.uuid esté disponible
  useEffect(() => {
    if (!loading && auth?.uuid) {
      getAllCardsExpireds();
      getAllPoliciesStatus();
      getAllPolicies();
      getPaymenstByStatus();
      // Ejecutar getTask de forma independiente para que no afecte las otras funciones
      getTask(auth.uuid).catch((error) => {
        console.warn("Error al obtener tareas:", error);
        // Asegurar que taskStatus se mantenga en false si hay error
        setTaskStatus(false);
      });
    }
  }, [
    loading, // Solo depende de loading y auth.uuid
    auth?.uuid, // Solo se ejecuta cuando cambie el usuario o cuando termine de cargar
    getAllCardsExpireds,
    getAllPoliciesStatus,
    getAllPolicies,
    getPaymenstByStatus,
    getTask,
  ]);
  const openModal = () => {
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
  };
  //  SOLO ejecutar una vez cuando auth.uuid esté disponible
  useEffect(() => {
    if (!loading && auth?.uuid) {
      getAllCardsExpireds();
      getAllPoliciesStatus();
      getAllPolicies();
      getPaymenstByStatus();

      // Ejecutar getTask de forma independiente para que no afecte las otras funciones
      getTask(auth.uuid).catch((error) => {
        console.warn("Error al obtener tareas:", error);
        // Asegurar que taskStatus se mantenga en false si hay error
        setTaskStatus(false);
      });
    }
  }, [
    loading,
    auth?.uuid,
    getAllCardsExpireds,
    getAllPoliciesStatus,
    getAllPolicies,
    getPaymenstByStatus,
    getTask,
  ]);
  return (
    <>
      <section>
        <h2 className="py-2">Detalle de pagos, pólizas y tarjetas </h2>
        <p className="py-1 fs-5">
          Coloque el cursor sobre el ícono correspondiente para saber más
          detalles
        </p>

        <div className="container-fluid text-center">
          <div className="row  justify-center-between pt-3  gap-2 ">
            <div className="col-2 card border-4 rounded-4 shadow-sm transition mx-1">
              <div className="p-4 text-center ">
                {!paymentStatusId ? (
                  <>
                    <div
                      className="d-inline-flex p-3 rounded-circle mb-3"
                      style={{ backgroundColor: "rgba(255, 193, 7, 0.1)" }}
                    >
                      <button
                        disabled
                        //onClick={() => getPaymenstByStatus("paymentByStatus")}
                      >
                        <FontAwesomeIcon
                          size={24}
                          style={{ color: "#ffc107" }}
                          icon={faCircleExclamation}
                        />
                      </button>
                    </div>
                    <h4 className="mb-3">Pólizas con pagos atrasados</h4>
                    <p
                      className="fs-4 fw-bold mb-0 "
                      style={{ color: "#ffc107" }}
                    >
                      No hay pagos atrasados
                    </p>
                  </>
                ) : (
                  <>
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
                    <p
                      className="fs-1 fw-bold mb-0 "
                      style={{ color: "#ffc107" }}
                    >
                      {payments.length}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="col-2 card border-4 rounded-4 shadow-sm transition mx-1">
              <div className="p-4 text-center ">
                {!policyStatus ? (
                  <>
                    <div
                      className="d-inline-flex p-3 rounded-circle mb-3"
                      style={{ backgroundColor: "rgba(255, 59, 48, 0.1)" }}
                    >
                      <button
                        disabled
                        //onClick={() => getAllPoliciesStatus("policyByStatus")}
                      >
                        <FontAwesomeIcon
                          size={24}
                          style={{ color: "#ff3b30" }}
                          icon={faClock}
                        />
                      </button>
                    </div>
                    <h4 className="mb-3">Pólizas culminadas o culminar</h4>
                    <p
                      className="fs-4 fw-bold mb-0 "
                      style={{ color: "#ff3b30" }}
                    >
                      No hay polzias vencidas
                    </p>
                  </>
                ) : (
                  <>
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
                    <p
                      className="fs-1 fw-bold mb-0 "
                      style={{ color: "#ff3b30" }}
                    >
                      {policies.length}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="col-2 card border-4 rounded-4 shadow-sm transition mx-1">
              <div className="p-4 text-center ">
                {!policy ? (
                  <>
                    <div
                      className="d-inline-flex p-3 rounded-circle mb-3"
                      style={{ backgroundColor: "rgba(52, 199, 89, 0.1)" }}
                    >
                      <button disabled>
                        <FontAwesomeIcon
                          size={24}
                          style={{ color: "#34c759" }}
                          icon={faWallet}
                        />
                      </button>
                    </div>
                    <h4 className="mb-3">Pólizas Contratadas</h4>
                    <p
                      className="fs-4 fw-bold mb-0 "
                      style={{ color: "#34c759" }}
                    >
                      No hay pólizas registardas
                    </p>
                  </>
                ) : (
                  <>
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
                    <p
                      className="fs-1 fw-bold mb-0 "
                      style={{ color: "#34c759" }}
                    >
                      {allPolicies.length}
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="col-2 card border-4 rounded-4 shadow-sm transition mx-1">
              <div className="p-4 text-center ">
                {!cardStatus ? (
                  <>
                    <div
                      className="d-inline-flex p-3 rounded-circle mb-3"
                      style={{ backgroundColor: "rgba(88, 86, 214, 0.1)" }}
                    >
                      <button
                        disabled
                        //onClick={() => getAllCardsExpireds("cardsByStatus")}
                      >
                        <FontAwesomeIcon
                          size={24}
                          style={{ color: "#5856d6" }}
                          icon={faCreditCard}
                        />
                      </button>
                    </div>
                    <h4 className="mb-3">Tarjetas vencidas o por vencer</h4>
                    <p
                      className="fs-4 fw-bold mb-0 "
                      style={{ color: "#5856d6" }}
                    >
                      No hay tarjetas actualmete
                    </p>
                  </>
                ) : (
                  <>
                    <div
                      className="d-inline-flex p-3 rounded-circle mb-3"
                      style={{ backgroundColor: "rgba(88, 86, 214, 0.1)" }}
                    >
                      <button
                        onClick={() => getAllCardsExpireds("cardsByStatus")}
                      >
                        <FontAwesomeIcon
                          size={24}
                          style={{ color: "#5856d6" }}
                          icon={faCreditCard}
                          bounce
                        />
                      </button>
                    </div>
                    <h4 className="mb-3">Tarjetas vencidas o por vencer</h4>
                    <p
                      className="fs-1 fw-bold mb-0 "
                      style={{ color: "#5856d6" }}
                    >
                      {cards.length}
                    </p>
                  </>
                )}
              </div>
            </div>
            {/* Reemplazar la última tarjeta con la tarjeta de tareas corregida */}
            <div className="col-2 card border-4 rounded-4 shadow-sm transition mx-1">
              <div className="p-4 text-center">
                {!taskStatus ? (
                  <>
                    <div
                      className="d-inline-flex p-3 rounded-circle mb-3"
                      style={{ backgroundColor: "rgba(255, 149, 0, 0.1)" }}
                    >
                      <FontAwesomeIcon
                        size={24}
                        style={{ color: "#ff9500" }}
                        icon={faListCheck}
                      />
                    </div>
                    <h4 className="mb-3">Tareas pendientes</h4>
                    <p
                      className="fs-4 fw-bold mb-3"
                      style={{ color: "#ff9500" }}
                    >
                      No hay tareas pendientes
                    </p>

                    {/* Botón crear siempre disponible */}
                    <button
                      className="btn  d-flex align-items-center gap-1 mx-auto text-white fw-bold bt-task"
                      onClick={() => {
                        setModalType("task");
                        openModal();
                      }}
                      title="Crear nueva tarea"
                    >
                      <FontAwesomeIcon icon={faPlus} size="sm" />
                      Crear Tarea
                    </button>
                  </>
                ) : (
                  <>
                    <div
                      className="d-inline-flex p-3 rounded-circle mb-3"
                      style={{ backgroundColor: "rgba(255, 149, 0, 0.1)" }}
                    >
                      <FontAwesomeIcon
                        size={24}
                        style={{ color: "#ff9500" }}
                        icon={faListCheck}
                        bounce
                      />
                    </div>
                    <h4 className="mb-3">Tareas pendientes</h4>
                    <p
                      className="fs-1 fw-bold mb-3"
                      style={{ color: "#ff9500" }}
                    >
                      {task.length}
                    </p>

                    {/* Ambos botones cuando hay tareas */}
                    <div className="d-flex gap-2 justify-content-center  fw-bold">
                      <button
                        className="btn  bt-task text-white d-flex align-items-center gap-1"
                        onClick={() => {
                          setModalType("task");
                          openModal();
                        }}
                        title="Crear nueva tarea"
                      >
                        <FontAwesomeIcon icon={faPlus} size="sm" />
                        Crear Trea
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                        onClick={() => {
                          console.log("Modal de ver tareas - por implementar");
                        }}
                        title="Ver tareas pendientes"
                      >
                        <FontAwesomeIcon icon={faEye} size="sm" />
                        Ver
                      </button>
                    </div>
                  </>
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
            task={task}
            userId={auth?.uuid}
            onTaskCreated={handleTaskCreated}
          ></Modal>
        )}
      </section>
    </>
  );
};

export default Home;
