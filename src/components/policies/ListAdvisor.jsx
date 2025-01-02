import { useEffect, useState, useCallback } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import dayjs from "dayjs";
import "dayjs/locale/es";
import Modal from "../../helpers/modal/Modal";
const ListAdvisor = () => {
  const [advisor, setAdvisor] = useState([]);
  const [advisorId, setAdvisorId] = useState({});

  const [modalType, setModalType] = useState(""); // Estado para controlar el tipo de modal
  const [showModal, setShowModal] = useState(false); // Estado para mostrar/ocultar modal

  dayjs.locale("es");
  const openModal = () => {
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
  };

  const getAvidorById = useCallback(async (advisorId, type) => {
    try {
      const response = await http.get(`advisor/get-advisor/${advisorId}`);
      console.log("Asesor por id obtenido: ", response.data.advisorById);
      console.log("Tipo de modal: ", type);
      setAdvisorId(response.data.advisorById);
      setModalType(type);
      openModal();
    } catch (error) {
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching asesores:", error);
    }
  }, []);

  const getAllAdvisor = useCallback(async () => {
    try {
      const response = await http.get("advisor/get-all-advisor");
      if (response.data.status === "success") {
        setAdvisor(response.data.allAdvisors); // Asume que la respuesta contiene un array de usuarios bajo la clave 'allUser'
        console.log(response.data.allAdvisors);
        //openModal(advisorId);
      } else {
        alerts("Error", "No existen asesores registrados", "error");
        console.error("Error fetching asesores:", response.message);
      }
    } catch (error) {
      //setError(error);
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching asesores:", error);
    }
  }, []);

  useEffect(() => {
    getAllAdvisor();
  }, [getAllAdvisor]);
  return (
    <>
      <div className="text-center py-2">
        <h2 className="py-2">Lista de Asesores</h2>
        <table className="table table-striped py-2">
          <thead>
            <tr>
              <th>N°</th>
              <th>Cédula / RUC</th>
              <th colSpan="4" scope="row">
                Asesor
              </th>
              <th>Fecha de nacimiento</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Fecha de Registro</th>
              <th>Tratatamiento de datos personales</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {advisor.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.ci_ruc}</td>
                <td>{item.firstName}</td>
                <td>{item.secondName}</td>
                <td>{item.surname}</td>
                <td>{item.secondSurname}</td>
                <td>{dayjs(item.birthdate).format("DD/MM/YYYY").toString()}</td>
                <td>{item.numberPhone}</td>
                <td>{item.email}</td>
                <td>
                  {dayjs(item.createdAt).format("dddd DD/MM/YYYY").toString()}
                </td>
                <td>{item.personalData === "true" ? "SÍ" : "NO"}</td>

                <td>
                  <button className="btn btn-success text-white fw-bold w-100 my-1">
                    Actualizar
                  </button>

                  <button
                    onClick={() => getAvidorById(item.id, "advisor")}
                    className="btn btn-success text-white fw-bold w-100 my-1"
                  >
                    Registrar Anticipio
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {advisorId && typeof advisorId === "object" && (
        // Renderiza el modal solo si policy tiene un valor
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          advisorId={advisorId}
          modalType={modalType} // Pasamos el tipo de modal a mostrar
        ></Modal>
      )}
    </>
  );
};

export default ListAdvisor;
