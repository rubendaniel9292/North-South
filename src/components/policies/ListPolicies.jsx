import { useCallback, useEffect, useState } from "react";
import Modal from "../../helpers/modal/Modal";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import dayjs from "dayjs";
import usePagination from "../../hooks/usePagination";
import useSearch from "../../hooks/useSearch";
import "dayjs/locale/es";
const ListPolicies = () => {
  const [policy, setPolicy] = useState({}); // Estado para una póliza específica
  const [policies, setPolicies] = useState([]); // Estado para todas las pólizas
  const [modalType, setModalType] = useState(""); // Estado para controlar el tipo de modal
  const [showModal, setShowModal] = useState(false); // Estado para mostrar/ocultar modal

  const itemsPerPage = 5; // Número de asesor por página
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

  //metodo de prueba de registro de pago de poliza

  const registerPaymentTest = useCallback(async () => {
    try {
      const response = await http.post(`payment/manual-process-payments`);
      console.log("respuesta de la peticion: ", response.data);

      if (response.data.status === "success") {
        alerts("Pago registrado", response.data.message, "success");
        console.log("Pagos creados:", response.data.data.createdPayments); // Mostrar detalles
      } else {
        alerts("Error", response.data.message, "error");
      }
    } catch (error) {
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error registering payment:", error);
    }
  }, []);
  // Función para recargar la póliza específica

  // Abrir modal y obtener la póliza seleccionada
  const openModal = () => {
    setShowModal(true);
  };
  //closeModal para recibir un parámetro opcional de actualización

  const closeModal = async () => {
    setPolicy(null);
    setShowModal(false);
  };

  useEffect(() => {
    getAllPolicies();
  }, []);

  //actualizar el estado de las polizas reemplazando la polizas específica con los datos actualizados de la política
  const handlePolicyUpdated = (policyUpdated) => {
    setPolicies((prevPolicy) =>
      prevPolicy.map((policy) =>
        policy.id === policyUpdated.id ? policyUpdated : policy
      )
    );
  };

  // Usar el hook personalizado para la búsqueda
  const {
    query,
    setQuery,
    filteredItems: filteredPolicy,
  } = useSearch(policies, [
    "numberPolicy",
    "ci_ruc",
    "firstName",
    "secondName",
    "surname",
    "secondSurname",
  ]);
  // Usar el hook personalizado para la paginación
  const {
    currentPage,
    currentItems: currentPolicies,
    totalPages,
    paginate,
  } = usePagination(filteredPolicy, itemsPerPage);

  // Generar números de página
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  dayjs.locale("es");
  const getAllPolicies = useCallback(async () => {
    try {
      const response = await http.get("policy/get-all-policy");
      if (response.data.status === "success") {
        setPolicies(response.data.allPolicy);
        console.log("TODAS LAS POLIZAS: ", response.data.allPolicy);
      } else {
        //alerts("Error", "No existen póilzas  registradas", "error");
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
          <div className="row">
            <div className="mb-3 col-5 py-2">
              <h4 className="py-2">Total de pólizas: {policies.length}</h4>
            </div>
            <div className="mb-3 col-5 py-2">
              <div className="mb-3 my-2">
                <label htmlFor="nameQuery" className="form-label fs-5">
                  Buscar poliza por número de póliza
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="nameQuery"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <button
                className="btn btn-danger text-white fw-bold my-1 w-100"
                onClick={() => registerPaymentTest()}
              >
                Probador manual de registro de pago
              </button>
            </div>
          </div>

          <table className="table table-striped py-1">
            <thead>
              <tr>
                <th>N°</th>
                <th>Número de Póliza</th>
                <th colSpan="2" scope="row">
                  Cliente
                </th>
                <th>Compañía</th>
                <th>Tipo de Póliza</th>
                <th>Fecha de Inicio</th>
                <th>Fecha de Fin</th>
                <th>Método de Pago</th>
                <th>Frecuencia de Pago</th>
                <th>Monto de Cobertura</th>
                <th>Estado</th>
                <th>Observaciones</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentPolicies.length === 0 ? (
                <tr>
                  <td colSpan="15" className="text-center">
                    Poliza no encontrada
                  </td>
                </tr>
              ) : (
                currentPolicies.map((policy, index) => (
                  <tr key={policy.id}>
                    <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td>{policy.numberPolicy}</td>
                    <td>
                      {policy.customer?.firstName}{" "}
                      {policy.customer?.secondName || " "}{" "}
                    </td>
                    <td>
                      {policy.customer?.surname}{" "}
                      {policy.customer?.secondSurname || " "}
                    </td>
                    <td>{policy.company?.companyName}</td>
                    <td>{policy.policyType?.policyName}</td>
                    <td>
                      {dayjs
                        .utc(policy.startDate)
                        .format("DD-MM-YYYY")
                        .toString()}
                    </td>
                    <td>
                      {dayjs
                        .utc(policy.endDate)
                        .format("DD-MM-YYYY")
                        .toString()}
                    </td>
                    <td>{policy.paymentMethod?.methodName}</td>

                    <td>{policy.paymentFrequency?.frequencyName}</td>
                    <td>{policy.coverageAmount}</td>
                    <td
                      className={
                        policy.policyStatus?.id == 4
                          ? "bg-warning text-white fw-bold"
                          : policy.policyStatus?.id == 3
                          ? "bg-danger text-white fw-bold"
                          : "bg-success-subtle"
                      }
                    >
                      {policy.policyStatus?.statusName}
                    </td>
                    <td>{policy.observations || "N/A"}</td>
                    <td className="d-flex gap-2">
                      <button
                        className="btn btn-primary text-white fw-bold my-1 w-100"
                        onClick={() => getPolicyById(policy.id, "info")}
                      >
                        Ver información completa
                      </button>

                      <button
                        className="btn btn-dark text-white fw-bold my-1 w-100"
                        onClick={() => getPolicyById(policy.id, "updatePolicy")}
                      >
                        Actualizar
                      </button>

                      <button
                        key={index}
                        className="btn btn-success text-white fw-bold my-1 w-100"
                        onClick={() => getPolicyById(policy.id, "payment")}
                      >
                        Añadir nota de pago
                      </button>

                      <button
                        className="btn btn-secondary text-white fw-bold my-1 w-100"
                        onClick={() => getPolicyById(policy.id, "renewal")}
                      >
                        Renovar póliza
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {filteredPolicy.length > itemsPerPage && (
            <nav aria-label="page navigation example">
              <ul className="pagination">
                <li
                  className={`page-item${currentPage === 1 ? " disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => paginate(currentPage - 1)}
                  >
                    Anterior
                  </button>
                </li>
                {pageNumbers.map((number) => (
                  <li
                    key={number}
                    className={`page-item${
                      currentPage === number ? " active" : ""
                    }`}
                  >
                    <button
                      onClick={() => paginate(number)}
                      className="page-link"
                    >
                      {number}
                    </button>
                  </li>
                ))}
                <li
                  className={`page-item${
                    currentPage === pageNumbers.length ? " disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => paginate(currentPage + 1)}
                  >
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
        {policy && typeof policy === "object" && (
          // Renderiza el modal solo si policy tiene un valor
          <Modal
            isOpen={showModal}
            onClose={closeModal}
            policy={policy}
            modalType={modalType}
            onPolicyUpdated={handlePolicyUpdated}
          ></Modal>
        )}
      </section>
    </>
  );
};
export default ListPolicies;
