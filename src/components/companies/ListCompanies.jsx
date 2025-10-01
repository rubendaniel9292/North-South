import { useEffect, useState, useCallback } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { 
  faBuilding, 
  faIndustry,
  faIdCard,
  faSearch 
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

//const { auth } = useAuth();

const ListCompanies = () => {
  const [companies, setCompanies] = useState([]);
  useEffect(() => {
    getAllCompanies();
  }, []);
  const getAllCompanies = useCallback(async () => {
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
  }, []);
  return (
    <>
      <div className="text-center py-2">
        <h2 className="py-2">
          <FontAwesomeIcon icon={faIndustry} className="me-3 text-primary" />
          Lista de compañías aseguradoras
        </h2>
        
        {/* Header con información */}
        <div className="row mb-4">
          <div className="col-md-6 mx-auto">
            <div className="card bg-info text-white">
              <div className="card-body py-2">
                <h5 className="card-title mb-1">
                  <FontAwesomeIcon icon={faBuilding} className="me-2" />
                  Total de compañías registradas
                </h5>
                <h3 className="mb-0">{companies.length}</h3>
              </div>
            </div>
          </div>
        </div>

        <table className="table table-striped py-2">
          <thead>
            <tr>
              <th>N°</th>
              <th>
                <FontAwesomeIcon icon={faBuilding} className="me-2" />
                Nombre de la compañía
              </th>
              <th>
                <FontAwesomeIcon icon={faIdCard} className="me-2" />
                RUC
              </th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center">
                  Aún no hay compañías registradas
                </td>
              </tr>
            ) : (
              companies.map((company, index) => (
                <tr key={company.id}>
                  <td>{index + 1}</td>
                  <td>
                   
                    {company.companyName}
                  </td>
                  <td>{company.ci_ruc}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ListCompanies;
