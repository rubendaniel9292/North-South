import { useCallback, useEffect, useState } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import useAuth from "../../hooks/useAuth";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { 
  faUsers, 
  faTrash, 
  faUser,
  faShieldAlt,
  faEnvelope,
  faCalendarAlt,
  faCogs
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const UserList = () => {
  const [users, setUsers] = useState([]); // Almacenar la lista de usuarios en el estado
  //const [loading, setLoading] = useState(true); // Estado para mostrar que está cargando
  //const [error, setError] = useState(null); // Estado para manejar errores
  const { auth } = useAuth();

  useEffect(() => {
    getAllList();
  }, []);

  //formateo de fecha
  dayjs.locale("es");

  const getAllList = useCallback(async () => {
    try {
      /* peitcion fecth
            const token = localStorage.getItem('token');
            const request = await fetch(Global.url + 'users/all', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'token': token
                }
            });*/
      //const data = await request.json();
      //Peticion con axios: mas entendible mantenible y robusto
      const request = await http.get("users/all");
      //console.log("usuarios del sistema: ", request.data.users);
      if (request.data.status === "success") {
        setUsers(request.data.users); // Asume que la respuesta contiene un array de usuarios bajo la clave 'allUser'
        //console.log("usuarios del sistema: ", request);
      } else {
        alerts("Error", "No se pudo listar los usuarios.", "error");
        console.error("Error fetching users:", request.message);
      }
    } catch (error) {
      //setError(error);
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching users:", error);
    } finally {
      //setLoading(false);
    }
  }, []);
  const deleteUser = async (userId) => {
    try {
      //peticion mediante axios
      const request = await http.delete("users/delete/" + userId);
      console.log("Usuario eliminado: ", request.data.deletedUser);
      if (request.data.status === "success") {
        // Actualizar con filter la lista de usuarios eliminando el usuario eliminado
        setUsers((prevUsers) =>
          prevUsers.filter((user) => user.uuid !== userId)
        );
        alerts(
          "Eliminación exitosa",
          "Usuario eliminado correctamente",
          "success"
        );
      } else {
        //setSaved('error');
        alerts(
          "Error",
          "Usuario no eliminado correctamente. Ocurrió un error durante la eliminacion.",
          "error"
        );
      }
    } catch (erro) {
      alerts("Error", "No se pudo ejecutar la consulta", "error");
    } finally {
      //setLoading(false);
    }
  };
  return (
    <>
      <div>
        <div className="text-center py-3">
          <h2 className="py-2">
            <FontAwesomeIcon icon={faUsers} className="me-3 text-primary" />
            Lista de usuarios que hacen uso del sistema
          </h2>
          
          {/* Header con información */}
          <div className="row mb-4">
            <div className="col-md-6 mx-auto">
              <div className="card bg-info text-white">
                <div className="card-body py-2">
                  <h5 className="card-title mb-1">
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    Total de usuarios registrados
                  </h5>
                  <h3 className="mb-0">{users.length}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <table className="table table-striped">
          <thead>
            <tr>
              <th>N°</th>
              <th>
                <FontAwesomeIcon icon={faUser} className="me-2" />
                Nombre
              </th>
              <th>Apellido</th>
              <th>
                <FontAwesomeIcon icon={faShieldAlt} className="me-2" />
                Rol
              </th>
              <th>
                <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                Email
              </th>
              <th>Username</th>
              <th>
                <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                Fecha de Registro
              </th>
              <th>
                <FontAwesomeIcon icon={faCogs} className="me-2" />
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.uuid}>
                <td>{index + 1}</td>
                <td>{user.firstName}</td>
                <td>{user.surname}</td>
                <td>{user.role}</td>
                <td>{user.email}</td>
                <td>{user.userName}</td>
                <td>
                  {dayjs.utc(user.createdAt).format("dddd DD/MM/YYYY").toString()}
                </td>
                <td>
                  {user.uuid !== auth.uuid && (
                    <button
                      onClick={() => deleteUser(user.uuid)}
                      className="btn btn-danger text-white fw-bold"
                      title={`Eliminar usuario ${user.firstName} ${user.surname}`}
                    >
                      <FontAwesomeIcon icon={faTrash} className="me-2" />
                      Eliminar usuario
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default UserList;
