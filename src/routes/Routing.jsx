import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import Login from "../components/users/Login";
import PublicLayout from "../components/layout/public/PublicLayout";
import PrivateLoyout from "../components/layout/private/PrivateLoyout";
import { AuthProvider } from "../context/AuthProvider";
import UserList from "../components/users/UserList";
import CreateUser from "../components/users/CreateUser";
import Home from "../components/users/Home";
import Logout from "../components/users/Logout";
import CreateCustomer from "../components/customer/CreateCustomer";
import ListCustomer from "../components/customer/ListCustomer";
import ListCreditCard from "../components/customer/ListCreditCard";
import RegisterCreditCard from "../components/customer/RegisterCreditCard";
import CreateBank from "../components/customer/CreateBank";
import ListCompanies from "../components/companies/ListCompanies";
import CreateComapnies from "../components/companies/CreateComapnies";
import  CreateAdvisor from "../components/policies/CreateAdvisor";
import ListAdvisor from "../components/policies/ListAdvisor";
import CreatePolicy from "../components/policies/CreatePolicy";
import ListPolicies  from "../components/policies/ListPolicies";
import CreateBankAccount from "../components/customer/CreateBankAccount";
import ListBankAccounts from "../components/customer/ListBankAccounts";
import  ListPayment from "../components/policies/ListPayment";
import ListCommissions  from "../components/customer/ListCommissions";
import ManagementLOPDP from "../components/customer/ManagementLOPDP";
const Routing = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          {/*rutas publicas*/}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Login />} />
            <Route path="login" element={<Login />} />
          </Route>
          {/*rutas privadas que empiecen con management */}
          <Route path="/management" element={<PrivateLoyout />}>
            <Route index element={<Home />}></Route>
            <Route path="home" element={<Home />}></Route>
            <Route path="create-user" element={<CreateUser />}></Route>
            <Route path="user-list" element={<UserList />}></Route>
            <Route path="create-customer" element={<CreateCustomer />}></Route>
            <Route path="get-all-customer" element={<ListCustomer />}></Route>
            <Route path="create-cards" element={<RegisterCreditCard/>}></Route>
            <Route path="create-bankaccounts" element={<CreateBankAccount/>}></Route>
            <Route path="list-bankaccounts" element={<ListBankAccounts/>}></Route>
            <Route path="get-all-cards" element={<ListCreditCard/>}></Route>
            <Route path="create-bank" element={<CreateBank/>}></Route>
            <Route path="create-companies" element={<CreateComapnies/>}></Route>
            <Route path="get-all-comapanies" element={<ListCompanies/>}></Route>
            <Route path="create-advisor" element={<CreateAdvisor/>}></Route>
            <Route path="get-all-advisor" element={<ListAdvisor/>}></Route>
            <Route path="create-policy" element={<CreatePolicy/>}></Route>
            <Route path="get-all-policy" element={<ListPolicies/>}></Route>
            <Route path="get-all-payments" element={<ListPayment/>}></Route>
            <Route path="get-all-commissions" element={<ListCommissions/>}></Route>
            <Route path="management-lopdp" element={<ManagementLOPDP/>}></Route>
            {/* Ruta de cierre de sesión */}
            <Route path="logout" element={<Logout />}></Route>
          </Route>

          {/* Redirección predeterminada */}
          <Route path="*" element={<Navigate to="/" />}>
            {" "}
          </Route>
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
};

export default Routing;
