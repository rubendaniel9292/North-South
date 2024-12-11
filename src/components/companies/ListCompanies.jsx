import { useEffect, useState } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";

//const { auth } = useAuth();

const ListCompanies = () => {
  const [companies, setCompanies] = useState([]);
  useEffect(() => {
    getAllCompanies();
  }, []);
  const getAllCompanies = async () => {
    try {
      const response = await http.get("company/get-all-company");
      if (response.data.status === "success") {
        setCompanies(response.data.allCompanies); // Asume que la respuesta contiene un array de usuarios bajo la clave 'allUser'
      } else {
        alerts("Error", "No existen tarjetas compañías registradas", "error");
        console.error("Error fetching companies:", response.message);
      }
    } catch (error) {
      //setError(error);
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching users:", error);
    }
  };
  return (
    <>
      <div>
        <h2>Lista de compañias aseguradoras</h2>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>N°</th>
              <th>Nombre de la compañía</th>
              <th>RUC</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company, index) => (
              <tr key={company.id}>
                <td>{index + 1}</td>
                <td>{company.companyName}</td>
                <td>{company.ci_ruc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ListCompanies;
