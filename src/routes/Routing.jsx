
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom';
import Login from '../components/users/Login'
import PublicLayout from '../components/layout/public/PublicLayout'
import PrivateLoyout from '../components/layout/private/PrivateLoyout';
import Index from '../components/dashboard/Index';
import { AuthProvider } from '../context/AuthProvider';
import UserList from '../components/users/UserList';
import CreateUser from '../components/users/CreateUser';
import Home from '../components/users/Home';

const Routing = () => {
    return (
        <HashRouter>
            <AuthProvider>
                <Routes>
                    {/*rutas publicas*/}
                    <Route path='/' element={<PublicLayout />}>
                        <Route index element={<Login />} />
                        <Route path='login' element={<Login />} />
                    </Route>
                    {/*rutas privadas que empiecen con management */}
                    <Route path='/management' element={<PrivateLoyout />}>
                        <Route index element={<Index/>} ></Route>
                        <Route path='home' element={<Home />} ></Route>
                        <Route path='create-user' element={<CreateUser />} ></Route>
                        <Route path='user-list' element={<UserList />} ></Route>
                    </Route>

                    {/* Redirección predeterminada */}
                    <Route path="*" element={<Navigate to='/' />}> </Route>
                </Routes>
            </AuthProvider>
        </HashRouter>
    )
}

export default Routing;