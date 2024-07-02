
import { Navigate, Outlet } from "react-router-dom"

const PublicLayout = () => {
    const auth = false;
    return (
        <div>
            {!auth ?
                <Outlet/> : <Navigate to='/social'/>
            }

        </div>
    )
}

export default PublicLayout
