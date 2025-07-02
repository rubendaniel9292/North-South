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
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getTotals, getPolicyFields } from "../../helpers/CommissionUtils";

// Badge Bootstrap helper
const Badge = ({ text, color = "secondary" }) => (
  <span className={`badge rounded-pill bg-${color} fw-semibold`}>{text}</span>
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

  // --- Filtros visuales ---
  const [search, setSearch] = useState("");
  const [frequency, setFrequency] = useState("all");
  const [renewal, setRenewal] = useState("all");

  // --- Traer asesor completo con todas sus pólizas y comisiones ---
  const fetchAdvisor = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await http.get(
        `advisor/get-advisor/${advisorFromNav.id}`
      );
      setAdvisor(response.data.advisorById);
    } catch (error) {
      setAdvisor(null);
    }
    setIsLoading(false);
  }, [advisorFromNav]);

  useEffect(() => {
    if (advisorFromNav?.id) fetchAdvisor();
  }, [advisorFromNav, fetchAdvisor]);

  useEffect(() => {
    if (advisor) {
      console.log(advisor.policies);
    }
  }, [advisor]);
  // --- Filtrado de pólizas por cliente y por filtros visuales ---
  const filteredPolicies = useMemo(() => {
    let policies = advisor?.policies || [];
    // Filtrado por cliente
    if (customerFromNav) {
      policies = policies.filter(
        (policy) => policy.customer && policy.customer.id === customerFromNav.id
      );
    }
    // Filtros visuales
    return policies.filter((policy) => {
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
      return matchSearch && matchFrequency && matchRenewal;
    });
  }, [advisor, customerFromNav, search, frequency, renewal]);

  // --- Aplica getPolicyFields a cada póliza filtrada ---
  const filteredPoliciesWithFields = useMemo(
    () =>
      filteredPolicies.map((policy) => ({
        ...policy,
        ...getPolicyFields(policy),
      })),
    [filteredPolicies]
  );

  // --- Totales globales usando los helpers ---
  const totals = useMemo(() => getTotals(filteredPolicies), [filteredPolicies]);

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
              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Buscar</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <FontAwesomeIcon icon={faSearch} />
                  </span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="form-control"
                    placeholder="Cliente o póliza..."
                  />
                </div>
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label fw-semibold">Frecuencia</label>
                <select
                  className="form-select"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  <option value="all">Todas</option>
                  <option value="anualizada">Anualizada</option>
                  <option value="normal">Normal</option>
                </select>
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label fw-semibold">Renovación</label>
                <select
                  className="form-select"
                  value={renewal}
                  onChange={(e) => setRenewal(e.target.value)}
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
        <div className="row justify-content-center mb-4 mt-4">
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

        {/* --- Tabla principal de polizas*/}
        {isLoading || !advisor ? (
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
                        colSpan={12}
                        className="bg-secondary fw-bold text-center text-white"
                      >
                        Historial de comiciones canceladas
                      </th>
                    </tr>
                    <tr>
                      <th>N° de póliza</th>
                      <th>Cliente</th>
                      <th>Frecuencia</th>
                      <th>Pagos/Año</th>
                      <th>Renovación</th>
                      <th>Valor póliza</th>
                      <th>Com. Totales</th>
                      <th>Com. Liberadas</th>
                      <th>Descuento (si aplica)</th>
                      <th>Com. Pagadas</th>
                      <th>A Favor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPoliciesWithFields.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center text-muted">
                          <FontAwesomeIcon icon={faFile} size="2x" />
                          <div>
                            No existen pólizas para el asesor{" "}
                            {advisor?.firstName} {advisor?.surname}
                            {customerFromNav ? " y cliente seleccionado." : "."}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredPoliciesWithFields.map((policyFiltered) => (
                        <React.Fragment key={policyFiltered.id}>
                          <tr>
                            <td className="fw-bold">
                              {policyFiltered.numberPolicy}
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
                              {policyFiltered.isCommissionAnnualized === false
                                ? policyFiltered.numberOfPaymentsAdvisor
                                : 1}
                            </td>
                            <td>
                              <Badge
                                text={
                                  policyFiltered.renewalCommission ? "SÍ" : "NO"
                                }
                                color={
                                  policyFiltered.renewalCommission
                                    ? "dark"
                                    : "danger"
                                }
                              />
                            </td>
                            <td className="fw-bold bs-tertiary-color">
                              ${Number(policyFiltered.policyValue).toFixed(2)}
                            </td>
                            <td className="fw-bold text-primary">
                              $
                              {Number(policyFiltered.commissionTotal).toFixed(
                                2
                              )}
                            </td>
                            <td className="fw-bold text-warning">
                              ${Number(policyFiltered.released).toFixed(2)}
                            </td>
                            <td className="fw-bold text-danger">
                              ${Number(policyFiltered.refundsAmount).toFixed(2)}
                            </td>
                            <td className="fw-bold text-success">
                              ${Number(policyFiltered.paid).toFixed(2)}
                            </td>
                            <td
                              className="fw-bold"
                              style={{ color: "#a259ff" }}
                            >
                              $
                              {Number(policyFiltered.commissionInFavor).toFixed(
                                2
                              )}
                            </td>
                          </tr>
                          {/* Subtabla historial de pagos debajo */}
                          <tr>
                            <td colSpan={11} className="p-0">
                              {Array.isArray(policyFiltered.commissions) &&
                              policyFiltered.commissions.length > 0 ? (
                                <table className="table table-sm table-bordered text-center mb-0">
                                  <thead>
                                    <tr>
                                      <th>Fecha de pago</th>
                                      <th>Número de recibo</th>
                                      <th>Comisión pagadas</th>
                                      <th>Observaciones</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {policyFiltered.commissions.map(
                                      (payment) => (
                                        <tr key={payment.id}>
                                          <td>
                                            {payment.createdAt
                                              ? dayjs(payment.createdAt).format(
                                                  "DD/MM/YYYY"
                                                )
                                              : "-"}
                                          </td>
                                          <td>{payment.receiptNumber}</td>
                                          <td>
                                            $
                                            {Number(
                                              payment.advanceAmount
                                            ).toFixed(2)}
                                          </td>
                                          <td>{payment.observations || "-"}</td>
                                        </tr>
                                      )
                                    )}
                                  </tbody>
                                </table>
                              ) : (
                                <div className="text-center text-muted py-2">
                                  Aún no se han registrado pagos de comisiones
                                  para esta póliza.
                                </div>
                              )}
                            </td>
                          </tr>
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- Anticipos generales sin póliza asignada  --- */}
        {advisor &&
          advisor.commissions &&
          advisor.commissions.filter((c) => !c.policy_id).length > 0 && (
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
                    <th>Fecha de pago</th>
                    <th>Número de recibo</th>
                    <th>Monto abonado</th>
                    <th>Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {advisor.commissions
                    .filter((c) => !c.policy_id)
                    .map((anticipo) => (
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
