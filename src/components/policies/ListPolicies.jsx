import { useEffect, useState } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import dayjs from "dayjs";
import "dayjs/locale/es";
export const ListPolicies = () => {
  const [policies, setPolicies] = useState([]);

  useEffect(() => {
    getAllPolicies();
  }, []);
  dayjs.locale("es");
  const getAllPolicies = async () => {
    try {
      const response = await http.get("policy/get-all-policy");
      if (response.data.status === "success") {
        console.log(response);
        setPolicies(response.data.allPolicy);
      } else {
        alerts("Error", "No existen póilzas  registradas", "error");
        console.error("Error fetching polizas:", response.message);
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
        <h2>Listado general de todas las póilzas</h2>
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
                  {policy.customer.firstName} {policy.customer.secondName || ""}
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
      </div>
    </>
  );
};