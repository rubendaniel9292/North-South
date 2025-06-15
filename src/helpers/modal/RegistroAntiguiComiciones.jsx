/*VERION 1 */
import PropTypes from "prop-types";
import { useEffect, useCallback, useState } from "react";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import http from "../../helpers/Http";
import UserForm from "../../hooks/UserForm";
import alerts from "../../helpers/Alerts";
import {
  saveSelectedPolicies,
  loadSelectedPolicies,
} from "../../helpers/localStorageUtils";
import {
  calculateCommissionValue,
  calculateReleasedCommissions,
} from "../../helpers/CommissionUtils";
const RegisterAdvanceModal = ({ advisorId, onClose, refreshAdvisor }) => {
  if (!advisorId) {
    console.error("advisorId es undefined en RegisterAdvanceModal");
    return null;
  }
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState([]);
  const [policy, setSelectedPolicy] = useState(null);
  const [advanceValue, setAdvanceValue] = useState();
  const [totalCommission, setTotalCommission] = useState(0);
  const [availableCommissions, availableCommission] = useState(0);
  const [realBalance, setRealBalance] = useState(0);
  const [remainingValue, setRemainingValue] = useState(0);
  const [releasedCommissions, setReleasedCommissions] = useState(0);
  const { form, changed } = UserForm({
    advisor_id: advisorId.id,
    policy_id: advisorId.policies.id || null,
  });

  const [operationType, setOperationType] = useState(""); // NUEVO: ANTICIPO o COMISION
  const [selectedPolicies, setSelectedPolicies] = useState([]); // NUEVO: array de polizas seleccionadas

  useEffect(() => {
    // NUEVO: Cargar selección previa de localStorage
    if (advisorId?.id) {
      const prev = loadSelectedPolicies(advisorId.id);
      if (prev) setSelectedPolicies(prev);
    }
  }, [advisorId]);

  //  Actualizar localStorage cuando cambia la selección
  useEffect(() => {
    if (advisorId?.id) saveSelectedPolicies(advisorId.id, selectedPolicies);
  }, [selectedPolicies, advisorId]);

  // Cuando se selecciona 'COMISION', cargar todas las pólizas liberadas
  useEffect(() => {
    if (operationType === "COMISION" && Array.isArray(advisorId.policies)) {
      const liberadas = advisorId.policies.filter((pol) => {
        const liberada = calculateReleasedCommissions(pol);
        const total = calculateCommissionValue(pol);
        const comisionesPagadas = Array.isArray(pol.commissionsPayments)
          ? pol.commissionsPayments.reduce(
              (sum, p) => sum + (Number(p.advanceAmount) || 0),
              0
            )
          : 0;
        const maxLiberada = Math.min(liberada, total);
        return maxLiberada - comisionesPagadas > 0;
      });
      setSelectedPolicies(liberadas);
    }
    if (operationType === "ANTICIPO") {
      setSelectedPolicies([]); // Limpiar para anticipos
    }
  }, [operationType, advisorId]);

  // --- NUEVA LÓGICA: Cálculo de totales con nombres en inglés y signo ---
  const getPolicyFields = (policy) => {
    const commissionTotal = calculateCommissionValue(policy);
    const releasedCommissions = calculateReleasedCommissions(policy);
    const paidCommissions = Array.isArray(policy.commissionsPayments)
      ? policy.commissionsPayments.reduce(
          (sum, p) => sum + (Number(p.advanceAmount) || 0),
          0
        )
      : 0;
    const maxReleased = Math.min(releasedCommissions, commissionTotal);
    const afterBalance = maxReleased - paidCommissions;
    return {
      commissionTotal,
      releasedCommissions: maxReleased,
      paidCommissions,
      afterBalance,
      favorCommissions: afterBalance, // si tienes otra lógica, cámbiala aquí
    };
  };
  // Quitar póliza de la lista
  const removePolicy = (policyId) => {
    setSelectedPolicies(
      selectedPolicies.filter((policy) => policy.id !== policyId)
    );
  };

  //Sumatorias globales (solo para COMISION) + Calcula el saldo después del registro RESTANDO el anticipo
  const getTotals = (policies, advanceValue = 0) => {
    // Suma los campos de cada póliza
    const totals = policies.reduce(
      (acc, policy) => {
        const f = getPolicyFields(policy);
        acc.commissionTotal += f.commissionTotal;
        acc.releasedCommissions += f.releasedCommissions;
        acc.paidCommissions += f.paidCommissions;
        acc.afterBalance += f.afterBalance;
        acc.favorCommissions += f.favorCommissions;
        return acc;
      },
      {
        commissionTotal: 0,
        releasedCommissions: 0,
        paidCommissions: 0,
        afterBalance: 0,
        favorCommissions: 0,
      }
    );
    // Aplica la resta SOLO si se está trabajando en modo COMISION
    if (operationType === "COMISION" && policies.length > 0 && advanceValue) {
      totals.afterBalance -= Number(advanceValue);
    }
    return totals;
  };
  const globalTotals = getTotals(selectedPolicies, advanceValue);
  const option = "Escoja una opción";
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companyResponse, paymentMethodResponse] = await Promise.all([
          http.get("company/get-all-company"),
          http.get("policy/get-payment-method"),
        ]);
        setCompanies(companyResponse.data.allCompanies);
        setFilteredCompanies(companyResponse.data.allCompanies);
        setPaymentMethod(paymentMethodResponse.data.allPaymentMethod);
      } catch (error) {
        //alerts("Error", "Error fetching data.", error);
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Función para manejar el cambio de póliza
  const handlePolicyChange = (e) => {
    const selectedPolicyId = e.target.value;

    if (!selectedPolicyId) {
      changed(e);
      setFilteredCompanies(companies);
      setSelectedPolicy(null);
      setRemainingValue(0);

      const companyEvent = {
        target: {
          name: "company_id",
          value: "",
        },
      };
      changed(companyEvent);
      setTotalCommission(0);
      availableCommission(0);
      setReleasedCommissions(0);
      setRealBalance(0);

      return;
    } else {
      changed(e);
    }

    const selectedPolicyObj = advisorId.policies.find(
      (policy) => String(policy.id) === String(selectedPolicyId)
    );
    if (selectedPolicyObj) {
      setSelectedPolicy(selectedPolicyObj);
      // 1. Calcula el total permitido para la póliza
      const commissionValue = calculateCommissionValue(selectedPolicyObj);
      const commissionsPaid = Array.isArray(
        selectedPolicyObj.commissionsPayments
      )
        ? selectedPolicyObj.commissionsPayments.reduce(
            (total, payment) => total + (Number(payment.advanceAmount) || 0),
            0
          )
        : 0;
      // 2. Comisiones liberadas (solo pagos AL DÍA)
      const released = calculateReleasedCommissions(selectedPolicyObj);

      // 3. Saldo real NUNCA puede superar el máximo permitido
      const maxLiberated = Math.min(released, commissionValue);
      const realBalance = Math.max(0, maxLiberated - commissionsPaid);

      //3: comisiones disponibles
      const available = Math.max(0, commissionValue - commissionsPaid);

      // 4. Al cambiar de póliza, el saldo después del registro ES el saldo real (acotado)
      setTotalCommission(commissionValue);
      availableCommission(available);
      setRemainingValue(realBalance);
      setReleasedCommissions(released);
      setRealBalance(realBalance);

      const companyId = selectedPolicyObj.company_id;
      const companyForPolicy = companies.filter(
        (company) => company.id === companyId
      );
      setFilteredCompanies(companyForPolicy);

      const companyEvent = {
        target: {
          name: "company_id",
          value: companyId,
        },
      };
      changed(companyEvent);
    }
  };

  // Función para manejar el cambio en el valor del anticipo
  const handleAdvanceValueChange = (e) => {
    const inputValue = e.target.value;
    const inputElement = document.getElementById("advanceValue");
    // Si el campo está vacío, establecemos el estado como una cadena vacía
    if (inputValue === "") {
      setAdvanceValue("");

      if (policy) {
        // Si no hay valor, el restante es igual al saldo pendiente real

        //setRemainingValue(availableCommissions);
        setRemainingValue(realBalance);
      }
      inputElement.setCustomValidity("");
    } else {
      // Si hay un valor, lo convertimos a número
      const value = parseFloat(inputValue);
      setAdvanceValue(value);

      if (policy) {
        // Calculamos el valor restante
        //const remaining = availableCommissions - value;
        const remaining = realBalance - value;
        setRemainingValue(remaining);

        // Validamos si el valor excede el total de comisiones
        const inputElement = document.getElementById("advanceValue");
        //   if (value > availableCommissions)
        if (
          value > releasedCommissions ||
          value > availableCommissions ||
          value > realBalance
        ) {
          inputElement.setCustomValidity("Valor excede al permitido");
        } else {
          inputElement.setCustomValidity("");
        }
      }
    }

    // Procesamos el cambio normalmente
    changed(e);
  };
  function distributeAmountAmongPolicies(totalAmount, policies) {
    let remaining = totalAmount;
    return policies.map((policy) => {
      const commissionValue = calculateCommissionValue(policy);
      const released = calculateReleasedCommissions(policy);
      const commissionsPaid = Array.isArray(policy.commissionsPayments)
        ? policy.commissionsPayments.reduce(
            (total, payment) => total + (Number(payment.advanceAmount) || 0),
            0
          )
        : 0;
      const maxLiberated = Math.min(released, commissionValue);
      const commissionAfavor = Math.max(0, maxLiberated - commissionsPaid);

      const toAssign = Math.min(commissionAfavor, remaining);
      remaining -= toAssign;

      return {
        policyId: policy.id,
        amount: toAssign,
      };
    });
  }
  // función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formElement = e.target;

    if (!formElement.checkValidity()) {
      e.stopPropagation();
      formElement.classList.add("was-validated");
      return;
    }

    try {
      // Distribuir el valor
      const distributed = distributeAmountAmongPolicies(
        Number(advanceValue),
        selectedPolicies
      ).filter((item) => item.amount > 0); // Solo los que reciben algo
      // Crear un objeto con los datos del formulario
      const formData = {
        ...form,
        policy_id: policy ? policy.id : null, // Asegurarse de incluir el ID de la póliza
        distributedCommissions: distributed,
      };

      const response = await http.post(
        "commissions-payments/register-commissions",
        formData
      );
      console.log("Respuesta del servidor:", response);

      if (response.data.status === "success") {
        if (typeof refreshAdvisor === "function") {
          await refreshAdvisor(); // Refresca el asesor y la tabla
        }
        alerts(
          "Registro exitoso",
          "Asesor registrado registrado correctamente",
          "success"
        );

        setTimeout(() => {
          document.querySelector("#user-form").reset();
          onClose();
        }, 500);
      } else {
        alerts(
          "Error",
          "Avance/anticipo no registrado correctamente. Verificar que no haya campos vacios o numeros de recibo duplicados",
          "error"
        );
      }
    } catch (error) {
      alerts("Error", "Error durante el registro", "error");
      console.error("Error fetching asesor:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto">
        <article className="modal-content text-center px-5 py-5">
          <div className="d-block conten-title-com rounded ">
            <h3 className="text-white fw-bold ">
              Registro de anticipio a : {advisorId.firstName}{" "}
              {advisorId.surname} {advisorId.secondSurname}{" "}
              {advisorId.secondSurname}
            </h3>
            {/* NUEVO: Selector de tipo de operación */}
            <div className="row pt-2"></div>
          </div>

          {/*Tabla múltiple de pólizas solo para COMISIÓN */}
          {operationType === "COMISION" && (
            <>
              {" "}
              (
              <div className="row pt-2">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>N° de póliza</th>
                      <th>Cliente </th>
                      <th>Frecuencia</th>
                      <th>Pagos por periodo/año</th>
                      <th>Comision por renovacion</th>
                      <th>Comisiones totales</th>
                      <th>Comisiones liberadas</th>
                      <th>Comisiones pagadas</th>
                      <th>
                        Saldo <span>(después del registro)</span>
                      </th>
                      <th>Comisiones a favor</th>
                      <th>Quitar</th> {/* NUEVO */}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPolicies.length === 0 ? (
                      <tr>
                        <td colSpan="10">No hay pólizas seleccionadas</td>
                      </tr>
                    ) : (
                      selectedPolicies.map((policy) => {
                        const {
                          commissionTotal,
                          releasedCommissions,
                          paidCommissions,
                          afterBalance,
                          favorCommissions,
                        } = getPolicyFields(policy);
                        return (
                          <tr key={policy.id}>
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
                            <th>
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
                            <td className="bg-info">
                              ${commissionTotal.toFixed(2)}
                            </td>
                            <td className="bg-warning">
                              ${releasedCommissions.toFixed(2)}
                            </td>
                            <td className="bg-primary text-white">
                              ${paidCommissions.toFixed(2)}
                            </td>
                            <td
                              className={
                                afterBalance < 0
                                  ? "bg-danger f text-white"
                                  : "bg-balance-color"
                              }
                            >
                              ${afterBalance.toFixed(2)}
                            </td>
                            <td className="bg-success-subtle">
                              ${favorCommissions.toFixed(2)}
                            </td>
                            <td>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => removePolicy(policy.id)}
                                title="Remove policy"
                              >
                                <FontAwesomeIcon icon={faRectangleXmark} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {/* NUEVO: Footer de sumatoria */}
                  <tfoot>
                    <tr>
                      <th colSpan="5">Totales</th>
                      <th className="bg-info">
                        ${globalTotals.commissionTotal.toFixed(2)}
                      </th>
                      <th className="bg-warning">
                        ${globalTotals.releasedCommissions.toFixed(2)}
                      </th>
                      <th className="bg-primary text-white">
                        ${globalTotals.paidCommissions.toFixed(2)}
                      </th>
                      <th
                        className={
                          globalTotals.afterBalance < 0
                            ? "bg-danger fw-bold text-white"
                            : "fw-bold bg-balance-color"
                        }
                      >
                        ${globalTotals.afterBalance.toFixed(2)}
                      </th>
                      <th className="bg-success-subtle">
                        ${globalTotals.favorCommissions.toFixed(2)}
                      </th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
          {/** */}

          <div className="d-flex justify-content-around mt-2">
            <form
              onSubmit={handleSubmit}
              id="user-form"
              className="needs-validation was-validated"
              noValidate
            >
              <div className="row">
                <div className="mb-4 d-none">
                  <label htmlFor="advisor_id" className="form-label">
                    Id Asesor
                  </label>
                  <input
                    required
                    type="number"
                    className="form-control"
                    id="advisor_id"
                    name="advisor_id"
                    onChange={changed}
                    value={advisorId.id}
                    readOnly
                  />
                </div>
                <div className="col-4 mx-auto">
                  <label className="form-label">Tipo de operación</label>
                  <select
                    className="form-select"
                    value={operationType}
                    onChange={(e) => setOperationType(e.target.value)}
                    required
                  >
                    <option value="">Selecciona una opción</option>
                    <option value="ANTICIPO">ANTICIPO</option>
                    <option value="COMISION">COMISIÓN</option>
                  </select>
                </div>
                {/** 
                <div className="mb-3 col-4">
                  <label htmlFor="policy_id" className="form-label">
                    Anticipio o comisión por póliza
                  </label>
                  <select
                    required
                    className="form-select"
                    id="policy_id"
                    name="policy_id"
                    onChange={handlePolicyChange}
                  >
                    <option disabled selected value={""}>
                      {option}
                    </option>
                    <option value="">Anticipio</option>
                    {Array.isArray(advisorId.policies) &&
                    advisorId.policies.length > 0 ? (
                      advisorId.policies
                        .filter((policy) => {
                          // Comisiones pagadas
                          const commissionsPaid = Array.isArray(
                            policy.commissionsPayments
                          )
                            ? policy.commissionsPayments.reduce(
                                (total, payment) =>
                                  total + (Number(payment.advanceAmount) || 0),
                                0
                              )
                            : 0;
                          // Comisiones totales
                          const commissionValue =
                            calculateCommissionValue(policy);
                          // Comisiones liberadas
                          const released = calculateReleasedCommissions(policy);
                          // Comisiones liberadas limitadas
                          const maxLiberated = Math.min(
                            released,
                            commissionValue
                          );
                          // Comisiones a favor
                          const commissionsAfavor = Math.max(
                            0,
                            maxLiberated - commissionsPaid
                          );

                          // Solo mostrar si hay comisiones a favor
                          return commissionsAfavor > 0;
                        })
                        .map((policy) => (
                          <option key={policy.id} value={policy.id}>
                            {policy.numberPolicy}
                          </option>
                        ))
                    ) : (
                      <option disabled>No hay pólizas disponibles</option>
                    )}
                  </select>
                </div>
                */}
                <div className="mb-3 col-4">
                  <label htmlFor="receiptNumber" className="form-label">
                    Número de Recibo
                  </label>
                  <input
                    required
                    onChange={changed}
                    id="receiptNumber"
                    type="string"
                    className="form-control"
                    name="receiptNumber"
                  />
                </div>
                <div className="mb-3 col-4">
                  <label htmlFor="company_id" className="form-label">
                    Compañía
                  </label>
                  <select
                    className="form-select"
                    id="company_id"
                    name="company_id"
                    onChange={changed}
                    defaultValue={option}
                    value={policy ? form.company_id || "" : ""}
                    disabled={!policy}
                  >
                    <option disabled value="">
                      {option}
                    </option>
                    {filteredCompanies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.companyName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3 col-4">
                  <label htmlFor="payment_method_id" className="form-label">
                    Metodo de abono
                  </label>
                  <select
                    className="form-select"
                    id="payment_method_id"
                    name="payment_method_id"
                    onChange={changed}
                    defaultValue={option}
                    required
                  >
                    <option disabled selected value={""}>
                      {option}
                    </option>
                    {paymentMethod.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.methodName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3 col-4">
                  <label htmlFor="advanceValue" className="form-label">
                    Valor del anticipio
                  </label>
                  <input
                    required
                    type="number"
                    className="form-control "
                    id="advanceValue"
                    name="advanceAmount"
                    step="0.01"
                    onChange={handleAdvanceValueChange}
                    value={advanceValue}
                  />
                  <div className="invalid-feedback">
                    La comisión es mayor que la comisión de la póliza
                    seleccionada o el campo está vacío
                  </div>
                </div>

                <div className="mb-3 col-4">
                  <label htmlFor="balance" className="form-label">
                    Fecha del anticipo
                  </label>
                  <input
                    required
                    type="date"
                    className="form-control"
                    id="createdAt"
                    name="createdAt"
                    onChange={changed}
                  />
                </div>

                <div className="mb-3 col-4">
                  <label htmlFor="observations" className="form-label">
                    Observaciones
                  </label>
                  <textarea
                    type="text"
                    className="form-control"
                    id="observations"
                    name="observations"
                    onChange={changed}
                  />
                </div>
                <div className="mt-4 col-12">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn bg-success fw-bold text-white "
                  >
                    {isLoading ? (
                      <div className="spinner-border text-light" role="status">
                        <span className="visually-hidden">Registrando...</span>
                      </div>
                    ) : (
                      "Registrar Comisión/Anticipo"
                    )}

                    <FontAwesomeIcon
                      className="mx-2 "
                      icon={faFloppyDisk}
                      beat
                    />
                  </button>
                  <button
                    type="button"
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
              </div>
            </form>
          </div>
        </article>
      </div>
    </>
  );
};

RegisterAdvanceModal.propTypes = {
  advisorId: PropTypes.shape({
    id: PropTypes.number.isRequired,
    firstName: PropTypes.string.isRequired,
    secondName: PropTypes.string,
    surname: PropTypes.string.isRequired,
    secondSurname: PropTypes.string,
    commissions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        receiptNumber: PropTypes.string.isRequired,
        company_id: PropTypes.number.isRequired,
        payment_method_id: PropTypes.number.isRequired,
        advanceAmount: PropTypes.number.isRequired,
        createdAt: PropTypes.string.isRequired,
        observations: PropTypes.string,
      })
    ),

    policies: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        numberPolicy: PropTypes.string.isRequired,
        payment_frequency_id: PropTypes.string.isRequired,
        numberOfPaymentsAdvisor: PropTypes.number.isRequired,
        paymentsToAdvisor: PropTypes.number.isRequired,
        renewalCommission: PropTypes.bool.isRequired,
        advisorPercentage: PropTypes.number.isRequired,
        agencyPercentage: PropTypes.number.isRequired,
        totalCommission: PropTypes.number.isRequired,
        company_id: PropTypes.number.isRequired,
        isCommissionAnnualized: PropTypes.bool.isRequired,
        commissionsPayments: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number.isRequired,
            receiptNumber: PropTypes.string.isRequired,
            company_id: PropTypes.number.isRequired,
            payment_method_id: PropTypes.number.isRequired,
            advanceAmount: PropTypes.number.isRequired,
            createdAt: PropTypes.string.isRequired,
            observations: PropTypes.string,
          })
        ),
        payments: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number.isRequired,
            paymentDate: PropTypes.string.isRequired,
            paymentAmount: PropTypes.number.isRequired,
            paymentStatus: PropTypes.shape({
              id: PropTypes.number.isRequired,
              statusName: PropTypes.string.isRequired,
            }),
          })
        ),
        customer: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number.isRequired,
            firstName: PropTypes.string.isRequired,
            secondName: PropTypes.string,
            surname: PropTypes.string.isRequired,
            secondSurname: PropTypes.string,
          })
        ),
      })
    ),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  refreshAdvisor: PropTypes.func.isRequired,
};
export default RegisterAdvanceModal;
/*VERSION 2*/
import PropTypes from "prop-types";
import { useEffect, useRef, useState, useCallback } from "react";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import http from "../../helpers/Http";
import UserForm from "../../hooks/UserForm";
import alerts from "../../helpers/Alerts";
import {
  saveSelectedPolicies,
  loadSelectedPolicies,
} from "../../helpers/localStorageUtils";
import {
  calculateCommissionValue,
  calculateReleasedCommissions,
} from "../../helpers/CommissionUtils";
const RegisterAdvanceModal = ({ advisorId, onClose, refreshAdvisor }) => {
  if (!advisorId) {
    console.error("advisorId es undefined en RegisterAdvanceModal");
    return null;
  }
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState([]);
  const [advanceValue, setAdvanceValue] = useState();
  const { form, changed } = UserForm({
    advisor_id: advisorId.id,
    policy_id: advisorId.policies.id || null,
    advanceAmount: "",
  });

  const [operationType, setOperationType] = useState(""); // ANTICIPO o COMISION
  const [selectedPolicies, setSelectedPolicies] = useState([]); // array de polizas seleccionadas
  const advanceValueRef = useRef(null);
  

  useEffect(() => {
    // NUEVO: Cargar selección previa de localStorage
    if (advisorId?.id) {
      const prev = loadSelectedPolicies(advisorId.id);
      if (prev) setSelectedPolicies(prev);
    }
  }, [advisorId]);

  //  Actualizar localStorage cuando cambia la selección
  useEffect(() => {
    if (advisorId?.id) saveSelectedPolicies(advisorId.id, selectedPolicies);
  }, [selectedPolicies, advisorId]);

  // Cuando se selecciona 'COMISION', cargar todas las pólizas liberadas
  useEffect(() => {
    if (operationType === "COMISION" && Array.isArray(advisorId.policies)) {
      const releasedPolicies = advisorId.policies.filter((policy) => {
        // Cálculos SOLO de la póliza
        const released = calculateReleasedCommissions(policy);
        const total = calculateCommissionValue(policy);
        const paid = Array.isArray(policy.commissionsPayments)
          ? policy.commissionsPayments.reduce(
              (sum, payment) => sum + (Number(payment.advanceAmount) || 0),
              0
            )
          : 0;
        const maxReleased = Math.min(released, total);
        const balance = maxReleased - paid;
        return balance > 0; // Solo pólizas con saldo a favor
      });
      setSelectedPolicies(releasedPolicies);
    }
    if (operationType === "ANTICIPO") {
      setSelectedPolicies([]); // Limpiar para anticipos
    }
  }, [operationType, advisorId]);

  // Cálculo de totales  de todas las polizas
  const getPolicyFields = (policy) => {
    const commissionTotal = calculateCommissionValue(policy);
    const releasedCommissions = calculateReleasedCommissions(policy);
    const paidCommissions = Array.isArray(policy.commissionsPayments)
      ? policy.commissionsPayments.reduce(
          (sum, p) => sum + (Number(p.advanceAmount) || 0),
          0
        )
      : 0;
    const maxReleased = Math.min(releasedCommissions, commissionTotal);
    const afterBalance = maxReleased - paidCommissions;
    return {
      commissionTotal,
      releasedCommissions: maxReleased,
      paidCommissions,
      afterBalance,
      favorCommissions: afterBalance, // si tienes otra lógica, cámbiala aquí
    };
  };
  // Quitar póliza de la lista
  const removePolicy = (policyId) => {
    setSelectedPolicies(
      selectedPolicies.filter((policy) => policy.id !== policyId)
    );
  };

  //Sumatorias globales (solo para COMISION) + Calcula el saldo después del registro RESTANDO el anticipo
  const getTotals = (policies, advanceValue = 0) => {
    // Suma los campos de cada póliza
    const totals = policies.reduce(
      (acc, policy) => {
        const f = getPolicyFields(policy);
        acc.commissionTotal += f.commissionTotal;
        acc.releasedCommissions += f.releasedCommissions;
        acc.paidCommissions += f.paidCommissions;
        acc.afterBalance += f.afterBalance;
        acc.favorCommissions += f.favorCommissions;
        return acc;
      },
      {
        commissionTotal: 0,
        releasedCommissions: 0,
        paidCommissions: 0,
        afterBalance: 0,
        favorCommissions: 0,
      }
    );
    // Aplica la resta SOLO si se está trabajando en modo COMISION
    if (operationType === "COMISION" && policies.length > 0 && advanceValue) {
      totals.afterBalance -= Number(advanceValue);
    }
    return totals;
  };

  const option = "Escoja una opción";

  // Suma simple de todos los anticipos del asesor (no por póliza)
  const getAdvisorTotalAdvances = (advisor) =>
    advisor && advisor.commissions
      ? advisor.commissions.reduce(
          (sum, advance) => sum + (Number(advance.advanceAmount) || 0),
          0
        )
      : 0;

  const advisorTotalAdvances = getAdvisorTotalAdvances(advisorId);

  // Totales globales (sin descontar anticipos aún)
  const globalTotals = getTotals(selectedPolicies);

  // Ajustamos el saldo después del registro (restando anticipos del asesor)
  //const afterBalanceGlobal = globalTotals.afterBalance - advisorTotalAdvances;
  const afterBalanceGlobal =
    globalTotals.afterBalance -
    (Number(advanceValue) || 0) -
    advisorTotalAdvances;

  // Comisiones a favor (también descuenta anticipos del asesor)
  const commissionsFavorTotal =
    globalTotals.favorCommissions - advisorTotalAdvances;

  // Colores para celdas
  const afterBalanceClass =
    afterBalanceGlobal < 0
      ? "bg-danger fw-bold text-white"
      : "fw-bold bg-balance-color";

  const commissionsFavorTotalClass =
    commissionsFavorTotal < 0
      ? "bg-danger fw-bold text-white"
      : "bg-success-subtle";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [paymentMethodResponse] = await Promise.all([
          http.get("policy/get-payment-method"),
        ]);
        setPaymentMethod(paymentMethodResponse.data.allPaymentMethod);
      } catch (error) {
        //alerts("Error", "Error fetching data.", error);
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Función para manejar el cambio en el valor del anticipo
  const handleAdvanceValueChange = (e) => {
    const inputValue = e.target.value;
    const inputElement = advanceValueRef.current;

    // Calcula el saldo global después del anticipo
    const globalAfterBalance = getTotals(
      selectedPolicies,
      inputValue
    ).afterBalance;

    if (inputValue === "") {
      setAdvanceValue("");
      inputElement.setCustomValidity("");
    } else {
      const value = parseFloat(inputValue);
      setAdvanceValue(value);

      // Bloquea si el resultado global queda negativo
      if (globalAfterBalance < 0) {
        inputElement.setCustomValidity(
          "El anticipo excede el saldo global a favor."
        );
      } else {
        inputElement.setCustomValidity("");
      }
    }

    changed(e);
  };

  // función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formElement = e.target;

    if (!formElement.checkValidity()) {
      e.stopPropagation();
      formElement.classList.add("was-validated");
      return;
    }

    try {
      // Crear un objeto con los datos del formulario
      const formData = {
        ...form,
        //policy_id: policy ? policy.id : null, // Asegurarse de incluir el ID de la póliza
      };

      const response = await http.post(
        "commissions-payments/register-commissions",
        formData
      );
      console.log("Respuesta del servidor:", response);

      if (response.data.status === "success") {
        if (typeof refreshAdvisor === "function") {
          await refreshAdvisor(); // Refresca el asesor y la tabla
        }
        alerts(
          "Registro exitoso",
          "Asesor registrado registrado correctamente",
          "success"
        );
        localStorage.removeItem(`selectedPolicies_${advisorId.id}`);

        setTimeout(() => {
          document.querySelector("#user-form").reset();
          onClose();
        }, 500);
      } else {
        alerts(
          "Error",
          "Avance/anticipo no registrado correctamente. Verificar que no haya campos vacios o numeros de recibo duplicados",
          "error"
        );
      }
    } catch (error) {
      alerts("Error", "Error durante el registro", "error");
      console.error("Error fetching asesor:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="modal d-flex justify-content-center align-items-center mx-auto">
        <article className="modal-content text-center px-5 py-5">
          <div className="d-block conten-title-com rounded ">
            <h3 className="text-white fw-bold ">
              Registro de anticipio a : {advisorId.firstName}{" "}
              {advisorId.surname} {advisorId.secondSurname}{" "}
              {advisorId.secondSurname}
            </h3>
            {/* NUEVO: Selector de tipo de operación */}
            <div className="row pt-2"></div>
          </div>

          {/*Tabla múltiple de pólizas solo para COMISIÓN */}
          {operationType === "COMISION" && (
            <>
              <div className="row pt-2">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>N° de póliza</th>
                      <th>Cliente </th>
                      <th>Frecuencia</th>
                      <th>Pagos por periodo/año</th>
                      <th>Comision por renovacion</th>
                      <th>Comisiones totales</th>
                      <th>Comisiones liberadas</th>
                      <th>Comisiones pagadas</th>
                      <th>
                        Saldo <span>(después del registro)</span>
                      </th>
                      <th>Comisiones a favor</th>
                      <th>Quitar</th> {/* NUEVO */}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPolicies.length === 0 ? (
                      <tr>
                        <td colSpan="10">No hay pólizas seleccionadas</td>
                      </tr>
                    ) : (
                      selectedPolicies.map((policy) => {
                        const {
                          commissionTotal,
                          releasedCommissions,
                          paidCommissions,
                          afterBalance,
                          favorCommissions,
                        } = getPolicyFields(policy);
                        return (
                          <tr key={policy.id}>
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
                            <th>
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
                            <td className="bg-info">
                              ${commissionTotal.toFixed(2)}
                            </td>
                            <td className="bg-warning">
                              ${releasedCommissions.toFixed(2)}
                            </td>
                            <td className="bg-primary text-white">
                              ${paidCommissions.toFixed(2)}
                            </td>
                            <td
                              className={
                                afterBalance < 0
                                  ? "bg-danger f text-white"
                                  : "bg-balance-color"
                              }
                            >
                              ${afterBalance.toFixed(2)}
                            </td>
                            <td className="bg-success-subtle">
                              ${favorCommissions.toFixed(2)}
                            </td>
                            <td>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => removePolicy(policy.id)}
                                title="Remove policy"
                              >
                                <FontAwesomeIcon icon={faRectangleXmark} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {/* Footer de sumatoria */}
                  <tfoot>
                    <tr>
                      <th colSpan="3">Totales</th>
                      <th colSpan="1" className="text-end">
                        Total de anticipos:
                      </th>
                      <th className="bg-warning">
                        ${advisorTotalAdvances.toFixed(2)}
                      </th>
                      <th className="bg-info">
                        ${globalTotals.commissionTotal.toFixed(2)}
                      </th>

                      <th className="bg-warning">
                        ${globalTotals.releasedCommissions.toFixed(2)}
                      </th>
                      <th className="bg-primary text-white">
                        ${globalTotals.paidCommissions.toFixed(2)}
                      </th>
                      <th className={afterBalanceClass}>
                        ${afterBalanceGlobal.toFixed(2)}
                      </th>
                      <th className={commissionsFavorTotalClass}>
                        ${commissionsFavorTotal.toFixed(2)}
                      </th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}

          <div className="d-flex justify-content-around mt-2">
            <form
              onSubmit={handleSubmit}
              id="user-form"
              className="needs-validation was-validated"
              noValidate
            >
              <div className="row">
                <div className="mb-4 d-none">
                  <label htmlFor="advisor_id" className="form-label">
                    Id Asesor
                  </label>
                  <input
                    required
                    type="number"
                    className="form-control"
                    id="advisor_id"
                    name="advisor_id"
                    onChange={changed}
                    value={advisorId.id}
                    readOnly
                  />
                </div>
                
                <div className="col-4 mx-auto">
                  <label className="form-label">Tipo de operación</label>
                  <select
                    className="form-select"
                    value={operationType}
                    onChange={(e) => setOperationType(e.target.value)}
                    required
                  >
                    <option value="">Selecciona una opción</option>
                    <option value="ANTICIPO">ANTICIPO</option>
                    <option value="COMISION">COMISIÓN</option>
                  </select>
                </div>

                <div className="mb-3 col-4">
                  <label htmlFor="receiptNumber" className="form-label">
                    Número de Recibo
                  </label>
                  <input
                    required
                    onChange={changed}
                    id="receiptNumber"
                    type="string"
                    className="form-control"
                    name="receiptNumber"
                  />
                </div>

                <div className="mb-3 col-4">
                  <label htmlFor="payment_method_id" className="form-label">
                    Metodo de abono
                  </label>
                  <select
                    className="form-select"
                    id="payment_method_id"
                    name="payment_method_id"
                    onChange={changed}
                    defaultValue={option}
                    required
                  >
                    <option disabled selected value={""}>
                      {option}
                    </option>
                    {paymentMethod.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.methodName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3 col-4">
                  <label htmlFor="advanceValue" className="form-label">
                    Valor del anticipio
                  </label>
                  <input
                    ref={advanceValueRef}
                    required
                    type="number"
                    className="form-control "
                    id="advanceAmount"
                    name="advanceAmount"
                    step="0.01"
                    onChange={handleAdvanceValueChange}
                    value={advanceValue}
                  />
                  <div className="invalid-feedback">
                    La comisión es mayor que la comisión de la póliza
                    seleccionada o el campo está vacío
                  </div>
                </div>

                <div className="mb-3 col-4">
                  <label htmlFor="balance" className="form-label">
                    Fecha del anticipo
                  </label>
                  <input
                    required
                    type="date"
                    className="form-control"
                    id="createdAt"
                    name="createdAt"
                    onChange={changed}
                  />
                </div>

                <div className="mb-3 col-4">
                  <label htmlFor="observations" className="form-label">
                    Observaciones
                  </label>
                  <textarea
                    type="text"
                    className="form-control"
                    id="observations"
                    name="observations"
                    onChange={changed}
                  />
                </div>
                <div className="mt-4 col-12">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn bg-success fw-bold text-white "
                  >
                    {isLoading ? (
                      <div className="spinner-border text-light" role="status">
                        <span className="visually-hidden">Registrando...</span>
                      </div>
                    ) : (
                      "Registrar Comisión/Anticipo"
                    )}

                    <FontAwesomeIcon
                      className="mx-2 "
                      icon={faFloppyDisk}
                      beat
                    />
                  </button>
                  <button
                    type="button"
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
              </div>
            </form>
          </div>
        </article>
      </div>
    </>
  );
};

RegisterAdvanceModal.propTypes = {
  advisorId: PropTypes.shape({
    id: PropTypes.number.isRequired,
    firstName: PropTypes.string.isRequired,
    secondName: PropTypes.string,
    surname: PropTypes.string.isRequired,
    secondSurname: PropTypes.string,
    commissions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        receiptNumber: PropTypes.string.isRequired,
        company_id: PropTypes.number.isRequired,
        payment_method_id: PropTypes.number.isRequired,
        advanceAmount: PropTypes.number.isRequired,
        createdAt: PropTypes.string.isRequired,
        observations: PropTypes.string,
      })
    ),

    policies: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        numberPolicy: PropTypes.string.isRequired,
        payment_frequency_id: PropTypes.string.isRequired,
        numberOfPaymentsAdvisor: PropTypes.number.isRequired,
        paymentsToAdvisor: PropTypes.number.isRequired,
        renewalCommission: PropTypes.bool.isRequired,
        advisorPercentage: PropTypes.number.isRequired,
        agencyPercentage: PropTypes.number.isRequired,
        totalCommission: PropTypes.number.isRequired,
        company_id: PropTypes.number.isRequired,
        isCommissionAnnualized: PropTypes.bool.isRequired,
        commissionsPayments: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number.isRequired,
            receiptNumber: PropTypes.string.isRequired,
            company_id: PropTypes.number.isRequired,
            payment_method_id: PropTypes.number.isRequired,
            advanceAmount: PropTypes.number.isRequired,
            createdAt: PropTypes.string.isRequired,
            observations: PropTypes.string,
          })
        ),
        payments: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number.isRequired,
            paymentDate: PropTypes.string.isRequired,
            paymentAmount: PropTypes.number.isRequired,
            paymentStatus: PropTypes.shape({
              id: PropTypes.number.isRequired,
              statusName: PropTypes.string.isRequired,
            }),
          })
        ),
        customer: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number.isRequired,
            firstName: PropTypes.string.isRequired,
            secondName: PropTypes.string,
            surname: PropTypes.string.isRequired,
            secondSurname: PropTypes.string,
          })
        ),
      })
    ),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  refreshAdvisor: PropTypes.func.isRequired,
};
export default RegisterAdvanceModal;
