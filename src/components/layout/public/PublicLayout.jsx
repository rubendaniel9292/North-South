import useAuth from "../../../hooks/useAuth"
import { Navigate, Outlet } from "react-router-dom"

const PublicLayout = () => {
    //const auth = false;
    const {auth} = useAuth();
    return (
        <div>
            {!auth.id ?
                <Outlet/> : <Navigate to='/gestion'/>
            }

        </div>
    )
}

export default PublicLayout
