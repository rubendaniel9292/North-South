//HELPER 1: CALCULATE COMMISSION VALUE
export const calculateCommissionValue = (policy) => {
  if (!policy) return 0;

  if (!policy.renewalCommission) {
    return Number(policy.paymentsToAdvisor) || 0;
  }

  if (policy.isCommissionAnnualized === true) {
    const numPeriodos =
      1 + (Array.isArray(policy.renewals) ? policy.renewals.length : 0);
    return numPeriodos * (Number(policy.paymentsToAdvisor) || 0);
  } else {
    let totalPagos = Array.isArray(policy.payments)
      ? policy.payments.length
      : 0;
    if (Array.isArray(policy.renewals)) {
      for (const renewal of policy.renewals) {
        if (Array.isArray(renewal.payments)) {
          totalPagos += renewal.payments.length;
        }
      }
    }
    const perPayment =
      Number(policy.paymentsToAdvisor) /
      Number(policy.numberOfPaymentsAdvisor || 1);
    return perPayment * totalPagos;
  }
};

//ELPER 2: CALCULATE RELEASED COMMISSIONS
export const calculateReleasedCommissions = (policy) => {
  if (!policy) return 0;

  // PÓLIZA ANUALIZADA (con o sin comisión por renovación)
  if (policy.isCommissionAnnualized === true) {
    const numPeriodos =
      1 + (Array.isArray(policy.renewals) ? policy.renewals.length : 0);
    return Number(policy.paymentsToAdvisor || 0) * numPeriodos;
  }

  // PÓLIZA NORMAL (no anualizada)
  const advisorPercentage = Number(policy.advisorPercentage || 0) / 100;
  let total = 0;
  if (Array.isArray(policy.payments)) {
    const releasedPayments = policy.payments.filter(
      (payment) => payment.paymentStatus && payment.paymentStatus.id == 2
    );
    total += releasedPayments.reduce(
      (sum, payment) => sum + Number(payment.value || 0) * advisorPercentage,
      0
    );
  }
  if (Array.isArray(policy.renewals)) {
    for (const renewal of policy.renewals) {
      if (Array.isArray(renewal.payments)) {
        const releasedPayments = renewal.payments.filter(
          (payment) => payment.paymentStatus && payment.paymentStatus.id == 2
        );
        total += releasedPayments.reduce(
          (sum, payment) =>
            sum + Number(payment.value || 0) * advisorPercentage,
          0
        );
      }
    }
  }
  return total;
};

// 3: Suma simple de todos los anticipos del asesor (no por póliza)

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

// 4. Reparte el anticipo histórico entre las pólizas, de arriba hacia abajo
export const applyHistoricalAdvance = (policies, totalAdvance) => {
  // Ordena por commissionInFavor de mayor a menor
  const sortedPolicies = [...policies]
    .map((policy) => {
      const released = calculateReleasedCommissions(policy);
      const paid = Array.isArray(policy.commissions)
        ? policy.commissions.reduce(
            (sum, p) => sum + (Number(p.advanceAmount) || 0),
            0
          )
        : 0;
      const totalCommission = calculateCommissionValue(policy); // <--- ¡AQUÍ!
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
    // El saldo a favor después de aplicar el anticipo histórico:
    const newCommissionInFavor =
      policy.commissionInFavor - appliedHistoricalAdvance;
    return {
      ...policy,
      commissionInFavor: newCommissionInFavor,
      appliedHistoricalAdvance,
      // totalCommission ya viene copiado
    };
  });
};

//5:
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

// Para totales globales
export const getPolicyFields = (policy) => {
  // Suma de reembolsos
  const refundsAmount = (policy.commissionRefunds || []).reduce(
    (acc, curr) => acc + Number(curr.amountRefunds || 0),
    0
  );
  // Comisiones liberadas netas
  const commissionTotal = calculateCommissionValue(policy); // total comisión posible de la póliza
  const released = calculateReleasedCommissions(policy); // comisiones liberadas brutas (sin restar reembolsos)
  const releasedNet = released - refundsAmount;

  const paid = Array.isArray(policy.commissionsPayments)
    ? policy.commissionsPayments.reduce(
        (sum, p) => sum + (Number(p.advanceAmount) || 0),
        0
      )
    : 0;

  const appliedHistoricalAdvance = policy.appliedHistoricalAdvance || 0; // si tienes este campo aparte
  const afterBalance = releasedNet - paid - appliedHistoricalAdvance;
  const commissionInFavor = Math.max(afterBalance, 0);

  return {
    commissionTotal,
    released: released,
    paid,
    appliedHistoricalAdvance,
    refundsAmount,
    afterBalance,
    commissionInFavor,
  
  };
};

//Sumatorias globales (solo para COMISION)
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
  // Si tienes lógica de anticipo global, aplícala acá si es necesario
  if (operationType === "COMISION" && policies.length > 0 && advanceValue) {
    totals.afterBalance -= Number(advanceValue);
  }
  return totals;
};
