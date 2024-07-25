//import { Global } from "../../helpers/Global";
import { useEffect, useState } from "react";
import alerts from "../../helpers/Alerts";
import http from '../../helpers/Http';
import useAuth from "../../hooks/useAuth";

const UserList = () => {
    const [users, setUsers] = useState([]); // Almacenar la lista de usuarios en el estado
    //const [loading, setLoading] = useState(true); // Estado para mostrar que está cargando
    //const [error, setError] = useState(null); // Estado para manejar errores
    const { auth } = useAuth();

    useEffect(() => {
        getAllList()
        //deleteUser(users);
    }, []);

    const getAllList = async () => {

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
            const request = await http.get('users/all');
            console.log('usuarios del sistema: ', request);

            if (request.data.status === 'success') {
                setUsers(request.data.users); // Asume que la respuesta contiene un array de usuarios bajo la clave 'allUser'
                console.log('usuarios del sistema: ', request);
            } else {
                alerts('Error', 'No se pudo listar los usuarios.', 'error');
                console.error('Error fetching users:', request.message);
            }
        } catch (error) {
            //setError(error);
            alerts('Error', 'No se pudo ejecutar la consulta', 'error');
            console.error('Error fetching users:', error);
        } finally {
            //setLoading(false);
        }
    }
    const deleteUser = async (userId) => {
        try {
            //peticion mediante axios
            const request = await http.delete('users/delete/' + userId);
            console.log('Usuario eliminado: ', request.data.deletedUser);
            if (request.data.status === 'success') {
                // Actualizar con filter la lista de usuarios eliminando el usuario eliminado
                setUsers(prevUsers => prevUsers.filter(user => user.id !== userId)); 
                alerts('Eliminación exitosa', 'Usuario eliminado correctamente', 'success');
            } else {
                //setSaved('error');
                alerts('Error', 'Usuario no eliminado correctamente. Ocurrió un error durante la eliminacion.', 'error')
            }

        } catch (erro) {
            alerts('Error', 'No se pudo ejecutar la consulta', 'error');
        } finally {
            //setLoading(false);
        }
    }
    return (
        <>
            <div>
                <h2>Lista de usuarios que hacen uso del sistema</h2>
                <ul>
                    {users.map((user, index) => (
                        <li key={user.id}>
                            {index + 1} {user.name} {user.lastName} - {user.role} - {user.email} - {user.createdAt}
                            {
                                user.id !== auth.id &&
                                <button onClick={() => deleteUser(user.id)} className="btn bg-danger text-white fw-bold">
                                    Eliminar usuario
                                </button>
                            }

                        </li>
                    ))}
                </ul>
            </div>
        </>
    )
}

export default UserList;
