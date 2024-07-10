import '../../assets/css/dasboard-styles.css'

import useAuth from "../../hooks/useAuth";
const Index = () => {
  const { auth } = useAuth();
  // Verificar si auth es undefined antes de acceder a sus propiedades
  if (!auth) {
    // Manejar el caso donde auth es undefined, por ejemplo, mostrando un mensaje de error o tomando una acción predeterminada.
    console.error(auth, ': auth no esta definido!!!...');
    return null; // O realiza alguna acción adecuada para tu aplicación
  }
  return (
    <>
      <section>
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <nav className="navIndex d-flex align-items-center justify-content-end">
                <h2 className='text-white h5'>Bienvenid@ {auth.name} {auth.lastName} al sistema de gestión de North South</h2>
              </nav>
            </div>
          </div>
          <div className="row dasboard">
            <div className="col-2 lateral">
              <div className='py-2'>
                <button className='btnDas text-white fw-bold'>Inicio</button>
              </div>
              <div className='py-2 dropdown'>
                <button className='dropdown-toggle btnDas text-white  fw-bold' type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  Gestión de clientes
                </button>
                <ul className="dropdown-menu dropdown-toggle text-center">
                  <li><a className="dropdown-item text-white fw-bold" href="#">Accion 1</a></li>
                  <li><a className="dropdown-item text-white fw-bold" href="#">Accion 2</a></li>
                  <li><a className="dropdown-item text-white fw-bold" href="#">Accion 3</a></li>
                </ul>
              </div>

              <div className='py-2 dropdown'>
                <button className='dropdown-toggle btnDas text-white  fw-bold' type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  Gestión de usuarios
                </button>
                <ul className="dropdown-menu dropdown-toggle text-center">
                  <li><a className="dropdown-item text-white fw-bold" href="#">Añadir usuario</a></li>
                  <li><a className="dropdown-item text-white fw-bold" href="#">Listado de usuarios</a></li>                 
                </ul>
              </div>
            </div>
            <div className="col-10 dasboard">
              <h2>Listado de todos los clietes se mostrara aqui</h2>
            </div>

          </div>
        </div>

      </section>

    </>

  )
}

export default Index
