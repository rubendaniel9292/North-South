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

/**
 * Sequentially applies a general advance (anticipo) to released commissions across policies.
 * @param {Array} policies - Array of policy objects (each should include commissions array).
 * @param {number} totalAdvance - Total unapplied general advance for the advisor.
 * @returns {Array} Array of policies, each with 'realFavorCommission' and 'appliedAdvance' fields.
 */
export function calculateRealFavorCommissionByPolicy(policies, totalAdvance) {
  let remainingAdvance = totalAdvance;
  return policies.map((policy) => {
    // Released and total commissions
    const released = calculateReleasedCommissions(policy);
    const total = calculateCommissionValue(policy);
    // Sum of all paid commissions for this policy
    const paid = Array.isArray(policy.commissions)
      ? policy.commissions.reduce(
          (sum, payment) => sum + (Number(payment.advanceAmount) || 0),
          0
        )
      : 0;

    // Max released commission (cannot exceed total commission)
    const maxReleased = Math.min(released, total);
    // Pending commission before applying advance
    let pending = maxReleased - paid;

    // Apply advance if any pending commission and advance left
    let appliedAdvance = 0;
    if (remainingAdvance > 0 && pending > 0) {
      appliedAdvance = Math.min(remainingAdvance, pending);
      pending -= appliedAdvance;
      remainingAdvance -= appliedAdvance;
    }
    // The real favor commission can't be negative
    return {
      ...policy,
      realFavorCommission: pending > 0 ? pending : 0,
      appliedAdvance,
    };
  });
}
