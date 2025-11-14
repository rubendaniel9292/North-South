import { useLocation } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import React from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import http from "../../helpers/Http";
import {
  faFile,
  faSearch,
  faFilter,
  faDollarSign,
  faBarcode,
  faBuilding,
  faUser,
  faSync,
  faCalendarAlt,
  faRotate,
  faHashtag,
  faSackDollar,
  faMoneyBillWave,
  faCheck,
  faMinus,
  faPlus
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getTotals, getPolicyFields } from "../../helpers/CommissionUtils";

// Badge Bootstrap helper
const Badge = ({ text, color = "secondary" }) => (
  <span className={`badge rounded-pill bg-${color} fw-bold fs-6`}>{text}</span>
);

const ListCommissions = () => {
  // --- Obtención de navegación y validación de entrada ---
  const location = useLocation();
  const advisorFromNav = location.state?.advisor;
  if (!advisorFromNav) {
    return <div>Error: No se recibió asesor.</div>;
  }

  const customerFromNav = location.state?.customer;

  // --- Estados principales ---
  const [advisor, setAdvisor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [typeFilter, setTypeFilter] = useState("AMBOS");

  // --- Traer compañías registrado para el filstrado ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companyResponse] = await Promise.all([
          http.get("company/get-all-company"),
        ]);
        setCompanies(companyResponse.data.allCompanies);
      } catch (error) {
        alerts("Error", "Error fetching data.", error);
      }
    };

    fetchData();
  }, []);

  //console.log("periodos del asesor: ", advisor.policies.periods);
  // --- Filtros visuales ---
  const [search, setSearch] = useState("");
  const [frequency, setFrequency] = useState("all");
  const [renewal, setRenewal] = useState("all");
  const [selectedCompany, setSelectedCompany] = useState("");
  // --- Traer asesor completo con todas sus pólizas y comisiones ---
  const fetchAdvisor = useCallback(async () => {
    setIsLoading(true);
    try {
      /*
      const response = await http.get(
        `advisor/get-advisor/${advisorFromNav.id}`
      );
      */
      const response = await http.get(
        `advisor/get-advisor-optimized/${advisorFromNav.id}`
      );
      console.log("response advisor en listado de comisiones:", response.data.advisorById);
      setAdvisor(response.data.advisorById);
    } catch (error) {
      setAdvisor(null);
    }
    setIsLoading(false);
  }, [advisorFromNav]);

  useEffect(() => {
    if (advisorFromNav?.id) fetchAdvisor();
  }, [advisorFromNav, fetchAdvisor]);
  /*
  useEffect(() => {
    if (advisor) {
      console.log(advisor.policies);
      //testNewExamplePolicy(advisor.policies); en caso de querer probar un ejemplo
    }
  }, [advisor]);
*/
  // Manejar el cambio en el filtro de búsqueda
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  // Manejar el cambio en el filtro de compañía
  const handleCompanyChange = (e) => {
    setSelectedCompany(e.target.value);
  };

  // Manejar el cambio en el filtro de tipo
  const handleTypeChange = (e) => {
    setTypeFilter(e.target.value);
  };

  // Filtrar las pólizas incluyendo el filtro por compañía

  const filteredPolicies = useMemo(() => {
    let policies = advisor?.policies || [];
    let anticipos = advisor?.commissions?.filter((c) => !c.policy_id) || [];

    // Filtrar pólizas por cliente si está definido
    if (typeFilter === "COMISIONES" || typeFilter === "AMBOS") {
      if (customerFromNav) {
        policies = policies.filter(
          (policy) =>
            policy.customer && policy.customer.id === customerFromNav.id
        );
      }
      // Aplicar filtros visuales SOLO a pólizas
      policies = policies.filter((policy) => {
        const policyClient = policy.customer
          ? [
            policy.customer.firstName,
            policy.customer.secondName,
            policy.customer.surname,
            policy.customer.secondSurname,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
          : "";
        const matchSearch =
          policyClient.includes(search.toLowerCase()) ||
          (policy.numberPolicy || "")
            .toLowerCase()
            .includes(search.toLowerCase());
        const policyFreq =
          policy.isCommissionAnnualized === false ? "normal" : "anualizada";
        const matchFrequency = frequency === "all" || policyFreq === frequency;
        const matchRenewal =
          renewal === "all" ||
          (renewal === "yes" && policy.renewalCommission) ||
          (renewal === "no" && !policy.renewalCommission);
        const matchCompany =
          !selectedCompany ||
          (policy.company && policy.company.companyName === selectedCompany);
        return matchSearch && matchFrequency && matchRenewal && matchCompany;
      });
    }

    if (typeFilter === "COMISIONES") {
      return policies;
    } else if (typeFilter === "ANTICIPOS") {
      return anticipos;
    } else if (typeFilter === "AMBOS") {
      return [...policies, ...anticipos]; // policies ya está filtrado
    }

    return policies;
  }, [
    advisor,
    customerFromNav,
    search,
    frequency,
    renewal,
    selectedCompany,
    typeFilter,
  ]);

  // --- Aplica getPolicyFields a cada póliza filtrada ---
  const filteredPoliciesWithFields = useMemo(
    () =>
      filteredPolicies
        .filter((policy) => policy.numberPolicy) // solo pólizas reales
        .map((policy) => ({
          ...policy,
          ...getPolicyFields(policy), // Usa la lógica de pagos generados
        })),
    [filteredPolicies]
  );

  // --- Totales globales usando los helpers ---
  const totals = useMemo(() => getTotals(filteredPolicies), [filteredPolicies]);

  // --- Anticipos generales sin póliza asignada ---
  const anticiposSinPoliza = useMemo(
    () =>
      advisor?.commissions
        ? advisor.commissions.filter((c) => !c.policy_id)
        : [],
    [advisor]
  );

  return (
    <>
      <div className="container-fluid bg-light w-100">
        {/* --- Header Asesor y Cliente --- */}
        <div className="row">
          <div className="col-md-8">
            <h1 className="h2 mb-1 mt-1">
              Historial de anticipos y comisiones
            </h1>
            <div className="mb-1">
              <span className="fw-bold">Asesor:</span>{" "}
              <FontAwesomeIcon icon={faDollarSign} className="text-muted m-1" />
              <span className="fw-semibold">
                {advisor
                  ? [
                    advisor.firstName,
                    advisor.secondName,
                    advisor.surname,
                    advisor.secondSurname,
                  ]
                    .filter(Boolean)
                    .join(" ")
                  : ""}
              </span>
            </div>
            {customerFromNav && (
              <div className="mb-1">
                <span className="fw-bold">Cliente:</span>{" "}
                {[
                  customerFromNav.firstName,
                  customerFromNav.secondName,
                  customerFromNav.surname,
                  customerFromNav.secondSurname,
                ]
                  .filter(Boolean)
                  .join(" ")}
              </div>
            )}
          </div>
        </div>

        {/* --- Filtros visuales --- */}
        <div className="card-commisions mb-1 shadow-sm border-0">
          <div className="card-body">
            <div className="d-flex align-items-center mb-2">
              <FontAwesomeIcon icon={faFilter} className="me-2 text-primary" />
              <h5 className="mb-0 fw-bold">Opciones de filtro</h5>
            </div>

            <div className="row g-3">
              {/* Filtro por tipo */}
              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Tipo</label>
                <select
                  className="form-select"
                  value={typeFilter}
                  onChange={handleTypeChange}
                >
                  <option value="AMBOS">Ambos</option>
                  <option value="COMISIONES">Comisiones</option>
                  <option value="ANTICIPOS">Anticipos</option>
                </select>
              </div>

              {/* Filtro por búsqueda */}
              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Buscar</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <FontAwesomeIcon icon={faSearch} />
                  </span>
                  <input
                    value={search}
                    onChange={handleSearchChange}
                    className="form-control"
                    placeholder="Cliente o póliza..."
                    disabled={typeFilter === "ANTICIPOS"}
                  />
                </div>
              </div>

              {/* Filtro por compañía */}
              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">
                  Filtrar por compañía
                </label>
                <select
                  className="form-select"
                  value={selectedCompany}
                  onChange={handleCompanyChange}
                  disabled={typeFilter === "ANTICIPOS"}
                >
                  <option value="">Todas las compañías</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.companyName}>
                      {company.companyName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por frecuencia */}
              <div className="col-6 col-md-3">
                <label className="form-label fw-semibold">Frecuencia</label>
                <select
                  className="form-select"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  disabled={typeFilter === "ANTICIPOS"}
                >
                  <option value="all">Todas</option>
                  <option value="anualizada">Anualizada</option>
                  <option value="normal">Normal</option>
                </select>
              </div>

              {/* Filtro por renovación */}
              <div className="col-6 col-md-3">
                <label className="form-label fw-semibold">Renovación</label>
                <select
                  className="form-select"
                  value={renewal}
                  onChange={(e) => setRenewal(e.target.value)}
                  disabled={typeFilter === "ANTICIPOS"}
                >
                  <option value="all">Todas</option>
                  <option value="yes">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="col-12 col-md-3 d-flex align-items-end">
                <button className="btn btn-success w-100" disabled={isLoading}>
                  <FontAwesomeIcon icon={faFile} className="me-2" />
                  Generar reporte PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- Tarjetas de totales  --- */}
        <div className="row justify-content-center mb-2 mt-4">
          <div className="col-12 col-sm-6 col-md-4 col-lg-2 mb-2 d-flex align-items-stretch mx-4">
            <div className="card border-0 shadow-sm text-center w-100">
              <div className="card-body">
                <FontAwesomeIcon
                  icon={faDollarSign}
                  size="lg"
                  className="mb-2 text-primary"
                />
                <div className="fw-bold text-muted">Com. Totales</div>
                <div className="fs-5 fw-bold text-primary">
                  $
                  {totals.commissionTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-md-4 col-lg-2 mb-2 d-flex align-items-stretch mx-4">
            <div className="card border-0 shadow-sm text-center w-100">
              <div className="card-body">
                <FontAwesomeIcon
                  icon={faDollarSign}
                  size="lg"
                  className="mb-2 text-warning"
                />
                <div className="fw-bold text-muted">Com. Liberadas</div>
                <div className="fs-5 fw-bold text-warning">
                  $
                  {totals.released.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-md-4 col-lg-2 mb-2 d-flex align-items-stretch mx-4">
            <div className="card border-0 shadow-sm text-center w-100">
              <div className="card-body">
                <FontAwesomeIcon
                  icon={faDollarSign}
                  size="lg"
                  className="mb-2 text-danger"
                />
                <div className="fw-bold text-muted">Descuentos</div>
                <div className="fs-5 fw-bold text-danger">
                  $
                  {totals.refundsAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-md-4 col-lg-2 mb-2 d-flex align-items-stretch mx-4">
            <div className="card border-0 shadow-sm text-center w-100">
              <div className="card-body">
                <FontAwesomeIcon
                  icon={faDollarSign}
                  size="lg"
                  className="mb-2 text-success"
                />
                <div className="fw-bold text-muted">Com. Pagadas</div>
                <div className="fs-5 fw-bold text-success">
                  $
                  {totals.paid.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-md-4 col-lg-2 mb-2 d-flex align-items-stretch mx-4">
            <div className="card border-0 shadow-sm text-center w-100">
              <div className="card-body">
                <FontAwesomeIcon
                  icon={faDollarSign}
                  size="lg"
                  className="mb-2"
                  style={{ color: "#a259ff" }}
                />
                <div className="fw-bold text-muted">A Favor</div>
                <div className="fs-5 fw-bold" style={{ color: "#a259ff" }}>
                  $
                  {totals.commissionInFavor.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- Tabla principal de polizas SOLO si es COMISIONES o AMBOS --- */}
        {(typeFilter === "COMISIONES" || typeFilter === "AMBOS") &&
          (isLoading || !advisor ? (
            <div className="text-center my-2">
              <span className="fw-bold">Cargando historial</span>
              <div className="spinner-border text-success mt-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className=" shadow-sm border-0 mb-2">
              <div className="p-0">
                <div className="">
                  <table className="table table-hover  mb-0 text-center">
                    <thead className="">
                      <tr>
                        <th
                          colSpan={13}
                          className="bg-secondary fw-bold text-center text-white"
                        >
                          Historial de comisiones
                        </th>
                      </tr>
                      <tr>
                        {/*  <th>Valor póliza</th>*/}
                        <th>
                          <FontAwesomeIcon icon={faBarcode} className="me-2" />
                          N° de póliza
                        </th>
                        <th>
                          <FontAwesomeIcon icon={faBuilding} className="me-2" />
                          Compañía
                        </th>
                        <th>
                          <FontAwesomeIcon icon={faUser} className="me-2" />
                          Cliente
                        </th>
                        <th>
                          <FontAwesomeIcon icon={faSync} className="me-2" />
                          Frecuencia
                        </th>
                        <th>
                          <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                          Pagos/Año
                        </th>
                        <th>
                          <FontAwesomeIcon icon={faRotate} className="me-2" />
                          Renovación
                        </th>
                        <th>
                          <FontAwesomeIcon icon={faHashtag} className="me-2" />
                          N° de Com. Liberadas
                        </th>
                        <th>
                          <FontAwesomeIcon icon={faSackDollar} className="me-2" />
                          Com. Totales
                        </th>
                        <th>
                          <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                          Com. Individual
                        </th>
                        <th>
                          <FontAwesomeIcon icon={faCheck} className="me-2" />
                          Com. Liberadas
                        </th>
                        <th>
                          <FontAwesomeIcon icon={faMinus} className="me-2" />
                          Descuento (si aplica)
                        </th>
                        <th>
                          <FontAwesomeIcon icon={faDollarSign} className="me-2" />
                          Com. Pagadas
                        </th>
                        <th>
                          <FontAwesomeIcon icon={faPlus} className="me-2" />
                          A Favor
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPoliciesWithFields.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="text-center text-muted">
                            <FontAwesomeIcon icon={faFile} size="2x" />
                            <div>
                              No existen pólizas para el asesor{" "}
                              {advisor?.firstName} {advisor?.surname}
                              {customerFromNav
                                ? " y cliente seleccionado."
                                : "."}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredPoliciesWithFields.map((policyFiltered) => {
                          // Calcular pagos liberados (AL DÍA) y total de pagos por periodo
                          let releasedPayments, totalPayments;

                          if (policyFiltered.isCommissionAnnualized === true) {
                            // ✅ PARA ANUALIZADAS: Contar períodos, no pagos mensuales
                            const totalPeriods =
                              1 +
                              (Array.isArray(policyFiltered.renewals)
                                ? policyFiltered.renewals.length
                                : 0);
                            const releasedPeriods = totalPeriods; // Para anualizadas, se liberan todos los períodos

                            releasedPayments = releasedPeriods;
                            totalPayments = totalPeriods;
                          } else {
                            // ✅ PARA NORMALES: Contar pagos liberados del periodo actual (año en curso)
                            // Obtener el último periodo (año más reciente)
                            const lastPeriod = policyFiltered.periods?.length
                              ? policyFiltered.periods.reduce((a, b) => (a.year > b.year ? a : b))
                              : null;

                            // Total de pagos por año según la frecuencia
                            totalPayments = policyFiltered.numberOfPaymentsAdvisor || 12;

                            // Obtener todos los pagos liberados (AL DÍA)
                            const allReleasedPayments = policyFiltered.payments?.filter(
                              (payment) =>
                                payment.paymentStatus &&
                                payment.paymentStatus.id == 2
                            ) || [];

                            // Si hay periodo definido y pagos tienen year, filtrar por último periodo
                            if (lastPeriod && allReleasedPayments.some(p => p.year)) {
                              releasedPayments = allReleasedPayments.filter(
                                (payment) => payment.year === lastPeriod.year
                              ).length;
                            } else {
                              // Si no hay year en pagos, tomar los últimos N pagos liberados según totalPayments
                              releasedPayments = Math.min(allReleasedPayments.length, totalPayments);
                            }
                          }

                          return (
                            <React.Fragment key={policyFiltered.id}>
                              <tr>
                                <td className="fw-bold">
                                  {policyFiltered.numberPolicy}
                                </td>
                                <td>
                                  {policyFiltered.company?.companyName || "N/A"}
                                </td>

                                <td>
                                  {policyFiltered.customer
                                    ? [
                                      policyFiltered.customer.firstName,
                                      policyFiltered.customer.secondName,
                                      policyFiltered.customer.surname,
                                      policyFiltered.customer.secondSurname,
                                    ]
                                      .filter(Boolean)
                                      .join(" ")
                                    : "N/A"}
                                </td>
                                <td>
                                  <Badge
                                    text={
                                      policyFiltered.isCommissionAnnualized ===
                                        false
                                        ? "Normal"
                                        : "Anualizada"
                                    }
                                    color={
                                      policyFiltered.isCommissionAnnualized ===
                                        false
                                        ? "info"
                                        : "secondary"
                                    }
                                  />
                                </td>
                                <td>
                                  {policyFiltered.isCommissionAnnualized ===
                                    false
                                    ? policyFiltered.numberOfPaymentsAdvisor
                                    : 1}
                                </td>
                                <td>
                                  <Badge
                                    text={
                                      policyFiltered.renewalCommission
                                        ? "SÍ"
                                        : "NO"
                                    }
                                    color={
                                      policyFiltered.renewalCommission
                                        ? "dark"
                                        : "danger"
                                    }
                                  />
                                </td>

                                <td>
                                  <Badge
                                    text={releasedPayments + "/" + totalPayments}
                                    color={
                                      releasedPayments === totalPayments
                                        ? "success"
                                        : releasedPayments > 0
                                          ? "warning text-dark"
                                          : "secondary"
                                    }
                                  />
                                </td>
                                {/* Muestra los totales de la póliza */}
                                {/*<td className="fw-bold bs-tertiary-color">
                                  $
                                  {Number(policyFiltered.policyValue).toFixed(
                                    2
                                  )}
                                </td> */}

                                <td className="fw-bold text-primary">
                                  $
                                  {
                                    isNaN(policyFiltered.commissionTotal) || !isFinite(policyFiltered.commissionTotal)
                                      ? "0.00"
                                      : Number(policyFiltered.commissionTotal).toFixed(2)
                                  }
                                </td>
                                <td className="fw-bold text-info">
                                  <div>
                                    $
                                    {
                                      isNaN(policyFiltered.individualCommission) || !isFinite(policyFiltered.individualCommission)
                                        ? "0.00"
                                        : Number(policyFiltered.individualCommission).toFixed(2)
                                    }
                                  </div>
                                  <small className="text-muted">
                                    {policyFiltered.frequencyText}
                                  </small>
                                </td>
                                <td className="fw-bold text-warning">
                                  ${
                                    isNaN(policyFiltered.released) || !isFinite(policyFiltered.released)
                                      ? "0.00"
                                      : Number(policyFiltered.released).toFixed(2)
                                  }
                                </td>
                                <td className="fw-bold text-danger">
                                  <div>
                                    $
                                    {
                                      isNaN(policyFiltered.refundsAmount) || !isFinite(policyFiltered.refundsAmount)
                                        ? "0.00"
                                        : Number(policyFiltered.refundsAmount).toFixed(2)
                                    }
                                  </div>


                                  {policyFiltered.refundsDetails &&
                                    policyFiltered.refundsDetails.length > 0 && (
                                      <div className="mt-1">
                                        {policyFiltered.refundsDetails.map(
                                          (refund, index) => (
                                            <span
                                              key={refund.id || index}
                                              className="badge bg-secondary me-1 small"
                                              title={`$${refund.amount} - ${refund.reason}`}
                                            >
                                              {refund.reason}
                                            </span>
                                          )
                                        )}
                                      </div>
                                    )}
                                </td>
                                <td className="fw-bold text-success">
                                  ${Number(policyFiltered.paid).toFixed(2)}
                                </td>
                                <td
                                  className="fw-bold"
                                  style={{ color: "#a259ff" }}
                                >
                                  $
                                  {Number(
                                    policyFiltered.commissionInFavor
                                  ).toFixed(2)}
                                </td>
                              </tr>
                              {/* Subtabla historial de pagos debajo */}
                              <tr>
                                <td colSpan={13} className="p-0">
                                  {Array.isArray(policyFiltered.commissions) &&
                                    policyFiltered.commissions.length > 0 ? (
                                    <table className="table table-sm table-bordered text-center mb-0">
                                      <thead>
                                        <tr>
                                          <th>
                                            <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                                            Fecha de pago
                                          </th>
                                          <th>
                                            <FontAwesomeIcon icon={faHashtag} className="me-2" />
                                            Número de recibo
                                          </th>
                                          <th>
                                            <FontAwesomeIcon icon={faCheck} className="me-2" />
                                            N° Pagos Realizados
                                          </th>
                                          <th>
                                            <FontAwesomeIcon icon={faDollarSign} className="me-2" />
                                            Comisión pagadas
                                          </th>
                                          <th>
                                            <FontAwesomeIcon icon={faFile} className="me-2" />
                                            Observaciones
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {policyFiltered.commissions.map(
                                          (payment, index) => {
                                            // Calcular cuántas comisiones se han pagado hasta este punto
                                            const paidCommissions = index + 1;
                                            // Total basado en todos los pagos de la póliza (no solo el periodo actual)
                                            const totalPaymentsPolicy = policyFiltered.payments?.length || 0;

                                            return (
                                              <tr key={payment.id}>
                                                <td>
                                                  {payment.createdAt
                                                    ? dayjs(
                                                      payment.createdAt
                                                    ).format("DD/MM/YYYY")
                                                    : "-"}
                                                </td>
                                                <td>{payment.receiptNumber}</td>
                                                <td>
                                                  <Badge
                                                    text={
                                                      paidCommissions +
                                                      "/" +
                                                      totalPaymentsPolicy
                                                    }
                                                    color={
                                                      paidCommissions ===
                                                        totalPaymentsPolicy
                                                        ? "success"
                                                        : "info"
                                                    }
                                                  />
                                                </td>
                                                <td>
                                                  $
                                                  {Number(
                                                    payment.advanceAmount
                                                  ).toFixed(2)}
                                                </td>
                                                <td>
                                                  {payment.observations || "-"}
                                                </td>
                                              </tr>
                                            );
                                          }
                                        )}
                                      </tbody>
                                    </table>
                                  ) : (
                                    <div className="text-center text-muted py-2">
                                      Aún no se han registrado pagos de
                                      comisiones para esta póliza.
                                    </div>
                                  )}
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}

        {/* --- Anticipos generales sin póliza asignada SOLO si es ANTICIPOS o AMBOS --- */}
        {(typeFilter === "ANTICIPOS" || typeFilter === "AMBOS") &&
          anticiposSinPoliza.length > 0 && (
            <div className="border-0 shadow-sm">
              <table className=" table table-hover text-center mb-0">
                <thead>
                  <tr>
                    <th
                      colSpan={4}
                      className="custom-thead-bg fw-bold text-center text-white"
                    >
                      Anticipos generales sin póliza asignada
                    </th>
                  </tr>
                  <tr>
                    <th>
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                      Fecha de pago
                    </th>
                    <th>
                      <FontAwesomeIcon icon={faHashtag} className="me-2" />
                      Número de recibo
                    </th>
                    <th>
                      <FontAwesomeIcon icon={faDollarSign} className="me-2" />
                      Monto abonado
                    </th>
                    <th>
                      <FontAwesomeIcon icon={faFile} className="me-2" />
                      Observaciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {anticiposSinPoliza.map((anticipo) => (
                    <tr key={anticipo.id}>
                      <td>
                        {anticipo.createdAt
                          ? dayjs(anticipo.createdAt).format("DD/MM/YYYY")
                          : "-"}
                      </td>
                      <td>{anticipo.receiptNumber}</td>
                      <td className="fw-bold" style={{ color: "#17a2b8" }}>
                        ${Number(anticipo.advanceAmount).toFixed(2)}
                      </td>
                      <td>{anticipo.observations || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </>
  );
};

export default ListCommissions;
