import { useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import React from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import http from "../../helpers/Http";
import { faFile } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  calculateCommissionValue,
  calculateReleasedCommissions,
} from "../../helpers/CommissionUtils";

const ListCommissions = () => {
  const location = useLocation();
  const advisorFromNav = location.state?.advisor;
  if (!advisorFromNav) {
    return <div>Error: No se recibió asesor.</div>;
  }
  const customerFromNav = location.state?.customer;

  const [advisor, setAdvisor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Traer asesor completo con todas sus pólizas y comisiones
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

  // Filtrado de pólizas por cliente si fue enviado
  const filteredPolicies =
    advisor?.policies?.filter((policy) => {
      if (!customerFromNav) return true;
      return policy.customer && policy.customer.id === customerFromNav.id;
    }) || [];

  return (
    <>
      <div className="container-fluid w-auto mt-4 relativeContainer">
        <div className="row justify-content-around align-content-center">
          <div className="col-6">
            <h1 className="h1">Historial de anticipos y comisiones</h1>
            <div className="mb-2">
              <h2 className="h2 fw-bold">Asesor:</h2>{" "}
              <p className="h2 fw-bold">
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
              </p>
            </div>
            {customerFromNav && (
              <div className="mb-2">
                <strong>Cliente:</strong>{" "}
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
          <div className="col-6">
            <h2>Opciones de filtro</h2>
          </div>
        </div>

        {isLoading || !advisor ? (
          <>
            <span>Cargando historial</span>
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </>
        ) : (
          <div className="row pt-2">
            <table className="table table-striped table-bordered mb-0 text-center">
              <thead>
                <tr>
                  <th>N° de póliza</th>
                  <th>Cliente </th>
                  <th>Frecuencia</th>
                  <th>Pagos por periodo/año</th>
                  <th>Comision por renovacion</th>
                  <th>Valor de la póliza</th>
                  <th>Comisiones totales</th>
                  <th>Comisiones liberadas</th>
                  <th>Comisiones pagadas</th>
                  <th>Comisiones a favor</th>
                </tr>
              </thead>
              <tbody>
                {filteredPolicies.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center">
                      No existen pólizas para el asesor {advisor.firstName}{" "}
                      {advisor.surname}
                      {customerFromNav ? ` y cliente seleccionado.` : "."}
                    </td>
                  </tr>
                ) : (
                  filteredPolicies.map((policy) => {
                    const commissionValue = calculateCommissionValue(policy);
                    const released = calculateReleasedCommissions(policy);
                    const maxLiberated = Math.min(released, commissionValue);
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
                          <td className="fw-bold">
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
                          <td
                            className={
                              policy.isCommissionAnnualized === false
                                ? "fw-bold bg-info-subtle"
                                : "fw-bold bg-dark-subtle"
                            }
                          >
                            {policy.isCommissionAnnualized === false
                              ? "Normal"
                              : "Anualizada"}
                          </td>
                          <th className="fw-bold">
                            {policy.isCommissionAnnualized === false
                              ? policy.numberOfPaymentsAdvisor
                              : 1}
                          </th>

                          <td
                            className={
                              policy.renewalCommission === true
                                ? "fw-bold bg-success-subtle"
                                : "fw-bold bg-danger-subtle"
                            }
                          >
                            {policy.renewalCommission === true ? "SI" : "NO"}
                          </td>
                          <td className="fw-bold">{policy.policyValue}</td>
                          <td className="bg-info fw-bold">
                            ${Number(commissionValue).toFixed(2)}
                          </td>
                          <td className="fw-bold bg-warning">
                            ${Number(maxLiberated).toFixed(2)}
                          </td>
                          <td className="fw-bold bg-primary text-white">
                            ${Number(maxPaid).toFixed(2)}
                          </td>
                          <td className="bg-success-subtle fw-bold">
                            ${Number(commissionsAfavor).toFixed(2)}
                          </td>
                        </tr>

                        {/* Subtabla historial de pagos debajo */}
                        <tr>
                          <td colSpan={10} className="p-0">
                            {Array.isArray(policy.commissions) &&
                            policy.commissions.length > 0 ? (
                              <table className="table table-sm table-bordered text-center">
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
                                        {Number(payment.advanceAmount).toFixed(
                                          2
                                        )}
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

            {/* Anticipos generales sin póliza asignada */}
            {advisor.commissions &&
              advisor.commissions.filter((c) => !c.policy_id).length > 0 && (
                <table className="table  table-sm table-bordered mt-3 text-center">
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
                          <td>${Number(anticipo.advanceAmount).toFixed(2)}</td>
                          <td>{anticipo.observations || "-"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
          </div>
        )}
        <div className="d-flex justify-content-center align-items-center mt-5 mb-4 stickyFooter">
          <button
            type="button"
            id="btnc"
            className="btn bg-success mx-5 text-white fw-bold"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="spinner-border text-light" role="status">
                <span className="visually-hidden">Generando reporte...</span>
              </div>
            ) : (
              "Generar reporte PDF"
            )}
            <FontAwesomeIcon className="mx-2" beat icon={faFile} />
          </button>
        </div>
      </div>
    </>
  );
};

export default ListCommissions;