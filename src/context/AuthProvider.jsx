import { useState, useEffect, createContext } from "react";
import { Global } from "../helpers/Global";
import PropTypes from 'prop-types';
/*
se define un contexto usando createContext para compartir 
datos entre componentes sin tener que pasar props manualmente
*/
const AuthContext = createContext();


const AuthProvider = ({ children }) => {
    //estado de autenticacion
    const [auth, setAuth] = useState({});
    //estado de contadores
    //const [counters, setCounters] = useState({});
    //estado de loafing o cargando
    const [loading, setLoading] = useState(true);


    //cada vez que se use este componente o se carge la pantalla, se comprueba el token mediante useEffect
    useEffect(() => {
        //se ejecuta cada vez que se ejecuta este contexto
        authUser();

    }, []);
    //autenticar de manera asincrona al usuario

    const authUser = async () => {
        try {
            //sacar datos de usuario identificado de local storage
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');

            //comprobar si tengo el token y el user
            if (!token || !user) {
                setLoading(false);
                return false;

            }
            //transofrmar los datos a un objeto de JS.
            const userObj = JSON.parse(user);//acceder al objeto user
            const userId = userObj.id;//obtener el usuario identificado
            //peticion ajax al backend que compruebe el token y que me devuelva todos los datos de peril del usuario para tenerlos en el estado de auth
            const request = await fetch(Global.url + 'users/' + userId, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'token': token
                }
            });

            //validaciones
            if (!request.ok) {
                //verificar si el token ha caducado y manejarlo adecuadamente
                if (request.status === 401) {
                    // Manejar el caso en que el token haya expirado
                    console.warn('Token expirado');
                } else {
                    throw new Error('Error al obtener el perfil del usuario.');
                }
            }
            const data = await request.json();
            console.log('Datos del usuario:', data);
            setAuth(data);
            setLoading(false);


            //peticion para los contadores (no se usara aqui de momento)
            //setear el estado de auth
            /*
            const data = await request.json();
            
            const requestCounters = await fetch(Global.url + 'user/counters/' + userId, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                }
            });
            const dataCounters = await requestCounters.json();

            setAuth(data.user);//si se muestran los datos
            setCounters(dataCounters);
            setLoading(false);
*/
        }
        catch (error) {
            console.error('Error al autenticar al usuario:', error);
            setLoading(false);
        }

    }
    return (
        /*envoler los componentes con un proveedor de contexto 
        para obetner acceso a estos dos metodos en cualquier componente counters , setCounters,
        */
        <AuthContext.Provider value={{ auth, setAuth, loading }}>
            {children}
        </AuthContext.Provider>
    )
}
// Validación de Propiedades, se suguiere como buena practica

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
//export default AuthContext;
export { AuthContext, AuthProvider };