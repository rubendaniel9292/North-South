import { useEffect, useState, useCallback } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import dayjs from "dayjs";
import "dayjs/locale/es";
import Modal from "../../helpers/modal/Modal";

const ListCustomer = () => {
  const [customerId, setCustomerId] = useState({}); // Almacenar un cliente de clientes en el estado
  const [customer, setCustomer] = useState([]); // Almacenar la lista de clientes en el estado
  const [modalType, setModalType] = useState(""); // Estado para controlar el tipo de modal
  const [showModal, setShowModal] = useState(false); // Estado para mostrar/ocultar modal

  const getCustomerById = useCallback(async (customerId, type) => {
    try {
      const response = await http.get(
        `customers/get-customer-id/${customerId}`
      );

      if (response.data.status === "success") {
        // Póliza encontrada, la almacenamos en el estado
        console.log("cliente obtenido:", response.data.customerById);
        const customer = response.data.customerById;
        if (!customer) {
          alerts("Error", "No existe cliente registrado con este ID", "error");
          return null;
        }
        // Verificar si el cliente tiene la propiedad `policies` y si está vacía
        if (!customer.policies || customer.policies.length === 0) {
          alerts(
            "Información",
            "El cliente aún no tiene pólizas contratadas",
            "warning"
          );
          return null;
        }
        setCustomerId(response.data.customerById);
        setModalType(type); // Establece el tipo de modal a mostrar
        openModal(customerId);
        //setShowModal(true); // Abre el modal
      } else {
        alerts(
          "Error",
          "No existe cliente registrado con id " + customerId,
          "error"
        );
        console.error(response.message);
      }
    } catch (error) {
      //setError(error);
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching customers:", error);
    }
    return null; // Devuelve null en caso de error
  },[]);



  // Abrir modal y obtener la póliza seleccionada
  const openModal = () => {
    setShowModal(true);
  };
  const closeModal = () => {
    setCustomerId(null);
    setShowModal(false);
  };

  dayjs.locale("es");

  useEffect(() => {
    getAllCustomers();
  }, []);

  const getAllCustomers = async () => {
    try {
      const response = await http.get("customers/get-all-customer");
      if (response.data.status === "success") {
        setCustomer(response.data.allCustomer);
        console.log(response.data);
      }
    } catch (error) {
      //setError(error);
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching users:", error);
    }
  };

  return (
    <>
      <div className="text-center py-2">
        <h2 className="py-2">Listado general de clientes</h2>
        <table className="table table-striped py-2">
          <thead>
            <tr>
              <th>N°</th>
              <th>Cédula / RUC</th>
              <th colSpan="4" scope="row" >Cliente</th>
              <th>Estado Civil</th>
              <th>Provincia</th>
              <th>Ciudad o Cantón</th>
              <th>Fecha de nacimiento</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Fecha de Registro</th>
              <th>Tratatamiento de datos personales</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {customer.map((customer, index) => (
              <tr key={customer.id}>
                <td>{index + 1}</td>
                <td>{customer.ci_ruc}</td>
                <td>{customer.firstName}</td>
                <td>{customer.secondName}</td>
                <td>{customer.surname}</td>
                <td>{customer.secondSurname}</td>
                <td>{customer.civil.status}</td>
                <td>{customer.province.provinceName}</td>
                <td>{customer.city.cityName}</td>
                <td>
                  {dayjs(customer.birthdate).format("DD/MM/YYYY").toString()}
                </td>

                <td>{customer.numberPhone}</td>
                <td>{customer.email}</td>
                <td>
                  {dayjs(customer.createdAt)
                    .format("dddd DD/MM/YYYY")
                    .toString()}
                </td>
                <td>{customer.personalData === true ? "SÍ" : "NO"}</td>

                <td>
                  <button
                    //onClick={() => deleteUser(user.uuid)}
                    className="btn btn-success text-white fw-bold my-1  w-100"
                    //onClick={() => getPolicyById(policy.id, "renewal")}
                  >
                    Actualizar Información
                  </button>

                  <button
                    //onClick={() => deleteUser(user.uuid)}

                    className="btn btn-success text-white fw-bold my-1 w-100 "
                    onClick={() => getCustomerById(customer.id, "customerId")}
                  >
                    Ver pólizas
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customerId && typeof customerId === "object" && (
          // Renderiza el modal solo si policy tiene un valor
          <Modal
            isOpen={showModal}
            onClose={closeModal}
            customerId={customerId}
            modalType={modalType} // Pasamos el tipo de modal a mostrar
          ></Modal>
        )}
      </div>
    </>
  );
};

export default ListCustomer;
