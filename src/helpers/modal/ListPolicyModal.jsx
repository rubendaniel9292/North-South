import PropTypes from "prop-types";
import dayjs from "dayjs";
import http from "../../helpers/Http";
import "dayjs/locale/es";

import { useState, useMemo } from "react";
import { pdf } from "@react-pdf/renderer";
import PolicyPDFDocument from "../PolicyPDFDocument";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFloppyDisk,
  faCircleCheck,
  faRectangleXmark,
  faFile,
  faBarcode,
  faUser,
  faBuilding,
  faFileContract,
  faCalendarAlt,
  faCreditCard,
  faUniversity,
  faSync,
  faPercent,
  faShield,
  faDollarSign,
  faCheckCircle,
  faMoneyBillWave,
  faHashtag,
  faBalanceScale,
  faPlus,
  faMinus
} from "@fortawesome/free-solid-svg-icons";
import usePagination from "../../hooks/usePagination";
import alerts from "../../helpers/Alerts";
import useAuth from "../../hooks/useAuth";
const ListPolicyModal = ({ policy, onClose, onPolicyUpdated }) => {
  const [reportLoading, setReportLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState({});
  const [advancedPaymentLoading, setAdvancedPaymentLoading] = useState(false);
  const [localPolicy, setLocalPolicy] = useState(policy);
  const { auth } = useAuth();
  if (!localPolicy) return null;
  const itemsPerPage = 5; // Número de items por página

  // Método para generar reporte PDF con @react-pdf/renderer
  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setReportLoading(true);

    try {
      console.log("Generando PDF con datos de póliza:", localPolicy);

      // Generar el documento PDF
      const blob = await pdf(<PolicyPDFDocument policy={localPolicy} />).toBlob();

      // Crear un enlace de descarga
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `poliza-${localPolicy.numberPolicy}-${dayjs().format("YYYY-MM-DD")}.pdf`;

      // Simular clic para descargar
      document.body.appendChild(link);
      link.click();

      // Limpiar
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alerts("Éxito", "Reporte PDF generado correctamente", "success");
    } catch (error) {
      console.error("Error generando PDF:", error);
      alerts("Error", "No se pudo generar el reporte PDF", "error");
    } finally {
      setReportLoading(false);
    }
  };

  // Usar el hook personalizado para la paginación de pagos
  const {
    currentPage: currentPaymentsPage,
    currentItems: currentPayments,
    totalPages: totalPaymentsPages,
    paginate: paginatePayments,
  } = usePagination(localPolicy.payments, itemsPerPage);

  // Usar el hook personalizado para la paginación de renovaciones
  const {
    currentPage: currentRenewalsPage,
    currentItems: currentRenewals,
    totalPages: totalRenewalsPages,
    paginate: paginateRenewals,
  } = usePagination(localPolicy.renewals || [], itemsPerPage);

  // Función para determinar si un botón de pago debe estar habilitado
  const isPaymentButtonEnabled = (currentPayment, allPayments) => {
    // ✅ Cambiar === por == para comparación flexible
    if (currentPayment.paymentStatus.id == 2) return false;

    // Si está cargando, deshabilitado
    if (paymentLoading[currentPayment.id]) return false;

    // Ordenar pagos por número para verificar secuencia
    const sortedPayments = [...allPayments].sort(
      (a, b) => a.number_payment - b.number_payment
    );

    // Encontrar el primer pago que NO esté al día
    const firstPendingPayment = sortedPayments.find(
      (payment) => payment.paymentStatus.id != 2 // ✅ Cambiar !== por !=
    );

    // Solo habilitar si es el primer pago pendiente
    return firstPendingPayment && firstPendingPayment.id === currentPayment.id;
  };

  //metodo de para actualzar pagos
  const updatePaymentStatus = async (payment) => {
    setPaymentLoading((prev) => ({ ...prev, [payment.id]: true }));
    try {
      //e.preventDefault();
      // Solo actualizamos el estado del pago a "al día" y la fecha de actualización
      // será automática en el servidor
      const updatedPayment = {
        status_payment_id: 2, // ID que corresponde a "al día"
        policy_id: policy.id,
        credit: Number(payment.value), // El abono será igual al valor total
        balance: 0, // El saldo pendiente debe quedar en 0
        total: Number(payment.value), // El total será igual al valor original del pago
      };

      const response = await http.put(
        `payment/update-payment/${payment.id}`,
        updatedPayment
      );

      if (response.data.status === "success") {
        // Llamar después de actualizar exitosamente
        // Actualizar el estado local del pago
        const updatedPayments = localPolicy.payments.map((p) => {
          if (p.id === payment.id) {
            return {
              ...p,
              paymentStatus: {
                id: 2,
                statusNamePayment: "Al día",
              },
              credit: payment.value, // El abono será igual al valor del pago
              balance: "0.00", // El saldo queda en 0 porque ya está pagado
              // ✅ CORREGIR: NO cambiar pending_value, mantener el valor original
              // pending_value: "0.00", // ❌ ELIMINAR esta línea
              total: String(payment.value), // ✅ ASEGURAR: Mantener como string para consistencia
              updatedAt: new Date().toISOString(),
            };
          }
          return p;
        });

        setTimeout(() => {
          // Actualizar el estado local de la póliza con los pagos actualizados
          const updatedPolicy = {
            ...localPolicy,
            payments: updatedPayments,
          };

          setLocalPolicy(updatedPolicy);

          // ✅ Notificar al componente padre para actualizar el botón de renovación
          if (onPolicyUpdated) {
            onPolicyUpdated(updatedPolicy);
          }

          alerts(
            "Actualización exitosa",
            "Pago actualizado correctamente",
            "success"
          );
        }, 100); // ✅ REDUCIR: Tiempo mínimo para evitar problemas de renderizado

        if (
          payment.pending_value <= 0 &&
          payment.number_payment >= policy.numberOfPayments
        ) {
          alerts(
            "Pagos Completados",
            "Todos los pagos para este periodo han sido completados.",
            "info"
          );
        }
      } else {
        alerts(
          "Error",
          "Pago no actualizado correctamente. Verificar que no haya campos vacíos o datos incorrectos",
          "error"
        );
      }
    } catch (error) {
      alerts("Error", "Error actualizando el pago.", "error");
      console.error("Error actualizando el pago:", error);
    } finally {
      setPaymentLoading((prev) => ({ ...prev, [payment.id]: false }));
    }
  };

  // Función para registrar pago adelantado
  const handleRegisterAdvancedPayment = async () => {
    setAdvancedPaymentLoading(true);
    try {
      // Obtener el último pago registrado (mayor number_payment)
      const lastPayment = localPolicy.payments.reduce((max, p) =>
        p.number_payment > max.number_payment ? p : max,
        localPolicy.payments[0]
      );

      // ✅ VALIDACIÓN FRONTEND: Verificar si el ciclo está completo
      if (lastPayment.pending_value <= 0) {
        alerts(
          "Ciclo completado",
          `No se puede crear pago adelantado. El ciclo actual ya está completo (saldo pendiente = ${lastPayment.pending_value}). Debe renovar la póliza primero.`,
          "warning"
        );
        return;
      }

      // Calcular la fecha del nuevo pago según la frecuencia
      //const lastDate = new Date(lastPayment.createdAt);
      const lastDate = dayjs(lastPayment.createdAt);
      //let nextPaymentDate = new Date(lastDate);

      // ✅ Usar ID en lugar de nombre para mayor confiabilidad
      const frequencyId = Number(localPolicy.paymentFrequency?.id);

      // ✅ CORRECTO: Usar dayjs para sumar 1 mes correctamente


      let nextPaymentDate;

      switch (frequencyId) {
        case 1: // Mensual
          nextPaymentDate = lastDate.add(1, 'month');
          break;
        case 2: // Trimestral
          nextPaymentDate = lastDate.add(3, 'month');
          break;
        case 3: // Semestral
          nextPaymentDate = lastDate.add(6, 'month');
          break;
        case 4: // Anual
          nextPaymentDate = lastDate.add(1, 'year');
          break;
      }


      // ✅ Fecha actual para las observaciones
      const today = new Date();
      const todayFormatted = dayjs(today).format('DD/MM/YYYY');
      const nextPaymentFormatted = dayjs(nextPaymentDate).format('DD/MM/YYYY');
      // Calcular el nuevo pending_value correctamente
      const newPendingValue = Math.max(0, lastPayment.pending_value - lastPayment.value);

      // Crear el nuevo pago adelantado
      const newPaymentData = {
        policy_id: Number(localPolicy.id),
        number_payment: lastPayment.number_payment + 1,
        value: parseFloat(lastPayment.value),
        pending_value: newPendingValue, // ✅ CORREGIDO: Se reduce
        credit: "0.00",
        balance: parseFloat(lastPayment.value),
        total: "0.00", // ✅ CORREGIDO: Debe ser 0 si no hay abonos
        status_payment_id: 1, // Pendiente
        year: nextPaymentDate.year(),
        createdAt: nextPaymentDate.toISOString(), // ✅ Fecha tentativa de cobro
        observations: `Pago adelantado generado el ${todayFormatted}`, // ✅ Fecha de HOY
      };

      console.log("📤 Enviando pago adelantado:", newPaymentData);
      console.log(`   - Fecha de cobro (createdAt): ${nextPaymentFormatted}`);
      console.log(`   - Fecha de registro (observations): ${todayFormatted}`);

      const response = await http.post('payment/create-advance-payment', newPaymentData);

      if (response.data.status === "success") {
        // Agregar el nuevo pago al estado local
        const newPayment = {
          id: response.data.data,
          ...newPaymentData,
          createdAt: nextPaymentDate.toISOString(), // ✅ Fecha calculada del próximo pago
          updatedAt: today.toISOString(), // ✅ Fecha de HOY (cuando se creó)
          paymentStatus: {
            id: 1,
            statusNamePayment: "ATRASADO"
          }
        };

        const updatedPolicy = {
          ...localPolicy,
          payments: [newPayment, ...localPolicy.payments]
        };

        setLocalPolicy(updatedPolicy);

        // ✅ Notificar al componente padre
        if (onPolicyUpdated) {
          onPolicyUpdated(updatedPolicy);
        }

        setTimeout(() => {
          alerts(
            "Pago adelantado registrado",
            `Se ha creado el pago #${newPayment.number_payment} con fecha de pago fija: ${dayjs(nextPaymentDate).format('DD/MM/YYYY')}`,
            "success"
          );
        }, 500);


      } else {
        alerts(
          "Error",
          "No se pudo registrar el pago adelantado",
          "error"
        );
      }
    } catch (error) {
      console.error("Error registrando pago adelantado:", error);

      // ✅ Extraer mensaje del backend
      const errorMessage = error.response?.data?.message || error.message;

      // ✅ Verificar si es el error de ciclo completo
      if (errorMessage.includes("pending_value") && errorMessage.includes("0")) {
        alerts(
          "Ciclo completado",
          errorMessage,
          "warning"
        );
      } else {
        alerts(
          "Error",
          "Error al registrar el pago adelantado. " + errorMessage,
          "error"
        );
      }
    } finally {
      setAdvancedPaymentLoading(false);
    }
  };

  // Badge Bootstrap helper
  const Badge = ({ text, color = "secondary" }) => (
    <span className={`badge rounded-pill fw-bold fs-6 bg-${color} fw-semibold`}>
      {text}
    </span>
  );
  // Función para obtener la fecha del próximo pago pendiente
  const getNextPaymentDate = (policy) => {
    // Encuentra el último pago realizado
    const lastPayment = policy.payments?.length
      ? policy.payments.reduce((latest, p) => {
        const date = new Date(p.createdAt);
        return date > new Date(latest.createdAt) ? p : latest;
      }, policy.payments[0])
      : null;

    if (!lastPayment) return "Sin pagos registrados";

    const lastDate = new Date(lastPayment.createdAt);

    // ✅ Suma el intervalo según la frecuencia (usando ID)
    const frequencyId = Number(policy.paymentFrequency?.id);

    switch (frequencyId) {
      case 1: // Mensual
        lastDate.setMonth(lastDate.getMonth() + 1);
        break;
      case 2: // Trimestral
        lastDate.setMonth(lastDate.getMonth() + 3);
        break;
      case 3: // Semestral
        lastDate.setMonth(lastDate.getMonth() + 6);
        break;
      case 4: // Anual
        lastDate.setFullYear(lastDate.getFullYear() + 1);
        break;
      default: // Por defecto mensual
        lastDate.setMonth(lastDate.getMonth() + 1);
    }

    return lastDate.toLocaleDateString();
  };

  // obtener último periodo registrado (por año mayor):

  /*const lastPeriod = useMemo(
    () => policy.periods.reduce((a, b) => (a.year > b.year ? a : b)),
    [policy.periods]
  );
*/
  
  const lastPeriod = useMemo(() => {
    if (!policy.periods || policy.periods.length === 0) {
      return null;
    }
    return policy.periods.reduce((a, b) => (a.year > b.year ? a : b));
  }, [policy.periods]);

  console.log("lastPeriod:", lastPeriod);
  // Memoizar cálculos de comisiones
  const agencyCommission = useMemo(() => {
    const baseValue = lastPeriod.policyValue - lastPeriod.policyFee;
    const agencyTotal = (baseValue * lastPeriod.agencyPercentage) / 100;
    const advisorTotal = (baseValue * lastPeriod.advisorPercentage) / 100;
    return (agencyTotal - advisorTotal).toFixed(2);
  }, [lastPeriod.policyValue, lastPeriod.policyFee, lastPeriod.agencyPercentage, lastPeriod.advisorPercentage]);

  const advisorCommission = useMemo(() => {
    const baseValue = lastPeriod.policyValue - lastPeriod.policyFee;
    return ((baseValue * lastPeriod.advisorPercentage) / 100).toFixed(2);
  }, [lastPeriod.policyValue, lastPeriod.policyFee, lastPeriod.advisorPercentage]);

  //console.log("periods:", policy.periods);
  //console.log("lastPeriod:", lastPeriod);
  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto ">
        <article className="modal-content text-center px-5 py-4">
          <div className="d-flex justify-content-center align-items-center conten-title mb-3 rounded">
            <h3 className="text-white">
              <FontAwesomeIcon icon={faFileContract} className="me-2" />
              Información completa de la póliza {policy.numberPolicy}
            </h3>
          </div>

          <div className="mb-3">
            <p className="fs-5 fw-semibold">
              <FontAwesomeIcon icon={faUser} className="me-2" />
              Asesor: {policy.advisor.firstName} {policy.advisor.secondName ? policy.advisor.secondName + ' ' : ''}{policy.advisor.surname} {policy.advisor.secondSurname || ''}
            </p>
          </div>

          <table className="table table-striped">
            <thead>
              <tr>
                <th>
                  <FontAwesomeIcon icon={faBarcode} className="me-2" />
                  Número de Póliza
                </th>
                <th colSpan={2}>
                  <FontAwesomeIcon icon={faUser} className="me-2" />
                  Cliente
                </th>
                <th>
                  <FontAwesomeIcon icon={faBuilding} className="me-2" />
                  Compañía
                </th>
                <th>
                  <FontAwesomeIcon icon={faFileContract} className="me-2" />
                  Tipo de Póliza
                </th>
                <th>
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  Fecha de Inicio
                </th>
                <th>
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  Fecha de Fin
                </th>
                <th>
                  <FontAwesomeIcon icon={faCreditCard} className="me-2" />
                  Método de Pago
                </th>
                <th>
                  <FontAwesomeIcon icon={faUniversity} className="me-2" />
                  Banco (si aplica)
                </th>
                <th>
                  <FontAwesomeIcon icon={faSync} className="me-2" />
                  Frecuencia de Pago
                </th>
                <th>
                  <FontAwesomeIcon icon={faPercent} className="me-2" />
                  Comisión por renovación
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{policy.numberPolicy}</td>
                <td colSpan={2}>
                  {policy.customer.firstName} {policy.customer.secondName}{" "}
                  {policy.customer.surname} {policy.customer.secondSurname}
                </td>
                <td>{policy.company.companyName}</td>
                <td>{policy.policyType.policyName}</td>
                <td>{dayjs.utc(policy.startDate).format("DD-MM-YYYY")}</td>
                <td>{dayjs.utc(policy.endDate).format("DD-MM-YYYY")}</td>
                <td>{policy.paymentMethod.methodName}</td>
                <td>
                  {policy.bankAccount && policy.bankAccount.bank
                    ? policy.bankAccount.bank.bankName
                    : policy.creditCard && policy.creditCard.bank
                      ? policy.creditCard.bank.bankName
                      : "NO APLICA"}
                </td>
                <td>{policy.paymentFrequency.frequencyName}</td>
                <td>
                  <Badge
                    className=""
                    text={policy.renewalCommission === true ? "SI" : "NO"}
                    color={
                      policy.renewalCommission === true ? "dark" : "danger"
                    }
                  />
                </td>
              </tr>
            </tbody>

            <thead>
              <tr>
                <th>
                  <FontAwesomeIcon icon={faSync} className="me-2" />
                  Frecuencia de Comisiones
                </th>
                <th>
                  <FontAwesomeIcon icon={faShield} className="me-2" />
                  Monto de Cobertura
                </th>
                <th>
                  <FontAwesomeIcon icon={faPercent} className="me-2" />
                  Porcentaje de la Agencia
                </th>
                <th>
                  <FontAwesomeIcon icon={faPercent} className="me-2" />
                  Porcentaje del Asesor
                </th>
                <th>
                  <FontAwesomeIcon icon={faDollarSign} className="me-2" />
                  Valor de la Póliza
                </th>
                <th>
                  <FontAwesomeIcon icon={faHashtag} className="me-2" />
                  Número de Pagos
                </th>
                <th>
                  <FontAwesomeIcon icon={faDollarSign} className="me-2" />
                  Derecho de Póliza
                </th>
                <th>
                  <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                  Comisiones de la agencia
                </th>
                <th>
                  <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                  Comisiones del asesor
                </th>
                <th>
                  <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                  Estado
                </th>
                <th colSpan="2" scope="row">
                  <FontAwesomeIcon icon={faFile} className="me-2" />
                  Observaciones
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <Badge
                    className="fw-bold fs-6"
                    text={
                      policy.isCommissionAnnualized === false
                        ? "Normal"
                        : "Anualizada"
                    }
                    color={
                      policy.isCommissionAnnualized === false
                        ? "info"
                        : "secondary"
                    }
                  />
                </td>
                <td>{policy.coverageAmount}</td>
                {/* Asegurarse de que los porcentajes sean cadenas o números 
                <td>{policy.agencyPercentage}</td>
                <td>{policy.advisorPercentage}</td>
                <td>{policy.policyValue}</td>
                <td>{policy.numberOfPayments}</td>
                <td>{policy.policyFee || "NO APLICA"}</td>
                <td>{policy.paymentsToAgency}</td>
                <td>{policy.paymentsToAdvisor}</td>*/}
                <td>{lastPeriod.agencyPercentage}</td>
                <td>{lastPeriod.advisorPercentage}</td>
                <td>{lastPeriod.policyValue}</td>
                <td>{policy.numberOfPayments}</td>
                <td>{lastPeriod.policyFee}</td>

                <td>{agencyCommission}</td>
                <td>{advisorCommission}</td>
                <td>
                  <span
                    className={`badge fw-bold fs-6 ${policy.policyStatus?.id == 1
                      ? "bg-success" // Activa - Verde
                      : policy.policyStatus?.id == 2
                        ? "bg-danger" // Cancelada - Rojo
                        : policy.policyStatus?.id == 3
                          ? "bg-secondary" // Culminada - Gris
                          : policy.policyStatus?.id == 4
                            ? "bg-warning text-dark" // Por Culminar - Amarillo
                            : "bg-light text-dark" // Default - Claro
                      }`}
                  >
                    {policy.policyStatus.statusName}
                  </span>
                </td>

                <td colSpan="2" scope="row">
                  {policy.observations || "N/A"}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="d-flex justify-content-between align-items-center conten-title rounded mb-2 mt-2 px-3">
            <h3 className="text-white">
              <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
              Historial de pagos:
            </h3>

            <div className="d-flex align-items-center gap-3">
              <span className="badge fs-5">
                <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                Próxima fecha tentativa de cobro: {getNextPaymentDate(policy)}
              </span>

              {auth?.role !== "ELOPDP" && (
                <button
                  type="button"
                  onClick={handleRegisterAdvancedPayment}
                  disabled={advancedPaymentLoading}
                  className="btn btn-warning fw-bold text-dark"
                >
                  {advancedPaymentLoading ? (
                    <>
                      <div
                        className="spinner-border spinner-border-sm text-dark me-2"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" beat />
                      REGISTRAR PAGO ADELANTADO
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          <table className="table table-striped">
            <thead>
              <tr>
                {/*<th>Orden</th>*/}
                <th>
                  <FontAwesomeIcon icon={faHashtag} className="me-2" />
                  N° de Pago
                </th>
                <th>
                  <FontAwesomeIcon icon={faBalanceScale} className="me-2" />
                  Saldo Pendiente
                </th>
                <th>
                  <FontAwesomeIcon icon={faDollarSign} className="me-2" />
                  Valor
                </th>
                <th>
                  <FontAwesomeIcon icon={faPlus} className="me-2" />
                  Abono
                </th>
                <th>
                  <FontAwesomeIcon icon={faMinus} className="me-2" />
                  Saldo
                </th>
                <th>
                  <FontAwesomeIcon icon={faDollarSign} className="me-2" />
                  Total
                </th>
                <th>
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  Fecha de pago fija
                </th>
                <th>
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  Fecha de actualizacion
                </th>
                <th>
                  <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                  Estado
                </th>
                <th>
                  <FontAwesomeIcon icon={faFile} className="me-2" />
                  Observaciones
                </th>
                <th>
                  <FontAwesomeIcon icon={faFloppyDisk} className="me-2" />
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {currentPayments
                //slice(0, policy.numberOfPayments) // Mostrar solo los pagos permitidos
                .map((payment) => {
                  // Busca el periodo por año, si payment.year existe
                  const period = policy.periods.find(
                    (p) => p.year === payment.year
                  );
                  return (
                    <tr key={payment.id}>
                      {/*
                    <td>
                      {(currentPaymentsPage - 1) * itemsPerPage + index + 1}
                    </td>*/}
                      <td>{payment.number_payment}</td>
                      <td>{payment.pending_value}</td>
                      <td>{payment.value || "0.00"}</td>
                      <td>{payment.credit || "0.00"}</td>
                      <td>{payment.balance || "0.00"}</td>
                      <td>{payment.total}</td>
                      <td>
                        {dayjs.utc(payment.createdAt).format("DD/MM/YYYY")}
                      </td>

                      {payment.paymentStatus.id == 1 ? (
                        <td>{""}</td>
                      ) : (
                        <td>
                          {dayjs.utc(payment.updatedAt).format("DD/MM/YYYY")}
                        </td>
                      )}

                      <td>
                        <span
                          className={`badge fw-bold fs-6 ${payment.paymentStatus.id == 1
                            ? "bg-warning text-dark" // Pendiente - Amarillo
                            : payment.paymentStatus.id == 2
                              ? "bg-success" // Al día - Verde
                              : "bg-light text-dark" // Default - Claro
                            }`}
                        >
                          {payment.paymentStatus.statusNamePayment}
                        </span>
                      </td>

                      <td>{payment.observations || "N/A"}</td>
                      <td>
                        <button
                          type="button"
                          disabled={
                            !isPaymentButtonEnabled(
                              payment,
                              localPolicy.payments
                            )
                          }
                          className={`btn ${payment.paymentStatus.id == 2
                            ? "bg-secondary"
                            : isPaymentButtonEnabled(
                              payment,
                              localPolicy.payments
                            )
                              ? "bg-success"
                              : "bg-secondary" // Deshabilitado si no es el siguiente en la secuencia
                            } fw-bold text-white w-100`}
                          onClick={() => updatePaymentStatus(payment)}
                        >
                          {paymentLoading[payment.id] ? (
                            <>
                              <div
                                className="spinner-border spinner-border-sm text-light me-2"
                                role="status"
                              >
                                <span className="visually-hidden">
                                  Loading...
                                </span>
                              </div>
                              <span>Actualizando...</span>
                            </>
                          ) : payment.paymentStatus.id == 2 ? (
                            "Pago al día"
                          ) : isPaymentButtonEnabled(
                            payment,
                            localPolicy.payments
                          ) ? (
                            "Actualizar Pago"
                          ) : (
                            "Pendiente de orden" // Texto para botones deshabilitados
                          )}
                          {payment.paymentStatus.id == 2 ? (
                            <FontAwesomeIcon
                              className="mx-2"
                              icon={faCircleCheck}
                            />
                          ) : isPaymentButtonEnabled(
                            payment,
                            localPolicy.payments
                          ) ? (
                            <FontAwesomeIcon
                              className="mx-2"
                              icon={faFloppyDisk}
                              beat
                            />
                          ) : (
                            <FontAwesomeIcon
                              className="mx-2"
                              icon={faFloppyDisk}
                            />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          {totalPaymentsPages > 1 && (
            <nav aria-label="Page navigation example">
              <ul className="pagination">
                <li
                  className={`page-item${currentPaymentsPage === 1 ? " disabled" : ""
                    }`}
                >
                  <button
                    className="page-link"
                    onClick={() => paginatePayments(currentPaymentsPage - 1)}
                  >
                    Anterior
                  </button>
                </li>
                {Array.from(
                  { length: totalPaymentsPages },
                  (_, i) => i + 1
                ).map((number) => (
                  <li
                    key={number}
                    className={`page-item${currentPaymentsPage === number ? " active" : ""
                      }`}
                  >
                    <button
                      onClick={() => paginatePayments(number)}
                      className="page-link"
                    >
                      {number}
                    </button>
                  </li>
                ))}
                <li
                  className={`page-item${currentPaymentsPage === totalPaymentsPages
                    ? " disabled"
                    : ""
                    }`}
                >
                  <button
                    className="page-link"
                    onClick={() => paginatePayments(currentPaymentsPage + 1)}
                  >
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
          )}
          <div className="d-flex justify-content-center align-items-center conten-title rounded mb-2 mt-2">
            <h3 className="text-white">
              <FontAwesomeIcon icon={faSync} className="me-2" />
              Historial de renovaciones
            </h3>
          </div>

          <table className="table table-striped">
            <thead>
              <tr className="table-header">
                <th>
                  <FontAwesomeIcon icon={faHashtag} className="me-2" />
                  Numero de renovacion
                </th>
                <th>
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  Fecha de renovacion
                </th>
                <th>
                  <FontAwesomeIcon icon={faFile} className="me-2" />
                  Observaciones
                </th>
              </tr>
            </thead>
            {currentRenewals.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan="3" className="text-center">
                    Aún no se han registrado renovaciones
                  </td>
                </tr>
              </tbody>
            ) : (
              <>
                <tbody>
                  {currentRenewals.map((renewal, index) => (
                    <tr key={renewal.id}>
                      {/*
                         <td>
                        {(currentRenewalsPage - 1) * itemsPerPage + index + 1}
                      </td>
                      */}

                      <td>{renewal.renewalNumber}</td>
                      <td>
                        {dayjs.utc(renewal.createdAt).format("DD/MM/YYYY")}
                      </td>
                      <td>{renewal.observations || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </table>
          {totalRenewalsPages > 1 && (
            <nav aria-label="Page navigation example">
              <ul className="pagination">
                <li
                  className={`page-item${currentRenewalsPage === 1 ? " disabled" : ""
                    }`}
                >
                  <button
                    className="page-link"
                    onClick={() => paginateRenewals(currentRenewalsPage - 1)}
                  >
                    Anterior
                  </button>
                </li>
                {Array.from(
                  { length: totalRenewalsPages },
                  (_, i) => i + 1
                ).map((number) => (
                  <li
                    key={number}
                    className={`page-item${currentRenewalsPage === number ? " active" : ""
                      }`}
                  >
                    <button
                      onClick={() => paginateRenewals(number)}
                      className="page-link"
                    >
                      {number}
                    </button>
                  </li>
                ))}
                <li
                  className={`page-item${currentRenewalsPage === totalRenewalsPages
                    ? " disabled"
                    : ""
                    }`}
                >
                  <button
                    className="page-link"
                    onClick={() => paginateRenewals(currentRenewalsPage + 1)}
                  >
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
          )}

          <div className="d-flex justify-content-around mt-1">
            {auth?.role !== "ELOPDP" && (
              <>
                <button
                  type="submit"
                  onClick={handleGenerateReport}
                  id="btnc"
                  className="btn bg-success mx-5 text-white fw-bold "
                  disabled={reportLoading}
                >
                  {reportLoading ? (
                    <>
                      <div
                        className="spinner-border spinner-border-sm text-light me-2"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span>Generando...</span>
                    </>
                  ) : (
                    "Generar reporte PDF"
                  )}
                  <FontAwesomeIcon className="mx-2" beat icon={faFile} />
                </button>
              </>
            )}

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
        </article>
      </div>
    </>
  );
};

ListPolicyModal.propTypes = {
  policy: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Hacer opcional y permitir string o number
    numberPolicy: PropTypes.string.isRequired,
    coverageAmount: PropTypes.string.isRequired,
    agencyPercentage: PropTypes.string.isRequired,
    advisorPercentage: PropTypes.string,
    policyValue: PropTypes.string.isRequired,
    numberOfPayments: PropTypes.number.isRequired,
    startDate: PropTypes.string.isRequired, // o PropTypes.instanceOf(Date) si es un objeto Date
    endDate: PropTypes.string.isRequired,
    paymentsToAdvisor: PropTypes.string.isRequired,
    paymentsToAgency: PropTypes.string.isRequired,
    policyFee: PropTypes.string,
    observations: PropTypes.string,
    renewalCommission: PropTypes.bool.isRequired,
    isCommissionAnnualized: PropTypes.bool.isRequired,

    policyType: PropTypes.shape({
      policyName: PropTypes.string.isRequired,
    }).isRequired,

    customer: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Hacer opcional y permitir string o number
      ci_ruc: PropTypes.string.isRequired,
      firstName: PropTypes.string.isRequired,
      secondName: PropTypes.string,
      surname: PropTypes.string.isRequired,
      secondSurname: PropTypes.string,
    }).isRequired,

    company: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Hacer opcional y permitir string o number
      companyName: PropTypes.string.isRequired,
    }).isRequired,

    advisor: PropTypes.shape({
      firstName: PropTypes.string.isRequired,
      secondName: PropTypes.string,
      surname: PropTypes.string.isRequired,
      secondSurname: PropTypes.string,
    }).isRequired,

    paymentMethod: PropTypes.shape({
      methodName: PropTypes.string.isRequired,
    }).isRequired,

    bankAccount: PropTypes.shape({
      bank_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Hacer opcional y permitir string o number
      bank: PropTypes.shape({
        bankName: PropTypes.string.isRequired,
      }).isRequired,
    }),

    creditCard: PropTypes.shape({
      bank_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Hacer opcional y permitir string o number
      bank: PropTypes.shape({
        bankName: PropTypes.string.isRequired,
      }).isRequired,
    }),

    policyStatus: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Hacer opcional y permitir string o number
      statusName: PropTypes.string.isRequired,
    }).isRequired,

    paymentFrequency: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Hacer opcional y permitir string o number
      frequencyName: PropTypes.string.isRequired,
    }).isRequired,

    payments: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired, // Hacer opcional y permitir string o number
        pending_value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired,
        number_payment: PropTypes.number.isRequired,
        value: PropTypes.string.isRequired,
        credit: PropTypes.string.isRequired,
        balance: PropTypes.string.isRequired,
        total: PropTypes.string.isRequired,
        observations: PropTypes.string,
        createdAt: PropTypes.string.isRequired,
        status_payment_id: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.number,
        ]).isRequired, // Hacer opcional y permitir string o number
        paymentStatus: PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired, // Hacer opcional y permitir string o number
          statusNamePayment: PropTypes.string.isRequired,
        }).isRequired,
        updatedAt: PropTypes.string.isRequired,
      })
    ).isRequired,

    renewals: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired, // Hacer opcional y permitir string o number
        renewalNumber: PropTypes.string.isRequired,
        createdAt: PropTypes.string.isRequired,
      }).isRequired
    ),

    periods: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired,
        year: PropTypes.number.isRequired,
        policy_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired,
        advisorPercentage: PropTypes.number.isRequired,
        agencyPercentage: PropTypes.number.isRequired,
        policyValue: PropTypes.number.isRequired,
        policyFee: PropTypes.number,
      })
    ).isRequired,
  }).isRequired,

  onClose: PropTypes.func.isRequired,
  onPolicyUpdated: PropTypes.func,
};

export default ListPolicyModal;
