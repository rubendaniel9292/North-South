import { useContext } from "react";
import { AuthContext } from "../context/AuthProvider";

const useAuth = () => {
  //cargar el contexto
  return useContext(AuthContext);
};

export default useAuth;
