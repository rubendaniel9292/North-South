import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const Logout = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  //serrar secion con un leve retraso para que el cierre no se de manera abrupta
  useEffect(() => {
    const timer = setTimeout(() => {
      //vaciar el local storage
      localStorage.clear();
      //setear estados globales a vacioos
      setAuth({});
      //rediracion a login
      navigate("/login");
    }, 500);
    // Cleanup para limpiar el timeout si el componente se desmonta antes de ejecutarse
    return () => clearTimeout(timer);
  });
  return (
    <>
      <h1>Cerrando sesión</h1>
      <div className="spinner-border text-success" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </>
  );
};

export default Logout;