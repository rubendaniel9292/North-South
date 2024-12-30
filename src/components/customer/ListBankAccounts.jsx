import { useEffect, useState, useCallback } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";

const ListBankAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  useEffect(() => {
    getAllAccounts();
  }, []);
  const getAllAccounts = useCallback(async () => {
    try {
      const response = await http.get("bankaccount/get-all-account");
      if (response.data.status === "success") {
        console.log('cuentas registradas: ', response.data)
        setAccounts(response.data.allBankAccounts); // Asume que la respuesta contiene un array de usuarios bajo la clave 'allUser'
      } else {
        alerts("Error", "No existen tarjetas registradas", "error");
        console.error("Error fetching users:", response.message);
      }
    } catch (error) {
      //setError(error);
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching users:", error);
    }
  }, []);
  return (
    <>
      <div>
        <h2>Lista de tarjetas</h2>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>N°</th>
              <th>Número de cuenta</th>
              <th>Cédula / RUC</th>
              <th>Primer Nombre</th>
              <th>Segundo Nombre</th>
              <th>Primer Apellido</th>
              <th>Primer Segundo</th>
              <th>Banco</th>
              <th>Tipo de cuenta</th>
              <th>Observaciones</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.accountNumber}</td>
                <td>{item.customer.ci_ruc}</td>
                <td>{item.customer.firstName}</td>
                <td>{item.customer.secondName}</td>
                <td>{item.customer.surname}</td>
                <td>{item.customer.secondSurname}</td>
                <td>{item.bank.bankName}</td>

                <td>{item.accountType.typeName}</td>
                <td>{item.observations || "N/A"}</td>
                <td>
                  <button
                    //onClick={() => deleteUser(user.uuid)}
                    className="btn btn-success text-white fw-bold w-100"
                  >
                    Actualziar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ListBankAccounts;
