import UserForm from "../../hooks/UserForm";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import { useState, useCallback } from "react";

const CreateUser = () => {
  const { form, changed } = UserForm({});
  const [isLoading, setIsLoading] = useState(false);
  const option = "Escoja una opción";
  const saveUser = useCallback(
    async (e) => {
      e.preventDefault();
      setIsLoading(true); // ✅ Iniciar estado de carga

      try {
        let newUser = form;
        const request = await http.post("users/register", newUser);

        console.log(request.data);

        if (request.data.status === "success") {
          alerts(
            "Registro exitoso",
            "Usuario registrado correctamente",
            "success"
          );
          document.querySelector("#user-form").reset();
        } else {
          alerts(
            "Error",
            "Usuario no registrado correctamente. Verificar que no haya campos vacíos ni correos o nombres de usuario repetidos.",
            "error"
          );
        }
      } catch (error) {
        alerts("Error", "Error al registrar el usuario.", "error"); // ✅ Mejorar mensaje
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false); // ✅ Finalizar estado de carga
      }
    },
    [form]
  );

  return (
    <>
      <div className="container-fluid">
        <form
          onSubmit={saveUser}
          id="user-form"
          className="needs-validation was-validated"
        >
          <div className="row mt-3 fw-bold">
           <h3>REGISTRO DE USUARIOS</h3>
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
                onChange={changed}
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
                onChange={changed}
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
                onChange={changed}
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
                onChange={changed}
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
                onChange={changed}
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
                onChange={changed}
                required
                value={form.role || ""}
              >
                {" "}
                <option disabled value={""} selected >
                  {option}
                </option>
                <option value="ADMIN">Administrador</option>
                <option value="BASIC">Básico</option>
              </select>
            </div>
            <div className="mt-4 col-6">
              <button type="submit" className="btn btn-primary">
                Submit
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};
export default CreateUser;
