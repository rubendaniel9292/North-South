import { useEffect, useState } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import dayjs from "dayjs";
import "dayjs/locale/es";

const ListCustomer = () => {
  const [customer, setCustomer] = useState([]); // Almacenar la lista de clientes en el estado

  //const { auth } = useAuth();

  useEffect(() => {
    getAllCustomers();
  }, []);

  dayjs.locale("es");
  const getAllCustomers = async () => {
    try {
      const response = await http.get("customers/get-all-customer");
      if (response.data.status === "success") {
        console.log("infomacion completa de clientes: ", response.data);
        setCustomer(response.data.allCustomer); // Asume que la respuesta contiene un array de usuarios bajo la clave 'allUser'
      } else {
        alerts("Error", "No existen clientes registrados", "error");
        console.error("Error fetching users:", response.message);
      }
    } catch (error) {
      //setError(error);
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching users:", error);
    }
  };

  return (
    <>
      <div>
        <h2>Lista de clientes</h2>

        <table className="table table-striped">
          <thead>
            <tr>
              <th>N°</th>
              <th>Cédula / RUC</th>
              <th>Primer Nombre</th>
              <th>Segundo Nombre</th>
              <th>Primer Apellido</th>
              <th>Primer Segundo</th>
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
                    className="btn btn-success text-white fw-bold my-1"
                  >
                    Actualziar Información
                  </button>

                  <button
                    //onClick={() => deleteUser(user.uuid)}
                    className="btn btn-success text-white fw-bold my-1"
                  >
                    Ver pólizas del cliente
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

export default ListCustomer;
