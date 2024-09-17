import { useEffect, useState } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import dayjs from "dayjs";
const Home = () => {
  const [cards, setCards] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [cardStatus, setCardStatus] = useState(false);
  const [policyStatus, setPolicyStatus] = useState(false);
  useEffect(() => {
    getAllCardsExpireds();
    getAllPoliciesStatus();
  }, []);
  const getAllCardsExpireds = async () => {
    try {
      const response = await http.get("creditcard/all-cards-expireds");
      if (response.data.status === "success") {
        setCards(response.data.allCardsExpired); // Asume que la respuesta contiene un array de usuarios bajo la clave 'allUser'
        setCardStatus(true);
      } else {
        //alerts("Error", "No existen tarjetas registradas", "error");
        console.error("Error fetching users:", response.message);
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

  return (
    <>
      <div>
        <h2>Listado de póilzas y tarjetas vencidas o por vencer</h2>
        <div className="my-3">
          {!cardStatus ? (
            <h3>No hay tarjetas vencidas o por vencer actualemente</h3>
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
            <h3>No hay pólizas termidas o por terminar actualemente</h3>
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
                    <th>Porcentaje de la Agencia</th>
                    <th>Porcentaje del Asesor</th>
                    <th>Valor de la Póliza</th>
                    <th>Número de Pagos</th>
                    <th>Derecho de póliza</th>
                    <th>Pagos de comisiones al asesor</th>
                    <th>Estado</th>
                    <th>Observaciones</th>
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
                        {policy.creditCard && policy.creditCard.bank
                          ? policy.creditCard.bank.bankName
                          : "NO APLICA"}
                      </td>
                      <td>{policy.paymentFrequency.frequencyName}</td>
                      <td>{policy.coverageAmount}</td>
                      <td>{policy.agencyPercentage}</td>
                      <td>{policy.advisorPercentage}</td>
                      <td>{policy.policyValue}</td>
                      <td>{policy.numberOfPayments}</td>
                      <td>{policy.policyFee || "NO APLICA"}</td>
                      <td>{policy.paymentsToAdvisor}</td>
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
                      <td>{policy.observations || "N/A"}</td>
                      <td>
                        <button className="btn btn-success text-white fw-bold">
                          Actualizar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
