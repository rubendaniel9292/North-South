/**
 * Helper para funciones compartidas entre CreatePolicy y UpdatePolicyModal
 * Maneja la lógica de filtrado de tarjetas y cuentas bancarias por cliente
 */

/**
 * Filtra tarjetas y cuentas bancarias basándose en el CI/RUC del cliente seleccionado
 * @param {string|number} selectedCustomerId - ID del cliente seleccionado
 * @param {Array} customers - Lista de todos los clientes
 * @param {Array} cards - Lista de todas las tarjetas
 * @param {Array} accounts - Lista de todas las cuentas bancarias
 * @param {Function} setFilteredCard - Setter para las tarjetas filtradas
 * @param {Function} setFilteredAccount - Setter para las cuentas filtradas
 */
export const filterCardAndAccountByCustomer = (
  selectedCustomerId,
  customers,
  cards,
  accounts,
  setFilteredCard,
  setFilteredAccount
) => {
  const selectedCustomer = customers.find(
    (customer) => String(customer.id) === String(selectedCustomerId)
  );

  if (selectedCustomer) {
    const customerCiRuc = selectedCustomer.ci_ruc;

    // Filtrar tarjetas
    if (cards && cards.length > 0) {
      const filteredCards = cards.filter(
        (card) => card.customer.ci_ruc === customerCiRuc
      );
      setFilteredCard(filteredCards);
    } else {
      setFilteredCard([]);
    }

    // Filtrar cuentas bancarias
    if (accounts && accounts.length > 0) {
      const filteredAccounts = accounts.filter(
        (account) => account.customer.ci_ruc === customerCiRuc
      );
      setFilteredAccount(filteredAccounts);
    } else {
      setFilteredAccount([]);
    }
  } else {
    // Si no se encuentra el cliente, limpiar los filtros
    setFilteredCard([]);
    setFilteredAccount([]);
  }
};

/**
 * Handler para el cambio de cliente en el select
 * @param {Event} e - Evento del input
 * @param {Array} customers - Lista de todos los clientes
 * @param {Array} cards - Lista de todas las tarjetas
 * @param {Array} accounts - Lista de todas las cuentas bancarias
 * @param {Function} setFilteredCard - Setter para las tarjetas filtradas
 * @param {Function} setFilteredAccount - Setter para las cuentas filtradas
 * @param {Function} changed - Función del hook UserForm para actualizar el estado
 */
export const handleCardAccountByEvent = (
  e,
  customers,
  cards,
  accounts,
  setFilteredCard,
  setFilteredAccount,
  changed
) => {
  const selectedCustomerId = e.target.value;
  
  filterCardAndAccountByCustomer(
    selectedCustomerId,
    customers,
    cards,
    accounts,
    setFilteredCard,
    setFilteredAccount
  );

  changed(e);
};

/**
 * Handler para filtrar por ID de cliente directamente (sin evento)
 * Útil para inicializar el filtro al cargar el componente
 * @param {string|number} customerId - ID del cliente
 * @param {Array} customers - Lista de todos los clientes
 * @param {Array} cards - Lista de todas las tarjetas
 * @param {Array} accounts - Lista de todas las cuentas bancarias
 * @param {Function} setFilteredCard - Setter para las tarjetas filtradas
 * @param {Function} setFilteredAccount - Setter para las cuentas filtradas
 */
export const handleCardAccountById = (
  customerId,
  customers,
  cards,
  accounts,
  setFilteredCard,
  setFilteredAccount
) => {
  filterCardAndAccountByCustomer(
    customerId,
    customers,
    cards,
    accounts,
    setFilteredCard,
    setFilteredAccount
  );
};

/**
 * Calcula el número de pagos según la frecuencia de pago
 * @param {number} frequencyId - ID de la frecuencia (1=Mensual, 2=Trimestral, 3=Semestral, 4=Anual)
 * @returns {number} - Número de pagos correspondiente
 */
export const getPaymentsByFrequency = (frequencyId) => {
  const frequencyMap = {
    1: 12, // Mensual
    2: 4,  // Trimestral
    3: 2,  // Semestral
    4: 1,  // Anual
  };
  return frequencyMap[Number(frequencyId)] || 12;
};

/**
 * Mapeo inverso: de número de pagos a ID de frecuencia
 * @param {number} numberOfPayments - Número de pagos
 * @returns {number} - ID de la frecuencia correspondiente
 */
export const getFrequencyIdFromPayments = (numberOfPayments) => {
  const paymentsMap = {
    12: 1, // Mensual
    4: 2,  // Trimestral
    2: 3,  // Semestral
    1: 4,  // Anual
  };
  return paymentsMap[Number(numberOfPayments)] || 1;
};

/**
 * Calcula el pago al asesor basado en los valores de la póliza
 * @param {number} policyValue - Valor de la póliza
 * @param {number} policyFee - Derecho de póliza
 * @param {number} agencyPercentage - Porcentaje de la agencia
 * @param {number} advisorPercentage - Porcentaje del asesor
 * @returns {string} - Monto del pago al asesor formateado con 2 decimales
 */
export const calculateAdvisorPayment = (
  policyValue,
  policyFee,
  agencyPercentage,
  advisorPercentage
) => {
  const numericPolicyValue = parseFloat(policyValue) || 0;
  const numericPolicyFee = parseFloat(policyFee) || 0;
  const numericAgencyPercentage = parseFloat(agencyPercentage) || 0;
  const numericAdvisorPercentage = parseFloat(advisorPercentage) || 0;

  if (
    numericPolicyValue <= 0 ||
    numericAgencyPercentage <= 0 ||
    numericAdvisorPercentage <= 0
  ) {
    return "0.00";
  }

  const baseValue = numericPolicyValue - numericPolicyFee;
  const agencyTotal = (baseValue * numericAgencyPercentage) / 100;
  const advisorTotal = (baseValue * numericAdvisorPercentage) / 100;

  return (agencyTotal - advisorTotal).toFixed(2);
};

/**
 * Añade una clase CSS a un elemento de forma segura
 * @param {string} id - ID del elemento
 * @param {string} className - Nombre de la clase a añadir
 */
export const addClassSafely = (id, className) => {
  const element = document.getElementById(id);
  if (element) element.classList.add(className);
};
