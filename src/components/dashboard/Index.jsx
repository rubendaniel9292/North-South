import '../../assets/css/dasboard-styles.css';
import { Link, Outlet, useLocation } from 'react-router-dom';
import useAuth from "../../hooks/useAuth";


const Index = () => {
  const { auth } = useAuth();
  const location = useLocation(); //cambia dinámicamente según la ruta sin mostrar el contenido predeterminado
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
                <Link to={'/management/home'}>
                  <button className='btnDas text-white fw-bold'>Inicio</button>
                </Link>
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
              {
                auth.role === 'ADMIN' && (
                  <div className='py-2 dropdown'>
                    <button className='dropdown-toggle btnDas text-white  fw-bold' type="button" data-bs-toggle="dropdown" aria-expanded="false">
                      Gestión de usuarios
                    </button>
                    <ul className="dropdown-menu dropdown-toggle text-center">
                      <li >
                        <Link className="dropdown-item text-white fw-bold" to={'/management/create-user'}>
                          Añadir usuario
                        </Link>
                      </li>
                      <li >
                        <Link className="dropdown-item text-white fw-bold" to={'/management/user-list'}>
                          Lista de usuarios
                        </Link>
                      </li>
                    </ul>
                  </div>

                )
              }


            </div>
            <div className="col-10 dasboard my-2 ms-2">
              {
                location.pathname === 'management' ? <Index /> : <Outlet />
              }

            </div>
          </div>
        </div>
      </section>

    </>

  )
}

export default Index
