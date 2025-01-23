import PropTypes from "prop-types";
import UserForm from "../../hooks/UserForm";
import { useEffect, useState } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "dayjs";
import "dayjs/locale/es";

const UpdateCustomerModal = ({ customerId, onClose, onCustomerUpdated }) => {
  const { form, changed } = UserForm({});
  const [isLoading, setIsLoading] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [province, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  if (!customerId) return null;
  console.log("cliente seleccionado", customerId);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusesResponse, provincesResponse, citiesResponse] =
          await Promise.all([
            http.get("globaldata/civil-status"),
            http.get("globaldata/get-provinces"),
            http.get("globaldata/get-city"),
          ]);

        const statusesData = statusesResponse.data;
        const provincesData = provincesResponse.data;
        const citiesData = citiesResponse.data;

        if (statusesData?.allStatus) {
          setStatuses(statusesData.allStatus);
        }

        if (provincesData?.allProvince) {
          setProvinces(provincesData.allProvince);
        }

        if (citiesData?.allCitys) {
          // Filtrar ciudades iniciales según provincia actual del cliente
          const initialFilteredCities = citiesData.allCitys.filter(
            (city) =>
              city.province && city.province.id === customerId.province_id
          );
          console.log("ciudad filtrada del cliente", initialFilteredCities);
          setFilteredCities(initialFilteredCities);
          setCities(citiesData.allCitys);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        alerts("Error", "Error fetching data.", "error");
      }
    };
    fetchData();
  }, []);
  // Initialize form with customerId data

  const handleProvinceChange = (event) => {
    const selectedProvinceId = event.target.value;
    const filtered = cities.filter(
      (city) => city.province && city.province.id === selectedProvinceId
    );

    setFilteredCities(filtered);
    changed(event);
  };

  const option = "Escoja una opción";
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return dayjs(dateString).locale("es").format("YYYY-MM-DD");
  };
  const savedCustomer = async (e) => {
    setIsLoading(true);
    e.preventDefault();
    try {
      let newCustomer = form;
      const request = await http.put(
        `customers/update-customer-id/${customerId.id}`,
        newCustomer
      );
      if (request.data.status === "success") {
        alerts(
          "Actualizacion exitosa",
          "Cliente actualizado correctamente",
          "success"
        );
        // Llamar a la función de callback para propagar el cambio
        onCustomerUpdated(request.data.customerUpdated);
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        alerts(
          "Error",
          "Cliente no registrado correctamente. Verificar que no haya campos vacios o duplicados",
          "error"
        );
      }
    } catch (error) {
      alerts("Error", "Error fetching users.", "error");
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto">
        <article className="modal-content text-center px-5 py-5">
          <div className="d-flex justify-content-center align-items-center conten-title rounded mb-3">
            <h3 className="text-white fw-bold">
              Cliente seleccionado: {customerId.firstName} {customerId.surname}
            </h3>
          </div>
          <div className="justify-content-around mt-1">
            <form onSubmit={savedCustomer} id="user-form">
              <div className="row pt-3 fw-bold">
                <div className="my-1 col-3">
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
                    value={form.ci_ruc || customerId.ci_ruc} // Persist input value
                  />
                </div>
                <div className="my-1 col-3">
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
                    value={form.firstName || customerId.firstName} // Persist input value
                  />
                </div>
                <div className="my-1 col-3">
                  <label htmlFor="secondName" className="form-label">
                    Segundo Nombre
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="secondname"
                    name="secondName"
                    onChange={changed}
                    value={form.secondName || customerId.secondName} // Persist input value
                  />
                </div>
                <div className="my-1 col-3">
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
                    value={form.surname || customerId.surname} // Persist input value
                  />
                </div>

                <div className="my-1 col-3">
                  <label htmlFor="secondSurname" className="form-label">
                    Segundo Apellido
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="secondsurname"
                    name="secondSurname"
                    onChange={changed}
                    value={form.secondSurname || customerId.secondSurname} // Persist input value
                  />
                </div>

                <div className="my-1 col-3">
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
                    value={form.email || customerId.email} // Persist input value
                  />
                </div>
                <div className="my-1 col-3">
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
                    value={form.numberPhone || customerId.numberPhone} // Persist input value
                  />
                </div>
                <div className="my-1 col-3 row">
                  <label htmlFor="flexRadioDefault" className="form-label">
                    Estado Civil
                  </label>
                  {statuses.map((status) => (
                    <div className="form-check col-4" key={status.id}>
                      <input
                        className="form-check-input"
                        type="radio"
                        name="status_id"
                        id={`status-${status.id}`}
                        value={status.id}
                        checked={form.status_id || customerId.status_id} // Persist radio value
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
                <div className="my-1 col-3">
                  <label htmlFor="province_id" className="form-label">
                    Provincia
                  </label>
                  <select
                    className="form-select"
                    id="province_id"
                    name="province_id"
                    onChange={handleProvinceChange}
                    value={form.province_id || customerId.province_id} // Persist select value
                  >
                    <option disabled>{option}</option>
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
                    defaultValue={form.city_id || customerId.city_id}
                    selected={form.city_id || customerId.city_id}
                    value={form.city_id || customerId.city_id} // Persist select value
                  >
                    <option disabled>{option}</option>

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
                    //value={form.birthdate || customerId.birthdate} // Persist input value
                    value={formatDate(form.birthdate || customerId.birthdate)} // Persist input value
                  />
                </div>

                <div className="my-1 col-3 ">
                  <label htmlFor="flexRadioDefault7" className="form-label">
                    ¿El cliente acetpa el tratamiendo de datos personales?
                  </label>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="personalData"
                      id="flexRadioDefault7"
                      //value="true"

                      //checked={form.personalData? form.personalData === "true": customerId.personalData === "true"} // Persist radio value
                      onChange={changed}
                      value={true}
                      checked={customerId.personalData || true}
                    ></input>
                    <label
                      className="form-check-label"
                      htmlFor="flexRadioDefault8"
                    >
                      Si
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="personalData"
                      id="flexRadioDefault8"
                      value={false}
                      onChange={changed}
                      //checked={form.personalData? form.personalData === "true": customerId.personalData === "true"} // Persist radio value
                      checked={customerId.personalData || false}
                    ></input>
                    <label
                      className="form-check-label"
                      htmlFor="flexRadioDefault8"
                    >
                      No
                    </label>
                  </div>
                </div>
                <div className="my-1 col-12">
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
                    value={form.address || customerId.address} // Persist input value
                  />
                </div>
                <div className="d-flex justify-content-around mt-4">
                  <div className="">
                    <button
                      type="submit"
                      id="btnc"
                      className="btn bg-success mx-5 text-white fw-bold "
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div
                          className="spinner-border text-light"
                          role="status"
                        >
                          <span className="visually-hidden">
                            Actualizando...
                          </span>
                        </div>
                      ) : (
                        "Actualizar datos"
                      )}
                      <FontAwesomeIcon
                        className="mx-2"
                        beat
                        icon={faFloppyDisk}
                      />
                    </button>

                    <button
                      type="submit"
                      onClick={onClose}
                      id="btnc"
                      className="btn bg-danger mx-5 text-white fw-bold"
                    >
                      Cerrar
                      <FontAwesomeIcon
                        className="mx-2"
                        beat
                        icon={faRectangleXmark}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </article>
      </div>
    </>
  );
};

UpdateCustomerModal.propTypes = {
  customerId: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ci_ruc: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    secondName: PropTypes.string,
    surname: PropTypes.string.isRequired,
    secondSurname: PropTypes.string,
    email: PropTypes.string.isRequired,
    birthdate: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    province: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      provinceName: PropTypes.string,
    }),
    city: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      cityName: PropTypes.string,
    }),
    civil: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      status: PropTypes.string,
    }),
    personalData: PropTypes.bool,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onCustomerUpdated: PropTypes.func.isRequired, // Añadir PropTypes para el nuevo prop
};

export default UpdateCustomerModal;
