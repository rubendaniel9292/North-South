
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom';
import Login from '../components/users/Login'
import PublicLayout from '../components/layout/public/PublicLayout'
import PrivateLoyout from '../components/layout/private/PrivateLoyout';
import Index from '../components/dashboard/Index';
import { AuthProvider } from '../context/AuthProvider';

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
                    


                    {/*rutas privadas que empiecen con gestion */}
                    <Route path='/gestion' element={<PrivateLoyout />}>
                        <Route index element={<Index />} ></Route>

                    </Route>

                    {/* Redirección predeterminada */}
                    <Route path="*" element={<Navigate to='/' />}> </Route>
                </Routes>
            </AuthProvider>
        </HashRouter>
    )
}

export default Routing;