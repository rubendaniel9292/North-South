import UserFrom from "../../hooks/UserFrom";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
const CreateCustomer = () => {
  const { form, changed } = UserFrom({});
  const [statuses, setStatuses] = useState([]);
  const [province, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);

  useEffect(() => {
    console.log("CreateCustomer component is rendering");
    const fetchStatuses = async () => {
      try {
        const response = await http.get("globaldata/civil-status");
        const data = response.data;
        console.log("estados civiles de la bd: ", data.allStatus); // Verifica la respuesta aquí
        setStatuses(data.allStatus); // Asegúrate de que data.allStatus exista y tenga datos.
      } catch (error) {
        console.error("Error fetching statuses:", error);
      }
    };

    const fetchProvinces = async () => {
      try {
        const response = await http.get("globaldata/get-provinces");
        const data = response.data;
        setProvinces(data.allProvince);
      } catch (error) {
        console.error("Error fetching provinces:", error);
        alerts("Error", "Error fetching provinces.", "error");
      }
    };

    const fetchCities = async () => {
      try {
        const response = await http.get("globaldata/get-city");
        const data = response.data;
        setCities(data.allCitys);
      } catch (error) {
        console.error("Error fetching cities:", error);
        alerts("Error", "Error fetching cities.", "error");
      }
    };
    fetchProvinces();
    fetchCities();
    fetchStatuses();
  }, []);
  const handleProvinceChange = (event) => {
    const selectedProvinceId = event.target.value;
    const filtered = cities.filter(
      (city) => city.province.id === selectedProvinceId
    );
    setFilteredCities(filtered);
    changed(event);
  };

  const savedCustomer = async (e) => {
    try {
      e.preventDefault();
      let newCustomer = form;
      const request = await http.post(
        "customers/register-customer",
        newCustomer
      );
      if (request.data.status === "success") {
        alerts(
          "Registro exitoso",
          "Cliente registrado registrado correctamente",
          "success"
        );
        document.querySelector("#user-form").reset();
      } else {
        //setSaved('error');
        alerts(
          "Error",
          "Cliente no registrado correctamente. Verificar que no haya campos vacios o duplicados",
          "error"
        );
      }
    } catch (error) {
      alerts("Error", "Error fetching users.", "error");
      console.error("Error fetching users:", error);
    }
  };

  return (
    <>
      <div className="container-fluid">
        <form onSubmit={savedCustomer} id="user-form">
          <div className="row pt-3 fw-bold">
            <div className="mb-3 col-3">
              <label htmlFor="ci_ruc" className="form-label">
                Número de cédula / RUC
              </label>
              <input
                required
                type="text"
                className="form-control"
                id="ciruc"
                name="ci_ruc"
                onChange={changed}
              />
            </div>
            <div className="mb-3 col-3">
              <label htmlFor="firtsName" className="form-label">
                Primer Nombre
              </label>
              <input
                required
                type="text"
                className="form-control"
                id="name"
                name="firstName"
                onChange={changed}
              />
            </div>
            <div className="mb-3 col-3">
              <label htmlFor="secondName" className="form-label">
                Segundo Nombre
              </label>
              <input
                type="text"
                className="form-control"
                id="secondname"
                name="secondName"
                onChange={changed}
              />
            </div>
            <div className="mb-3 col-3">
              <label htmlFor="surname" className="form-label">
                Primer Apellido
              </label>
              <input
                required
                type="text"
                className="form-control"
                id="surname"
                name="surname"
                onChange={changed}
              />
            </div>

            <div className="mb-3 col-3">
              <label htmlFor="secondSurname" className="form-label">
                Segundo Apellido
              </label>
              <input
                type="text"
                className="form-control"
                id="secondsurname"
                name="secondSurname"
                onChange={changed}
              />
            </div>

            <div className="mb-3 col-3">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                required
                type="email"
                className="form-control"
                id="email"
                name="email"
                onChange={changed}
              />
            </div>
            <div className="mb-3 col-3">
              <label htmlFor="phone" className="form-label">
                Teléfono
              </label>
              <input
                required
                type="text"
                className="form-control"
                id="phone"
                name="numberPhone"
                onChange={changed}
              />
            </div>
            <div className="mb-3 col-3 row">
              <label htmlFor="flexRadioDefault" className="form-label">
                Estado Civil
              </label>
              {statuses.map((status) => (
                <div className="form-check col-6" key={status.id}>
                  <input
                    className="form-check-input"
                    type="radio"
                    name="status_id"
                    id={`status-${status.id}`}
                    value={status.id}
                    onChange={changed}
                  />
                  <label
                    className="form-check-label"
                    htmlFor={`status-${status.id}`}
                  >
                    {status.status}
                  </label>
                </div>
              ))}
            </div>
            <div className="mb-3 col-3">
              <label htmlFor="province_id" className="form-label">
                Provincia
              </label>
              <select
                className="form-select"
                id="province_id"
                name="province_id"
                onChange={handleProvinceChange}
              >
                <option value="" selected disabled>
                  Seleccione un provincia
                </option>
                {province.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.provinceName}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3 col-3">
              <label htmlFor="city_id" className="form-label">
                Ciudad o Cantón
              </label>
              <select
                className="form-select"
                id="city_id"
                name="city_id"
                onChange={changed}
              >
                <option value="" selected disabled>
                  Seleccione una ciudad o cantón
                </option>
                {filteredCities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.cityName}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3 col-3">
              <label htmlFor="text" className="form-label">
                Fecha de nacimiento
              </label>
              <input
                required
                type="date"
                className="form-control"
                id="birthdate"
                name="birthdate"
                onChange={changed}
              />
            </div>

            <div className="mb-3 col-3">
              <label htmlFor="text" className="form-label">
                Dirección
              </label>
              <input
                required
                type="text"
                className="form-control"
                id="address"
                name="address"
                onChange={changed}
              />
            </div>
            <div className="mb-3 col-3 ">
              <label htmlFor="flexRadioDefault7" className="form-label">
                ¿El cliente acetpa el tratamiendo de datos personales?
              </label>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="personalData"
                  id="flexRadioDefault7"
                  value="true"
                  onChange={changed} // Maneja el cambio aquí
                ></input>
                <label className="form-check-label" htmlFor="flexRadioDefault8">
                  Si
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="personalData"
                  id="flexRadioDefault8"
                  value="false"
                  onChange={changed}
                ></input>
                <label className="form-check-label" htmlFor="flexRadioDefault8">
                  No
                </label>
              </div>
            </div>
            <div className="mt-4 col-3">
              <button type="submit" className="btn btn-success fw-bold">
                Registrar cliente
                <FontAwesomeIcon className="mx-2 " icon={faFloppyDisk} beat />
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateCustomer;
