import UserForm from "../../hooks/UserForm";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
const CreateUser = () => {
    const { form, changed } = UserForm({});
     const option = "Escoja una opción";
  const saveUser = async (e) => {
    try {
      e.preventDefault();
      let newUser = form;
      /*  peticion mediante fecth
            const token = localStorage.getItem('token');
            const request = await fetch(Global.url + 'users/register', {
                method: 'POST',
                body: JSON.stringify(newUser),
                headers: {
                    'Content-Type': 'application/json',
                    'token': token
                },
            });
            
            const data = await request.json();*/
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
        //setSaved('error');
        alerts(
          "Error",
          "Usuario no registrado correctamente. Verificar que no haya campos vacíos ni correos o nombres de usuario repetidos.",
          "error"
        );
      }
    } catch (error) {
      //setError(error);
      alerts("Error", "Error fetching users.", "error");
      console.error("Error fetching users:", error);
    } finally {
      /*se utiliza para ejecutar código que debe ejecutarse independientemente 
            de si una excepción fue lanzada o no en los bloques try o catch */
      //setLoading(false);
    }
  };

  return (
    <>
      <div className="container-fluid">
        <form onSubmit={saveUser} id="user-form">
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
                defaultValue={option}
              >
                {" "}
                <option disabled>{option}</option>
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
