import { useEffect, useState } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import "@fontsource/roboto/500.css";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation, faClock, faWallet, faCreditCard } from "@fortawesome/free-solid-svg-icons"
const Home = () => {
  const [cards, setCards] = useState([]);
  const [cardStatus, setCardStatus] = useState(false);

  const [allPolicies, setAllPolicies] = useState([]);
  const [policy, setPolicy] = useState(false);

  const [policies, setPolicies] = useState([]);
  const [policyStatus, setPolicyStatus] = useState(false);

  const [payments, setPayments] = useState([]);
  const [paymentStatus, setPaymenStatus] = useState(false);


  useEffect(() => {
    getAllCardsExpireds();
    getAllPoliciesStatus();
    getAllPolicies();
    getPaymenstByStatus();
  }, []);
  const getAllCardsExpireds = async () => {
    try {
      const response = await http.get("creditcard/all-cards-expireds");
      if (response.data.status === "success") {
        setCards(response.data.allCardsExpired); // Asume que la respuesta contiene un array de usuarios bajo la clave 'allUser'
        setCardStatus(true);
        console.log("Cards Data:", response.data.allCardsExpired); // Aquí puedes revisar la respuesta
      } else {
        setCardStatus(false);
      }
    } catch (error) {
      //setError(error);
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching users:", error);
    }
  };

  const getAllPoliciesStatus = async () => {
    try {
      const response = await http.get("policy/get-all-policy-status");
      console.log("Policies Status Data:", response.data.policiesStatus); // Aquí puedes revisar la respuesta
      if (response.data.status === "success") {
        setPolicies(response.data.policiesStatus);
        setPolicyStatus(true);
        console.log("Policies Status Data:", response.data.policiesStatus); // Aquí puedes revisar la respuesta
      } else {
        console.error("Error fetching polizas:", response.message);
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
        console.log("Policies Data:", response.data.allPolicy); // Aquí puedes revisar la respuesta
      } else {
        setPolicy(false);
        console.error("Error fetching polizas:", response.message);
      }
    } catch (error) {
      //setError(error);
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching póilzas:", error);
    }
  };
  const getPaymenstByStatus = async () => {
    try {
      const response = await http.get("payment/get-payment-1");
      if (response.data.status === "success") {
        setPayments(response.data.paymentByStatus);
        setPaymenStatus(true);
        console.log("Payments Data:", response.data.paymentByStatus); // Aquí puedes revisar la respuesta
      } else {
        setPaymenStatus(false);
        console.error("Error fetching polizas:", response.message);
      }
    } catch (error) {
      //setError(error);
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching póilzas:", error);
    }

  }


  return (
    <>
      <section>
        <h2 className="py-2">Detalle de pagos, pólizas y tarjetas </h2>
        <p className="py-1 fs-5">Coloque el cursor sobre el ícono correspondiente para saber más detalles </p>
        {/* Aquí va el contenido de la página 
        <div className="my-3">
          {!cardStatus ? (
            <h3>No hay tarjetas vencidas o por vencer actualmente</h3>
          ) : (
            <>
              <h3>Lista de tarjetas caducadas o por por caducar</h3>
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
                        {dayjs(card.expirationDate)
                          .format("MM/YYYY")
                          .toString()}
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
                              : ""
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
            </>
          )}
        </div>
        <div className="my-3">
          {!policyStatus ? (
            <h3>No hay pólizas terminadas o por terminar actualmente</h3>
          ) : (
            <>
              <h3>Listado de todas las póilzas terminadas o por terminar</h3>
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Número de Póliza</th>
                    <th>Cliente</th>
                    <th>Compañía</th>
                    <th>Tipo de Póliza</th>
                    <th>Fecha de Inicio</th>
                    <th>Fecha de Fin</th>
                    <th>Método de Pago</th>
                    <th>Banco (si aplica)</th>
                    <th>Frecuencia de Pago</th>
                    <th>Monto de Cobertura</th>
                    <th>Valor de la Póliza</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((policy, index) => (
                    <tr key={policy.id}>
                      <td>{index + 1}</td>
                      <td>{policy.numberPolicy}</td>
                      <td>
                        {policy.customer.firstName}{" "}
                        {policy.customer.secondName || ""}{" "}
                        {policy.customer.surname}{" "}
                        {policy.customer.secondSurname || ""}
                      </td>
                      <td>{policy.company.companyName}</td>
                      <td>{policy.policyType.policyName}</td>

                      <td>{dayjs(policy.startDate).format("DD/MM/YYYY")}</td>
                      <td>{dayjs(policy.endDate).format("DD/MM/YYYY")}</td>
                      <td>{policy.paymentMethod.methodName}</td>

                      <td>
                        {policy.bankAccount && policy.bankAccount.bank
                          ? policy.bankAccount.bank.bankName
                          : policy.creditCard && policy.creditCard.bank
                            ? policy.creditCard.bank.bankName
                            : "NO APLICA"}
                      </td>
                      <td>{policy.paymentFrequency.frequencyName}</td>
                      <td>{policy.coverageAmount}</td>
                      <td>{policy.policyValue}</td>
                      <td
                        className={
                          policy.policyStatus.id == 4
                            ? "bg-warning text-white fw-bold"
                            : policy.policyStatus.id == 3
                              ? "bg-danger text-white fw-bold"
                              : "bg-success-subtle"
                        }
                      >
                        {policy.policyStatus.statusName}
                      </td>
                      <td>
                        <button className="btn btn-success text-white fw-bold">
                          Ver información completa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>*/}
        <div className="container-fluid text-center">
          <div className="row align-items-start justify-center-between pt-3  gap-2 ">
            <div className="col-2 card border-4 rounded-4 shadow-sm transition mx-1">
              <div className="p-4 text-center ">
                <div className="d-inline-flex p-3 rounded-circle mb-3" style={{ backgroundColor: 'rgba(255, 193, 7, 0.1)' }}>
                  <button className=""><FontAwesomeIcon size={24} style={{ color: '#ffc107' }} bounce icon={faCircleExclamation} /></button>
                </div>
                <h4 className="mb-3">Pólizas con pagos atrasados</h4>
                {!paymentStatus ? (<p className="fs-4 fw-bold mb-0 " style={{ color: '#ffc107' }}>No hay pagos atrasados</p>) :
                  (<p className="fs-1 fw-bold mb-0 " style={{ color: '#ffc107' }} >{payments.length}</p>)}

              </div>
            </div>

            <div className="col-2 card border-4 rounded-4 shadow-sm transition mx-1">
              <div className="p-4 text-center ">
                <div className="d-inline-flex p-3 rounded-circle mb-3" style={{ backgroundColor: 'rgba(255, 59, 48, 0.1)' }}>
                  <button> <FontAwesomeIcon size={24} style={{ color: '#ff3b30' }} icon={faClock} bounce /></button>

                </div>
                <h4 className="mb-3">Pólizas culminadas o culminar</h4>
                {!policyStatus ? (<p className="fs-4 fw-bold mb-0 " style={{ color: '#ff3b30' }}>No hay pólizas </p>) :
                  <p className="fs-1 fw-bold mb-0 " style={{ color: '#ff3b30' }}>{policies.length}</p>}
              </div>
            </div>

            <div className="col-2 card border-4 rounded-4 shadow-sm transition mx-1">
              <div className="p-4 text-center ">
                <div className="d-inline-flex p-3 rounded-circle mb-3" style={{ backgroundColor: 'rgba(52, 199, 89, 0.1)' }}>
                  <button><FontAwesomeIcon size={24} style={{ color: '#34c759' }} icon={faWallet} bounce /></button>
                </div>
                <h4 className="mb-3">Pólizas Contratadas</h4>
                {!policy ? (<p className="fs-4 fw-bold mb-0 " style={{ color: '#34c759' }}>No hay pólizas registardas</p>) :
                  (<p className="fs-1 fw-bold mb-0 " style={{ color: '#34c759' }}>{allPolicies.length}</p>)}

              </div>
            </div>
            <div className="col-2 card border-4 rounded-4 shadow-sm transition mx-1">
              <div className="p-4 text-center ">
                <div className="d-inline-flex p-3 rounded-circle mb-3" style={{ backgroundColor: 'rgba(88, 86, 214, 0.1)' }}>
                  <button><FontAwesomeIcon size={24} style={{ color: '#5856d6' }} icon={faCreditCard} bounce /></button>
                </div>
                <h4 className="mb-3">Tarjetas vencidas o por vencer</h4>
                {!cardStatus ? (
                  <p className="fs-4 fw-bold mb-0 " style={{ color: '#5856d6' }} >No hay tarjetas actualmete</p>) : (

                  <p className="fs-1 fw-bold mb-0 " style={{ color: '#5856d6' }} >{cards.length}</p>)

                }
              </div>

            </div>

          </div>


        </div>
      </section >
    </>
  );
};

export default Home;
