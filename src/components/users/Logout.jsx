import { useEffect } from "react"
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const Logout = () => {
    const navigate = useNavigate();
    const { setAuth } = useAuth();
    //serrar secion con un leve retraso para que el cierre no se de manera abrupta
    useEffect(() => {
        setTimeout(() => {
            //vaciar el local storage
            localStorage.clear();
            //setear estados globales a vacioos
            setAuth({});
            //rediracion a login
            navigate('/login');
        }, 500);

    });
    return (
        <>
            <h1>Cerrando sesión</h1>
            <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </>
    )
}

export default Logout;