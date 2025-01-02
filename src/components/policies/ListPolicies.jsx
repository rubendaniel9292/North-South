import { useCallback, useEffect, useState } from "react";
import Modal from "../../helpers/modal/Modal";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import dayjs from "dayjs";
import "dayjs/locale/es";
const ListPolicies = () => {
  const [policy, setPolicy] = useState({}); // Estado para una póliza específica
  const [policies, setPolicies] = useState([]); // Estado para todas las pólizas
  const [modalType, setModalType] = useState(""); // Estado para controlar el tipo de modal
  const [showModal, setShowModal] = useState(false); // Estado para mostrar/ocultar modal

  //conseguir la poliza por id
  const getPolicyById = useCallback(async (policyId, type) => {
    try {
      const response = await http.get(`policy/get-policy-id/${policyId}`);
      console.log("poliza por id obtenida: ", response.data);
      if (response.data.status === "success") {
        console.log("poliza obtenida: ", response.data.policyById);
        // Póliza encontrada, la almacenamos en el estado
        setPolicy(response.data.policyById);
        setModalType(type); // Establece el tipo de modal a mostrar
        openModal(policyId);
        console.log("respuesta de la peticion: ", response.data.policyById);
      } else {
        alerts(
          "Error",
          "No existen póilza registrada con id " + policyId,
          "error"
        );
        console.error("Error fetching polizas:", response.message);
      }
    } catch (error) {
      //setError(error);
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching póilzas:", error);
    }
    return null; // Devuelve null en caso de error
  }, []);

  // Abrir modal y obtener la póliza seleccionada
  const openModal = () => {
    setShowModal(true);
  };
  const closeModal = () => {
    setPolicy(null);
    setShowModal(false);
  };

  useEffect(() => {
    getAllPolicies();
  }, []);

  dayjs.locale("es");
  const getAllPolicies = useCallback(async () => {
    try {
      const response = await http.get("policy/get-all-policy");
      if (response.data.status === "success") {
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
  }, []);
  return (
    <>
      <section>
        <div className="text-center py-2">
          <h2 className="py-2">Listado general de todas las póilzas</h2>
          <table className="table table-striped py-2">
            <thead>
              <tr>
                <th>N°</th>
                <th>Número de Póliza</th>
                <th colSpan="2" scope="row" >Cliente</th>
                <th>Compañía</th>
                <th>Tipo de Póliza</th>
                <th>Fecha de Inicio</th>
                <th>Fecha de Fin</th>
                <th>Método de Pago</th>
                <th>Banco (si aplica)</th>
                <th>Frecuencia de Pago</th>
                <th>Monto de Cobertura</th>
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
                    {policy.customer.secondName || " "}{" "}

                  </td>
                  <td>

                    {policy.customer.surname}{" "}
                    {policy.customer.secondSurname || " "}
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
                    <button
                      className="btn btn-success text-white fw-bold my-1 w-100"
                      onClick={() => getPolicyById(policy.id, "info")}
                    >
                      Ver información completa
                    </button>

                    <button
                      key={index}
                      className="btn btn-success text-white fw-bold my-1 w-100"
                      onClick={() => getPolicyById(policy.id, "payment")}
                    >
                      Actualizar Pago
                    </button>

                    <button
                      className="btn btn-success text-white fw-bold my-1 w-100"
                      onClick={() => getPolicyById(policy.id, "renewal")}
                    >
                      Renovar póliza
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {policy && typeof policy === "object" && (
          // Renderiza el modal solo si policy tiene un valor
          <Modal
            isOpen={showModal}
            onClose={closeModal}
            policy={policy}
            modalType={modalType} // Pasamos el tipo de modal a mostrar
          ></Modal>
        )}
      </section>
    </>
  );
};
export default ListPolicies;