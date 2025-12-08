import { useEffect, useState, useCallback } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import "@fontsource/roboto/500.css";
import "../../assets/css/home-dashboard.css";
import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TaskReminder from "../../helpers/TaskReminder";
import {
  faCircleExclamation,
  faClock,
  faWallet,
  faCreditCard,
  faListCheck,
  faPlus,
  faEye,
  faChartLine,
  faTasks,
  faExclamationTriangle,
  faCheckCircle,
  faMoneyBillWave,
  faCalendarCheck,
  faInfoCircle
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
      //const response = await http.get("policy/get-all-policy"); //RELACION `payments`, `renewals` (MUY LENTO Y ERROR DE MEMORY LEAK)
      //const response = await http.get("/policy/get-all-policy-optimized"); //SIN RELACIION  `payments`, `renewals`
      const response = await http.get("/policy/count-all-policies");
      if (response.data.status === "success") {
        console.log("TODAS LAS PÓLIZAS EN HOME: ", response.data);
        setAllPolicies(response.data.total);
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
        console.log(
          "PÓLIZAS CON PAGOS ATRASADOS EN HOME: ",
          response.data.paymentByStatus
        );
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

  const getTask = useCallback(async (userId, type) => {
    try {
      // Usar el endpoint específico que creaste
      const response = await http.get(`users/get-task/${userId}/tasks`);
      //console.log("response", response.data.tasks);
      if (response.data.status === "success") {
        const tasks = response.data.tasks || [];
        setTask(tasks);
        setTaskStatus(tasks.length > 0);
        if (type === "taskList") {
          setModalType(type);
          openModal();
        }
        return tasks; // Retorna las tareas obtenidas
      } else {
        setTaskStatus(false);
        setTask([]); // ✅ Limpiar tareas en caso de error
        console.error("Error fetching tasks:", response.message);
        return [];
      }
    } catch (error) {
      setTaskStatus(false);
      setTask([]);
      console.error("Error fetching tasks:", error);
      return []; // ✅ Devolver array vacío
    }
  }, []);

  // Función para manejar cuando se crea una nueva tarea

  const handleTaskCreated = useCallback(
    (newTask) => {
      console.log("Nueva tarea creada:", newTask);
      setTask((prevTasks) => [...prevTasks, newTask]);
      setTaskStatus(true);

      // ✅ Opcional: Refrescar tareas desde el servidor para sincronizar
      if (auth?.uuid) {
        setTimeout(() => {
          getTask(auth.uuid);
        }, 500); // ✅ Pequeño delay para que el servidor procese
      }
    },
    [auth?.uuid, getTask]
  );

  const handleTaskDeleted = useCallback((deletedTaskId) => {
    console.log("Eliminando tarea con ID:", deletedTaskId);

    // ✅ Filtrar la tarea eliminada del estado
    setTask((prevTasks) => {
      const filteredTasks = prevTasks.filter(
        (task) => task.id !== deletedTaskId
      );

      // ✅ Actualizar taskStatus según las tareas restantes
      setTaskStatus(filteredTasks.length > 0);

      return filteredTasks;
    });
  }, []);

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
    // ...otros imports
  };
  return (
    <>
      <TaskReminder />
      <section>
        <div className="text-center mb-4">
          <h2 className="py-2 mb-3">
            <FontAwesomeIcon icon={faChartLine} className="me-3 text-primary pt-4" />
            Panel de Control - Resumen Ejecutivo de pólizas, pagos y tarjetas con sus respectivos estados
          </h2>
          <p className="py-1 fs-5 text-muted">
            <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
            Coloque el cursor sobre el ícono correspondiente para saber más detalles
          </p>
        </div>

        <div className="container-fluid text-center">
          <div className="row justify-content-center pt-3 gap-3">
            {/* Tarjeta de Pagos Atrasados */}
            <div className="col-lg-2 col-md-4 col-sm-6">
              <div className="card border-0 rounded-4 shadow-lg h-100 transition-hover">
                <div className="card-body p-4 text-center">
                  {!paymentStatusId ? (
                    <>
                      <div
                        className="d-inline-flex p-3 rounded-circle mb-3 shadow-sm"
                        style={{ backgroundColor: "rgba(255, 193, 7, 0.15)" }}
                      >
                        <FontAwesomeIcon
                          size="2x"
                          style={{ color: "#ffc107" }}
                          icon={faCheckCircle}
                        />
                      </div>
                      <h5 className="mb-3 text-dark fw-bold">Pagos Atrasados</h5>
                      <p className="fs-5 fw-bold mb-2 text-success">
                        ✅ Al día
                      </p>
                      <span className="text-muted fs-6">No hay pagos pendientes</span>
                    </>
                  ) : (
                    <>
                      <div
                        className="d-inline-flex p-3 rounded-circle mb-3 shadow-sm cursor-pointer"
                        style={{ backgroundColor: "rgba(255, 193, 7, 0.15)" }}
                      >
                        <button
                          onClick={() => getPaymenstByStatus("paymentByStatus")}
                          className="btn p-0 border-0 bg-transparent"
                          title="Ver detalles de pagos atrasados"
                        >
                          <FontAwesomeIcon
                            size="2x"
                            style={{ color: "#ffc107" }}
                            icon={faExclamationTriangle}
                            className="bounce-animation"
                          />
                        </button>
                      </div>
                      <h5 className="mb-3 text-dark fw-bold">Pagos Atrasados</h5>
                      <p
                        className="fs-1 fw-bold mb-2"
                        style={{ color: "#ffc107" }}
                      >
                        {payments.length}
                      </p>
                      <span className="text-muted fs-6">
                        <FontAwesomeIcon icon={faMoneyBillWave} className="me-1" />
                        Requieren atención
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Tarjeta de Pólizas Vencidas */}
            <div className="col-lg-2 col-md-4 col-sm-6">
              <div className="card border-0 rounded-4 shadow-lg h-100 transition-hover">
                <div className="card-body p-4 text-center">
                  {!policyStatus ? (
                    <>
                      <div
                        className="d-inline-flex p-3 rounded-circle mb-3 shadow-sm"
                        style={{ backgroundColor: "rgba(40, 167, 69, 0.15)" }}
                      >
                        <FontAwesomeIcon
                          size="2x"
                          style={{ color: "#28a745" }}
                          icon={faCalendarCheck}
                        />
                      </div>
                      <h5 className="mb-3 text-dark fw-bold">Pólizas Vigentes</h5>
                      <p className="fs-5 fw-bold mb-2 text-success">
                        ✅ Todas vigentes
                      </p>
                      <span className="text-muted fs-6">Sin vencimientos próximos</span>
                    </>
                  ) : (
                    <>
                      <div
                        className="d-inline-flex p-3 rounded-circle mb-3 shadow-sm cursor-pointer"
                        style={{ backgroundColor: "rgba(220, 53, 69, 0.15)" }}
                      >
                        <button
                          onClick={() => getAllPoliciesStatus("policyByStatus")}
                          className="btn p-0 border-0 bg-transparent"
                          title="Ver pólizas vencidas o por vencer"
                        >
                          <FontAwesomeIcon
                            size="2x"
                            style={{ color: "#dc3545" }}
                            icon={faClock}
                            className="bounce-animation"
                          />
                        </button>
                      </div>
                      <h5 className="mb-3 text-dark fw-bold">Pólizas Culminadas o por Culminar</h5>
                      <p
                        className="fs-1 fw-bold mb-2"
                        style={{ color: "#dc3545" }}
                      >
                        {policies.length}
                      </p>
                      <span className="text-muted fs-6">
                        <FontAwesomeIcon icon={faClock} className="me-1" />
                        Requieren renovación
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Tarjeta de Pólizas Contratadas */}
            <div className="col-lg-2 col-md-4 col-sm-6">
              <div className="card border-0 rounded-4 shadow-lg h-100 transition-hover">
                <div className="card-body p-4 text-center">
                  {!policy ? (
                    <>
                      <div
                        className="d-inline-flex p-3 rounded-circle mb-3 shadow-sm"
                        style={{ backgroundColor: "rgba(108, 117, 125, 0.15)" }}
                      >
                        <FontAwesomeIcon
                          size="2x"
                          style={{ color: "#6c757d" }}
                          icon={faWallet}
                        />
                      </div>
                      <h5 className="mb-3 text-dark fw-bold">Total de Pólizas
                        Contratadas
                      </h5>
                      <h5 className="mb-3 text-dark fw-bold">Pólizas Activas</h5>
                      <p className="fs-5 fw-bold mb-2 text-muted">
                        📋 Sin registro
                      </p>
                      <span className="text-muted fs-6">No hay pólizas registradas</span>
                    </>
                  ) : (
                    <>
                      <div
                        className="d-inline-flex p-3 rounded-circle mb-3 shadow-sm cursor-pointer"
                        style={{ backgroundColor: "rgba(25, 135, 84, 0.15)" }}
                      >
                        <NavLink
                          to="/management/get-all-policy"
                          className="text-decoration-none"
                          title="Ver todas las pólizas"
                        >
                          <FontAwesomeIcon
                            size="2x"
                            style={{ color: "#198754" }}
                            icon={faWallet}
                            className="bounce-animation"
                          />
                        </NavLink>
                      </div>
                      <h5 className="mb-3 text-dark fw-bold">Total de Pólizas
                        Contratadas</h5>
                      <p
                        className="fs-1 fw-bold mb-2"
                        style={{ color: "#198754" }}
                      >
                        {allPolicies}
                      </p>
                      <span className="text-muted fs-6">
                        <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                        Contratos vigentes
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {/* Tarjeta de Tarjetas de Crédito */}
            <div className="col-lg-2 col-md-4 col-sm-6">
              <div className="card border-0 rounded-4 shadow-lg h-100 transition-hover">
                <div className="card-body p-4 text-center">
                  {!cardStatus ? (
                    <>
                      <div
                        className="d-inline-flex p-3 rounded-circle mb-3 shadow-sm"
                        style={{ backgroundColor: "rgba(25, 135, 84, 0.15)" }}
                      >
                        <FontAwesomeIcon
                          size="2x"
                          style={{ color: "#198754" }}
                          icon={faCheckCircle}
                        />
                      </div>
                      <h5 className="mb-3 text-dark fw-bold">Tarjetas Activas</h5>
                      <p className="fs-5 fw-bold mb-2 text-success">
                        ✅ Todas vigentes
                      </p>
                      <span className="text-muted fs-6">Sin vencimientos próximos</span>
                    </>
                  ) : (
                    <>
                      <div
                        className="d-inline-flex p-3 rounded-circle mb-3 shadow-sm cursor-pointer"
                        style={{ backgroundColor: "rgba(102, 16, 242, 0.15)" }}
                      >
                        <button
                          onClick={() => getAllCardsExpireds("cardsByStatus")}
                          className="btn p-0 border-0 bg-transparent"
                          title="Ver tarjetas vencidas o por vencer"
                        >
                          <FontAwesomeIcon
                            size="2x"
                            style={{ color: "#6610f2" }}
                            icon={faCreditCard}
                            className="bounce-animation"
                          />
                        </button>
                      </div>
                      <h5 className="mb-3 text-dark fw-bold">Tarjetas por Vencer</h5>
                      <p
                        className="fs-1 fw-bold mb-2"
                        style={{ color: "#6610f2" }}
                      >
                        {cards.length}
                      </p>
                      <span className="text-muted fs-6">
                        <FontAwesomeIcon icon={faCreditCard} className="me-1" />
                        Requieren renovación
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {/* Tarjeta de Tareas */}
            <div className="col-lg-2 col-md-4 col-sm-6">
              <div className="card border-0 rounded-4 shadow-lg h-100 transition-hover">
                <div className="card-body p-4 text-center">
                  {!taskStatus ? (
                    <>
                      <div
                        className="d-inline-flex p-3 rounded-circle mb-3 shadow-sm"
                        style={{ backgroundColor: "rgba(25, 135, 84, 0.15)" }}
                      >
                        <FontAwesomeIcon
                          size="2x"
                          style={{ color: "#198754" }}
                          icon={faCheckCircle}
                        />
                      </div>
                      <h5 className="mb-3 text-dark fw-bold">Tareas Pendientes</h5>
                      <p className="fs-5 fw-bold mb-3 text-success">
                        ✅ Todo al día
                      </p>

                      {/* Botón crear siempre disponible */}
                      <button
                        className="btn d-flex align-items-center gap-2 mx-auto text-white fw-bold"
                        style={{ backgroundColor: "#ff9500" }}
                        onClick={() => {
                          setModalType("task");
                          openModal();
                        }}
                        title="Crear nueva tarea"
                      >
                        <FontAwesomeIcon icon={faPlus} />
                        Nueva Tarea
                      </button>
                    </>
                  ) : (
                    <>
                      <div
                        className="d-inline-flex p-3 rounded-circle mb-3 shadow-sm cursor-pointer"
                        style={{ backgroundColor: "rgba(255, 149, 0, 0.15)" }}
                      >
                        <button
                          onClick={() => {
                            console.log("Abriendo modal de tareas...");
                            getTask(auth?.uuid, "taskList");
                          }}
                          className="btn p-0 border-0 bg-transparent"
                          title="Ver tareas pendientes"
                        >
                          <FontAwesomeIcon
                            size="2x"
                            style={{ color: "#ff9500" }}
                            icon={faTasks}
                            className="bounce-animation"
                          />
                        </button>
                      </div>
                      <h5 className="mb-3 text-dark fw-bold">Tareas Pendientes</h5>
                      <p
                        className="fs-1 fw-bold mb-3"
                        style={{ color: "#ff9500" }}
                      >
                        {task.length}
                      </p>

                      <div className="d-flex gap-2 justify-content-center">
                        <button
                          className="btn btn-sm d-flex align-items-center gap-1 text-white fw-bold"
                          style={{ backgroundColor: "#ff9500" }}
                          onClick={() => {
                            setModalType("task");
                            openModal();
                          }}
                          title="Crear nueva tarea"
                        >
                          <FontAwesomeIcon icon={faPlus} />
                          Nueva
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {showModal && (
          <Modal
            isOpen={showModal}
            onClose={closeModal}
            modalType={modalType}
            policies={policies || []}
            cards={cards || []}
            payments={payments || []}
            tasks={task || []}
            userId={auth?.uuid}
            onTaskCreated={handleTaskCreated}
            onTaskDeleted={handleTaskDeleted}
          ></Modal>
        )}
      </section>
    </>
  );
};

export default Home;
