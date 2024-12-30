import { useEffect, useState, useCallback } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import dayjs from "dayjs";
import "dayjs/locale/es";
const ListAdvisor = () => {
  const [advisor, setAdvisor] = useState([]); // Almacenar la lista de clientes en el estado

  useEffect(() => {
    getAllAdvisor();
  }, []);

  dayjs.locale("es");
  const getAllAdvisor = useCallback(async () => {
    try {
      const response = await http.get("advisor/get-all-advisor");
      if (response.data.status === "success") {
        setAdvisor(response.data.allAdvisors); // Asume que la respuesta contiene un array de usuarios bajo la clave 'allUser'
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
      </div>
    </>
  );
};

export default ListAdvisor;
