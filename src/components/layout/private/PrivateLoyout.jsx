import { Navigate, Outlet } from "react-router-dom"
import useAuth from "../../../hooks/useAuth"
const PrivateLoyout = () => {
    /*restringir acceso a usuarios a la parte privada */
    const { auth, loading } = useAuth();

    console.log('log de auth en private loyout', auth)

    if (loading) {
        return <h1>Cargando el login...</h1>
    } else {
        return (
            <>
                <section className="">
                    {//si existe el usuario cargar mostrar outlet, y sino que navegue a la parte publica

                        auth.id ? <Outlet /> : <Navigate to='/login' />

                    }
                </section>
            </>
        )
    }
}

export default PrivateLoyout