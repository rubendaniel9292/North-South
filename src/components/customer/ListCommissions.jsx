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
import {
  calculateCommissionValue,
  calculateReleasedCommissions,
} from "../../helpers/CommissionUtils";

// Badge Bootstrap helper (puedes customizar colores según tu branding)
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

  // --- Filtros visuales NUEVOS ---
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

  // --- Filtrado de pólizas por cliente y por filtros visuales ---
  const filteredPolicies = useMemo(() => {
    let policies = advisor?.policies || [];
    // Filtrado por cliente (lógica original)
    if (customerFromNav) {
      policies = policies.filter(
        (policy) => policy.customer && policy.customer.id === customerFromNav.id
      );
    }
    // Filtros visuales (NUEVO)
    return policies.filter((policy) => {
      // Busca por nombre de cliente o número de póliza
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
      // Filtro frecuencia
      const policyFreq =
        policy.isCommissionAnnualized === false ? "normal" : "anualizada";
      const matchFrequency = frequency === "all" || policyFreq === frequency;
      // Filtro renovación
      const matchRenewal =
        renewal === "all" ||
        (renewal === "yes" && policy.renewalCommission) ||
        (renewal === "no" && !policy.renewalCommission);
      return matchSearch && matchFrequency && matchRenewal;
    });
  }, [advisor, customerFromNav, search, frequency, renewal]);

  // --- Cálculo de totales (NUEVO) ---
  const totals = useMemo(() => {
    return filteredPolicies.reduce(
      (acc, policy) => {
        // Lógica igual a la que usas para la tabla
        const commissionValue = calculateCommissionValue(policy);
        const released = calculateReleasedCommissions(policy);
        const maxLiberated = Math.min(released, commissionValue);
        const commissionsPaid = Array.isArray(policy.commissions)
          ? policy.commissions.reduce(
              (total, payment) => total + (Number(payment.advanceAmount) || 0),
              0
            )
          : 0;
        const maxPaid = Math.min(commissionsPaid, maxLiberated);
        const commissionsAfavor = Math.max(0, maxLiberated - maxPaid);

        return {
          totalCommissions: acc.totalCommissions + commissionValue,
          releasedCommissions: acc.releasedCommissions + maxLiberated,
          paidCommissions: acc.paidCommissions + maxPaid,
          commissionsInFavor: acc.commissionsInFavor + commissionsAfavor,
        };
      },
      {
        totalCommissions: 0,
        releasedCommissions: 0,
        paidCommissions: 0,
        commissionsInFavor: 0,
      }
    );
  }, [filteredPolicies]);

  return (
    <>
      <div className="container-fluid bg-light w-100">
        {/* --- Header Asesor y Cliente --- */}
        <div className="row">
          <div className="col-md-8">
            <h1 className="h2 mb-1 mt-1">Historial de anticipos y comisiones</h1>
            <div className="mb-1">
              <span className="fw-bold">Asesor:</span>{" "}
              <FontAwesomeIcon
                icon={faDollarSign}
                className="text-muted m-1"
              />
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

        {/* --- Filtros visuales NUEVO --- */}
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

        {/* --- Tarjetas de totales NUEVO --- */}
        <div className="row mb-4">
          <div className="col-6 col-md-3 mb-2">
            <div className="card border-0 shadow-sm text-center h-100">
              <div className="card-body">
                <FontAwesomeIcon
                  icon={faDollarSign}
                  size="lg"
                  className="mb-2 text-primary"
                />
                <div className="fw-bold text-muted">Com. Totales</div>
                <div className="fs-5 fw-bold text-primary">
                  $
                  {totals.totalCommissions.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3 mb-2">
            <div className="card border-0 shadow-sm text-center h-100">
              <div className="card-body">
                <FontAwesomeIcon
                  icon={faDollarSign}
                  size="lg"
                  className="mb-2 text-warning"
                />
                <div className="fw-bold text-muted">Com. Liberadas</div>
                <div className="fs-5 fw-bold text-warning">
                  $
                  {totals.releasedCommissions.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3 mb-2">
            <div className="card border-0 shadow-sm text-center h-100">
              <div className="card-body">
                <FontAwesomeIcon
                  icon={faDollarSign}
                  size="lg"
                  className="mb-2 text-success"
                />
                <div className="fw-bold text-muted">Com. Pagadas</div>
                <div className="fs-5 fw-bold text-success">
                  $
                  {totals.paidCommissions.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3 mb-2">
            <div className="card border-0 shadow-sm text-center h-100">
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
                  {totals.commissionsInFavor.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- Tabla principal de políticas (igualada pero modernizada) --- */}
        {isLoading || !advisor ? (
          <div className="text-center my-2">
            <span className="fw-bold">Cargando historial</span>
            <div className="spinner-border text-success mt-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="card shadow-sm border-0 mb-2">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 text-center">
                  <thead className="table-light">
                    <tr>
                      <th>N° de póliza</th>
                      <th>Cliente</th>
                      <th>Frecuencia</th>
                      <th>Pagos/Año</th>
                      <th>Renovación</th>
                      <th>Valor póliza</th>
                      <th>Com. Totales</th>
                      <th>Com. Liberadas</th>
                      <th>Com. Pagadas</th>
                      <th>A Favor</th>
                     
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPolicies.length === 0 ? (
                      <tr>
                        <td
                          colSpan={11}
                          className="text-center text-muted"
                        >
                          <FontAwesomeIcon
                            icon={faFile}
                            size="2x"
                            
                          />
                          <div>
                            No existen pólizas para el asesor{" "}
                            {advisor.firstName} {advisor.surname}
                            {customerFromNav ? " y cliente seleccionado." : "."}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredPolicies.map((policy) => {
                        const commissionValue =
                          calculateCommissionValue(policy);
                        const released = calculateReleasedCommissions(policy);
                        const maxLiberated = Math.min(
                          released,
                          commissionValue
                        );
                        const commissionsPaid = Array.isArray(
                          policy.commissions
                        )
                          ? policy.commissions.reduce(
                              (total, payment) =>
                                total + (Number(payment.advanceAmount) || 0),
                              0
                            )
                          : 0;
                        const maxPaid = Math.min(commissionsPaid, maxLiberated);
                        const commissionsAfavor = Math.max(
                          0,
                          maxLiberated - maxPaid
                        );
                        return (
                          <React.Fragment key={policy.id}>
                            <tr>
                              <td className="fw-bold">{policy.numberPolicy}</td>
                              <td>
                                {policy.customer
                                  ? [
                                      policy.customer.firstName,
                                      policy.customer.secondName,
                                      policy.customer.surname,
                                      policy.customer.secondSurname,
                                    ]
                                      .filter(Boolean)
                                      .join(" ")
                                  : "N/A"}
                              </td>
                              <td>
                                <Badge
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
                              <td>
                                {policy.isCommissionAnnualized === false
                                  ? policy.numberOfPaymentsAdvisor
                                  : 1}
                              </td>
                              <td>
                                <Badge
                                  text={policy.renewalCommission ? "SÍ" : "NO"}
                                  color={
                                    policy.renewalCommission ? "dark" : "danger"
                                  }
                                />
                              </td>
                              <td>${Number(policy.policyValue).toFixed(2)}</td>
                              <td className="fw-bold text-primary">
                                ${Number(commissionValue).toFixed(2)}
                              </td>
                              <td className="fw-bold text-warning">
                                ${Number(maxLiberated).toFixed(2)}
                              </td>
                              <td className="fw-bold text-success">
                                ${Number(maxPaid).toFixed(2)}
                              </td>
                              <td
                                className="fw-bold"
                                style={{ color: "#a259ff" }}
                              >
                                ${Number(commissionsAfavor).toFixed(2)}
                              </td>
                             
                            </tr>
                            {/* Subtabla historial de pagos debajo */}
                            <tr>
                              <td colSpan={11} className="p-0">
                                {Array.isArray(policy.commissions) &&
                                policy.commissions.length > 0 ? (
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
                                      {policy.commissions.map((payment) => (
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
                                      ))}
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
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- Anticipos generales sin póliza asignada (igual que antes, solo mejora visual) --- */}
        {advisor &&
          advisor.commissions &&
          advisor.commissions.filter((c) => !c.policy_id).length > 0 && (
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-sm table-bordered text-center mb-0">
                    <thead className="table-success">
                      <tr>
                        <th colSpan={4} className="fw-bold text-center">
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
                            <td>
                              ${Number(anticipo.advanceAmount).toFixed(2)}
                            </td>
                            <td>{anticipo.observations || "-"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
      </div>
    </>
  );
};

export default ListCommissions;
