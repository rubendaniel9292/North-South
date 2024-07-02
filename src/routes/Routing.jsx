
import { HashRouter, Route, Routes } from 'react-router-dom';
import Login from '../components/users/Login'
import PublicLayout from '../components/layout/public/PublicLayout'

const Routing = () => {
    return (
        <HashRouter>
            <Routes>
                <Route path='/' element={<PublicLayout />}>
                    <Route index element={<Login />} /></Route>
                <Route path='login' element={<Login />}>
                </Route>
            </Routes>
        </HashRouter>
    )
}

export default Routing;