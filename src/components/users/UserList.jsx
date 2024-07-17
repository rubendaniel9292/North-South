//import { Global } from "../../helpers/Global";
import { useEffect, useState } from "react";
import alerts from "../../helpers/Alerts";
import http from '../../helpers/Http';
const UserList = () => {
    const [users, setUsers] = useState([]); // Almacenar la lista de usuarios en el estado
    //const [loading, setLoading] = useState(true); // Estado para mostrar que está cargando
    //const [error, setError] = useState(null); // Estado para manejar errores

    useEffect(() => {
        getAllList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            
            const request= await http.get('users/all');
           
            console.log('usuarios del sistema: ', request);

            if (request.data.status === 'success') {
                setUsers(request.data.users); // Asume que la respuesta contiene un array de usuarios bajo la clave 'allUser'
            } else {
                alerts('Error', 'No se pudo listar los usuarios.', 'error');
                console.error('Error fetching users:', request.message);
            }
        } catch (error) {
            //setError(error);
            alerts('Error', 'Error fetching users.', 'error');
            console.error('Error fetching users:', error);
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
                            {index + 1} {user.name} {user.lastname} - {user.role} - {user.email} - {user.createdAt}  <button className="btn bg-danger">Eliminar usuario</button>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    )
}

export default UserList;
