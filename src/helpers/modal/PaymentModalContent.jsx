// ModalContent.js
import PropTypes from "prop-types";
const PaymetnModalContent = ({ policy, onClose }) => {
  if (!policy) return console.error("Error al recibir el objeto", policy);

  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto">
        <article className="modal-content text-center">
          <div className="conten-title">
            <h3 className="h2 fw-bold">
              Póliza selecionada: {policy.numberPolicy}
            </h3>
          </div>
          <div className="d-flex justify-content-around">
            <form onSubmit={""} id="user-form">
              <div className="row">
                <div className="mb-3 col-6">
                  <label htmlFor="name" className="form-label">
                    Nombres
                  </label>
                  <input
                    required
                    type="text"
                    className="form-control"
                    id="name"
                    name="firstName"
                    onChange={""}
                  />
                </div>
                <div className="mb-3 col-6">
                  <label htmlFor="surname" className="form-label">
                    Apellidos
                  </label>
                  <input
                    required
                    type="text"
                    className="form-control"
                    id="lastname"
                    name="surname"
                    onChange={""}
                  />
                </div>
                <div className="mb-3 col-6">
                  <label htmlFor="username" className="form-label">
                    Usuario
                  </label>
                  <input
                    required
                    type="text"
                    className="form-control"
                    id="username"
                    name="userName"
                    onChange={""}
                  />
                </div>
                <div className="mb-3 col-6">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    onChange={""}
                  />
                </div>
                <div className="mb-3 col-6">
                  <label htmlFor="password" className="form-label">
                    Contraseña
                  </label>
                  <input
                    required
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    onChange={""}
                  />
                </div>
                <div className="mb-3 col-6">
                  <label htmlFor="role" className="form-label">
                    Seleccione un rol para el usuario
                  </label>
                  <select
                    className="form-select"
                    id="role"
                    name="role"
                    onChange={""}
                  >
                    {" "}
                    <option value="" selected disabled>
                      Seleccione un rol
                    </option>
                    <option value="ADMIN">Administrador</option>
                    <option value="BASIC">Básico</option>
                  </select>
                </div>
                <div className="mt-4 col-6">
                  <button
                    type="submit"
                    onClick={onClose}
                    id="btnc"
                    className="btn  my-3 text-white fw-bold"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    onClick={onClose}
                    id="btnc"
                    className="btn bg-success my-3 text-white fw-bold"
                  >
                    Registrar pago
                  </button>
                </div>
              </div>
            </form>
          </div>
        </article>
      </div>
    </>
  );
};
// Validación de propiedades con PropTypes
PaymetnModalContent.propTypes = {
  policy: PropTypes.shape({
    numberPolicy: PropTypes.string.isRequired,
    // Aquí puedes agregar otras propiedades de la póliza si las tienes
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default PaymetnModalContent;
