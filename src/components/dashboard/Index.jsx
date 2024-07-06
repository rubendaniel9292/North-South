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
        <h2>Bienvenido/a {auth.name} {auth.lastName} al sistema de gestión de North South</h2>
      </section>

    </>

  )
}

export default Index
