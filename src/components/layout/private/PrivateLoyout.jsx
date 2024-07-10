import { Navigate, Outlet } from "react-router-dom"
import useAuth from "../../../hooks/useAuth"
const PrivateLoyout = () => {
    /*restringir acceso a usuarios a la parte privada */
    const { auth, loading } = useAuth();

    //console.log('log de auth en private loyout', auth)

    if (loading) {
        return (
            <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>

        )

    } else {
        return (
            <>
                {//si existe el usuario cargar mostrar outlet, y sino que navegue a la parte publica
                    auth.id ? <Outlet /> : <Navigate to='/login' />
                }
            </>
        )
    }
}

export default PrivateLoyout