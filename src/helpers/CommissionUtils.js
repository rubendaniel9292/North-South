// Comisión de asesor/agencia por periodo (teórico, por periodo)
export const calculateAdvisorCommissionPerPeriod = (period) => {
  if (!period) return 0;
  const policyValue = Number(period.policyValue ?? period.policy_value ?? 0);
  const policyFee = Number(period.policyFee ?? period.policy_fee ?? 0);
  const advisorPercentage = Number(
    period.advisorPercentage ?? period.advisor_percentage ?? 0
  );
  return ((policyValue - policyFee) * advisorPercentage) / 100;
};
/*
export const calculateAgencyCommissionPerPeriod = (period) => {
  if (!period) return 0;
  const policyValue = Number(period.policyValue ?? period.policy_value ?? 0);
  const policyFee = Number(period.policyFee ?? period.policy_fee ?? 0);
  const agencyPercentage = Number(
    period.agencyPercentage ?? period.agency_percentage ?? 0
  );
  return ((policyValue - policyFee) * agencyPercentage) / 100;
};
*/

// Comisión por pagos generados (pagos existentes, no teórica)
export const getAdvisorCommissionForPayment = (payment, policy) => {
  let period = null;
  if (payment.year) {
    period = policy.periods?.find(
      (p) => Number(p.year) === Number(payment.year)
    );
  }
  if (!period && payment.periodId) {
    period = policy.periods?.find((p) => p.id === payment.periodId);
  }
  if (!period && policy.periods?.length) {
    period = policy.periods[policy.periods.length - 1];
  }
  if (!period) return 0;
  const policyValue = Number(period.policyValue ?? period.policy_value ?? 0);
  const policyFee = Number(period.policyFee ?? period.policy_fee ?? 0);
  const advisorPercentage = Number(
    period.advisorPercentage ?? period.advisor_percentage ?? 0
  );
  const numPayments = Number(
    period.numberOfPaymentsAdvisor ?? policy.numberOfPaymentsAdvisor ?? 1
  );
  return ((policyValue - policyFee) * advisorPercentage) / 100 / numPayments;
};
/*
export const getAgencyCommissionForPayment = (payment, policy) => {
  let period = null;
  if (payment.year) {
    period = policy.periods?.find(
      (p) => Number(p.year) === Number(payment.year)
    );
  }
  if (!period && payment.periodId) {
    period = policy.periods?.find((p) => p.id === payment.periodId);
  }
  if (!period && policy.periods?.length) {
    period = policy.periods[policy.periods.length - 1];
  }
  if (!period) return 0;
  const policyValue = Number(period.policyValue ?? period.policy_value ?? 0);
  const policyFee = Number(period.policyFee ?? period.policy_fee ?? 0);
  const agencyPercentage = Number(
    period.agencyPercentage ?? period.agency_percentage ?? 0
  );
  const numPayments = Number(
    period.numberOfPaymentsAdvisor ?? policy.numberOfPaymentsAdvisor ?? 1
  );
  return ((policyValue - policyFee) * agencyPercentage) / 100 / numPayments;
};
*/
// Comisión total generada (solo pagos creados)
export const calculateTotalAdvisorCommissionsGenerated = (policy) => {
  if (!policy || !Array.isArray(policy.payments)) return 0;
  return policy.payments.reduce(
    (total, payment) => total + getAdvisorCommissionForPayment(payment, policy),
    0
  );
};
/*
export const calculateTotalAgencyCommissionsGenerated = (policy) => {
  if (!policy || !Array.isArray(policy.payments)) return 0;
  return policy.payments.reduce(
    (total, payment) => total + getAgencyCommissionForPayment(payment, policy),
    0
  );
};
*/
// Comisión liberada: solo pagos creados y liberados (AL DÍA)
export const calculateReleasedCommissionsGenerated = (policy) => {
  if (!policy || !Array.isArray(policy.payments)) return 0;
  return policy.payments
    .filter((payment) => payment.paymentStatus && payment.paymentStatus.id == 2)
    .reduce(
      (total, payment) =>
        total + getAdvisorCommissionForPayment(payment, policy),
      0
    );
};
/*
export const calculateReleasedAgencyCommissionsGenerated = (policy) => {
  if (!policy || !Array.isArray(policy.payments)) return 0;
  return policy.payments
    .filter((payment) => payment.paymentStatus && payment.paymentStatus.id == 2)
    .reduce(
      (total, payment) =>
        total + getAgencyCommissionForPayment(payment, policy),
      0
    );
};
*/
// Suma simple de todos los anticipos del asesor (no por póliza)
export const getAdvisorTotalAdvances = (advisor) =>
  advisor && advisor.commissions
    ? advisor.commissions
        .filter(
          (advance) =>
            (advance.policy_id === null || advance.policy_id === undefined) &&
            (String(advance.status_advance_id) === "1" ||
              (advance.statusAdvance &&
                String(advance.statusAdvance.id) === "1"))
        )
        .reduce((sum, advance) => sum + Number(advance.advanceAmount || 0), 0)
    : 0;

// Reparte anticipo histórico entre las pólizas
export const applyHistoricalAdvance = (policies, totalAdvance) => {
  const sortedPolicies = [...policies]
    .map((policy) => {
      const released = calculateReleasedCommissionsGenerated(policy);
      const paid = Array.isArray(policy.commissions)
        ? policy.commissions.reduce(
            (sum, p) => sum + (Number(p.advanceAmount) || 0),
            0
          )
        : 0;
      const totalCommission = calculateTotalAdvisorCommissionsGenerated(policy);
      return {
        ...policy,
        released,
        paid,
        commissionInFavor: released - paid,
        totalCommission,
      };
    })
    .sort((a, b) => b.commissionInFavor - a.commissionInFavor);

  let remaining = totalAdvance;
  return sortedPolicies.map((policy) => {
    let appliedHistoricalAdvance = 0;
    if (remaining > 0 && policy.commissionInFavor > 0) {
      appliedHistoricalAdvance = Math.min(policy.commissionInFavor, remaining);
      remaining -= appliedHistoricalAdvance;
    }
    const newCommissionInFavor =
      policy.commissionInFavor - appliedHistoricalAdvance;
    return {
      ...policy,
      commissionInFavor: newCommissionInFavor,
      appliedHistoricalAdvance,
    };
  });
};

// Distribuye el anticipo entre las pólizas según saldo a favor
export const distributeAdvance = (policies, advanceAmount) => {
  const sortedPolicies = [...policies].sort(
    (a, b) => b.commissionInFavor - a.commissionInFavor
  );
  let remainingAdvance = Number(advanceAmount) || 0;

  return sortedPolicies.map((policy) => {
    let advanceApplied = 0;
    if (remainingAdvance > 0 && policy.commissionInFavor > 0) {
      advanceApplied = Math.min(policy.commissionInFavor, remainingAdvance);
      remainingAdvance -= advanceApplied;
    }
    const afterBalance = policy.commissionInFavor - advanceApplied;
    return { ...policy, advanceApplied, afterBalance };
  });
};

// Helper principal para mostrar campos principales
export const getPolicyFields = (policy) => {
  const refundsAmount = (policy.commissionRefunds || []).reduce(
    (acc, curr) => acc + Number(curr.amountRefunds || 0),
    0
  );
  const commissionTotal = calculateTotalAdvisorCommissionsGenerated(policy);
  const released = calculateReleasedCommissionsGenerated(policy);
  const releasedNet = released - refundsAmount;

  const paid = Array.isArray(policy.commissions)
    ? policy.commissions.reduce(
        (sum, p) => sum + (Number(p.advanceAmount) || 0),
        0
      )
    : 0;

  const appliedHistoricalAdvance = policy.appliedHistoricalAdvance || 0;
  const afterBalance = releasedNet - paid - appliedHistoricalAdvance;
  const commissionInFavor = Math.max(afterBalance, 0);

  return {
    commissionTotal, // suma solo pagos creados (no futuros)
    released,
    paid,
    appliedHistoricalAdvance,
    refundsAmount,
    afterBalance,
    commissionInFavor,
  };
};

// Sumatorias globales (solo para COMISION)
export const getTotals = (policies, advanceValue = 0, operationType = "") => {
  const totals = policies.reduce(
    (acc, policy) => {
      const f = getPolicyFields(policy);
      acc.commissionTotal += f.commissionTotal;
      acc.released += f.released;
      acc.paid += f.paid;
      acc.appliedHistoricalAdvance += f.appliedHistoricalAdvance;
      acc.refundsAmount += f.refundsAmount;
      acc.afterBalance += f.afterBalance;
      acc.commissionInFavor += f.commissionInFavor;
      return acc;
    },
    {
      commissionTotal: 0,
      released: 0,
      paid: 0,
      appliedHistoricalAdvance: 0,
      refundsAmount: 0,
      afterBalance: 0,
      commissionInFavor: 0,
    }
  );
  if (operationType === "COMISION" && policies.length > 0 && advanceValue) {
    totals.afterBalance -= Number(advanceValue);
  }
  return totals;
};

// Cálculo simple de comisiones por valores puntuales

export const calculateAdvisorAndAgencyPayments = (
  policyValue,
  policyFee,
  percentageAgency,
  percentageAdvisor
) => {
  const value = Number(policyValue) - Number(policyFee);
  const paymentAgency = (value * Number(percentageAgency)) / 100;
  const paymentAdvisor = (value * Number(percentageAdvisor)) / 100;
  const paymentsToAgency = paymentAgency - paymentAdvisor;
  return {
    paymentsToAgency: Number(paymentsToAgency.toFixed(2)),
    paymentsToAdvisor: Number(paymentAdvisor.toFixed(2)),
  };
};
