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

// Calcula comisión de agencia por periodo
export const calculateAgencyCommissionPerPeriod = (period) => {
  if (!period) return 0;
  const policyValue = Number(period.policyValue ?? period.policy_value ?? 0);
  const policyFee = Number(period.policyFee ?? period.policy_fee ?? 0);
  const agencyPercentage = Number(
    period.agencyPercentage ?? period.agency_percentage ?? 0
  );
  return ((policyValue - policyFee) * agencyPercentage) / 100;
};

// Suma total de comisiones de asesor en todos los pagos generados (por periodo)

export const calculateTotalAdvisorCommissionAllPeriods = (policy) => {
  if (!policy || !Array.isArray(policy.periods)) return 0;
  let total = 0;
  for (const period of policy.periods) {
    // Busca cuántos pagos existen para este periodo por fecha
    const paymentsInPeriod =
      policy.payments?.filter((p) => {
        if (p.createdAt) {
          const paymentYear = new Date(p.createdAt).getFullYear();
          return Number(paymentYear) === Number(period.year);
        }
        // Fallback: usar campo year si existe
        return Number(p.year) === Number(period.year);
      }) || [];

    // Usa solo los pagos que realmente existen para este periodo
    const numberOfPayments = paymentsInPeriod.length;

    // Solo suma comisiones si hay pagos generados para este periodo
    if (numberOfPayments > 0) {
      const commissionPerPayment =
        ((Number(period.policyValue) - Number(period.policyFee)) *
          Number(period.advisorPercentage)) /
        100 /
        (period.numberOfPaymentsAdvisor || 1);
      total += commissionPerPayment * numberOfPayments;
    }
  }
  return total;
};
// Suma total de comisiones de agencia en todos los periodos

export const calculateTotalAgencyCommissionAllPeriods = (policy) => {
  if (!policy || !Array.isArray(policy.periods)) return 0;
  let total = 0;
  for (const period of policy.periods) {
    // Busca cuántos pagos existen para este periodo por fecha
    const paymentsInPeriod =
      policy.payments?.filter((p) => {
        if (p.createdAt) {
          const paymentYear = new Date(p.createdAt).getFullYear();
          return Number(paymentYear) === Number(period.year);
        }
        // Fallback: usar campo year si existe
        return Number(p.year) === Number(period.year);
      }) || [];

    // Usa solo los pagos que realmente existen para este periodo
    const numberOfPayments = paymentsInPeriod.length;

    // Solo suma comisiones si hay pagos generados para este periodo
    if (numberOfPayments > 0) {
      const commissionPerPayment =
        ((Number(period.policyValue) - Number(period.policyFee)) *
          Number(period.agencyPercentage)) /
        100 /
        (period.numberOfPaymentsAdvisor || 1);
      total += commissionPerPayment * numberOfPayments;
    }
  }
  return total;
};

// Calcula la comisión de asesor para un pago, usando el periodo específico
export const getAdvisorCommissionForPayment = (payment, policy) => {
  // Busca el periodo del pago por fecha de creación
  let period = null;
  if (payment.createdAt) {
    const paymentYear = new Date(payment.createdAt).getFullYear();
    period = policy.periods?.find((p) => Number(p.year) === paymentYear);
  }

  // Fallback: buscar por year si existe en el pago
  if (!period && payment.year) {
    period = policy.periods?.find(
      (p) => Number(p.year) === Number(payment.year)
    );
  }

  // Fallback: buscar por periodId si existe
  if (!period && payment.periodId) {
    period = policy.periods?.find((p) => p.id === payment.periodId);
  }

  // Último fallback: usar el último periodo
  if (!period && policy.periods?.length) {
    period = policy.periods[policy.periods.length - 1];
  }

  if (!period) return 0;

  // Usa los valores específicos del periodo encontrado
  const policyValue = Number(period.policyValue ?? period.policy_value ?? 0);
  const policyFee = Number(period.policyFee ?? period.policy_fee ?? 0);
  const advisorPercentage = Number(
    period.advisorPercentage ?? period.advisor_percentage ?? 0
  );
  const numPayments = Number(
    period.numberOfPaymentsAdvisor ?? policy.numberOfPaymentsAdvisor ?? 1
  );

  // Comisión de ese pago específico usando los valores del periodo correcto
  return ((policyValue - policyFee) * advisorPercentage) / 100 / numPayments;
};

export const getAgencyCommissionForPayment = (payment, policy) => {
  // Busca el periodo del pago por fecha de creación
  let period = null;
  if (payment.createdAt) {
    const paymentYear = new Date(payment.createdAt).getFullYear();
    period = policy.periods?.find((p) => Number(p.year) === paymentYear);
  }

  // Fallback: buscar por year si existe en el pago
  if (!period && payment.year) {
    period = policy.periods?.find(
      (p) => Number(p.year) === Number(payment.year)
    );
  }

  // Fallback: buscar por periodId si existe
  if (!period && payment.periodId) {
    period = policy.periods?.find((p) => p.id === payment.periodId);
  }

  // Último fallback: usar el último periodo
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

// Comisión total generada (solo pagos creados)
// Suma la comisión de TODOS los pagos generados, usando el periodo que corresponde a cada pago

export const calculateTotalAdvisorCommissionsGenerated = (policy) => {
  if (!policy || !Array.isArray(policy.payments)) return 0;
  return policy.payments.reduce(
    (total, payment) => total + getAdvisorCommissionForPayment(payment, policy),
    0
  );
};

export const calculateTotalAgencyCommissionsGenerated = (policy) => {
  if (!policy || !Array.isArray(policy.payments)) return 0;
  return policy.payments.reduce(
    (total, payment) => total + getAgencyCommissionForPayment(payment, policy),
    0
  );
};

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

// Función de debugging para entender los cálculos
export const debugPolicyCommissions = (policy) => {
  console.log("=== DEBUG POLICY COMMISSIONS ===");
  console.log("Policy:", policy.numberPolicy || policy.id);

  if (!policy.periods) {
    console.log("No periods found");
    return;
  }

  let totalAllPeriods = 0;

  policy.periods.forEach((period, index) => {
    console.log(`\nPeriod ${index + 1} (Year: ${period.year}):`);
    console.log(`  Policy Value: $${period.policyValue}`);
    console.log(`  Policy Fee: $${period.policyFee}`);
    console.log(`  Advisor %: ${period.advisorPercentage}%`);
    console.log(`  Agency %: ${period.agencyPercentage}%`);
    console.log(
      `  Payments per period: ${period.numberOfPaymentsAdvisor || 12}`
    );

    // Pagos en este periodo por fecha
    const paymentsInPeriod =
      policy.payments?.filter((p) => {
        if (p.createdAt) {
          const paymentYear = new Date(p.createdAt).getFullYear();
          return Number(paymentYear) === Number(period.year);
        }
        return Number(p.year) === Number(period.year);
      }) || [];

    console.log(`  Generated payments: ${paymentsInPeriod.length}`);

    if (paymentsInPeriod.length > 0) {
      const baseValue = Number(period.policyValue) - Number(period.policyFee);
      const advisorCommissionTotal =
        (baseValue * Number(period.advisorPercentage)) / 100;
      const agencyCommissionTotal =
        (baseValue * Number(period.agencyPercentage)) / 100;
      const commissionPerPayment =
        advisorCommissionTotal / (period.numberOfPaymentsAdvisor || 12);
      const totalCommissionPeriod =
        commissionPerPayment * paymentsInPeriod.length;

      console.log(`  Base value (policyValue - fee): $${baseValue}`);
      console.log(`  Advisor commission (total): $${advisorCommissionTotal}`);
      console.log(`  Agency commission (total): $${agencyCommissionTotal}`);
      console.log(
        `  Commission per payment: $${commissionPerPayment.toFixed(2)}`
      );
      console.log(
        `  Total commission this period: $${totalCommissionPeriod.toFixed(2)}`
      );

      totalAllPeriods += totalCommissionPeriod;
    } else {
      console.log(`  No payments generated - no commission`);
    }
  });

  const totalCommission = calculateTotalAdvisorCommissionsGenerated(policy);
  console.log(
    `\nTOTAL COMMISSION (all periods): $${totalAllPeriods.toFixed(2)}`
  );
  console.log(`TOTAL COMMISSION (function): $${totalCommission.toFixed(2)}`);
  console.log("===============================\n");

  return {
    calculatedTotal: Number(totalAllPeriods.toFixed(2)),
    functionTotal: Number(totalCommission.toFixed(2)),
    periods: policy.periods.length,
    totalPayments: policy.payments?.length || 0,
  };
};

// Función mejorada para calcular comisiones considerando solo periodos con pagos generados
export const calculateTotalAdvisorCommissionsGeneratedByPeriods = (policy) => {
  if (!policy || !Array.isArray(policy.periods)) return 0;

  let total = 0;

  for (const period of policy.periods) {
    // Solo considera periodos que tienen pagos generados
    const paymentsInPeriod =
      policy.payments?.filter((p) => {
        if (p.createdAt) {
          const paymentYear = new Date(p.createdAt).getFullYear();
          return Number(paymentYear) === Number(period.year);
        }
        // Fallback: usar campo year si existe
        return Number(p.year) === Number(period.year);
      }) || [];

    if (paymentsInPeriod.length > 0) {
      // Calcula comisión por pago para este periodo específico
      const policyValue = Number(
        period.policyValue ?? period.policy_value ?? 0
      );
      const policyFee = Number(period.policyFee ?? period.policy_fee ?? 0);
      const advisorPercentage = Number(
        period.advisorPercentage ?? period.advisor_percentage ?? 0
      );
      const numPaymentsAdvisor = Number(period.numberOfPaymentsAdvisor ?? 1);

      // Comisión por pago = (valor - fee) * % / número de pagos del periodo
      const commissionPerPayment =
        ((policyValue - policyFee) * advisorPercentage) /
        100 /
        numPaymentsAdvisor;

      // Total del periodo = comisión por pago * pagos generados
      const totalPeriod = commissionPerPayment * paymentsInPeriod.length;

      total += totalPeriod;
    }
  }

  return total;
};

// Helper principal para mostrar campos principales
export const getPolicyFields = (policy) => {
  // NUEVO: Calcular comisión individual según frecuencia
  const calculateIndividualCommission = () => {
    // Si no hay periodos, usar valores originales como fallback
    if (!policy.periods || policy.periods.length === 0) {
      if (!policy.paymentsToAdvisor || !policy.numberOfPaymentsAdvisor) {
        return 0;
      }
      const totalCommissionToAdvisor = parseFloat(policy.paymentsToAdvisor);
      const numberOfPayments = parseInt(policy.numberOfPaymentsAdvisor);

      if (policy.isCommissionAnnualized === true) {
        return totalCommissionToAdvisor;
      }
      return totalCommissionToAdvisor / numberOfPayments;
    }

    // ✅ ORDENAR PERIODOS POR AÑO Y TOMAR EL MÁS RECIENTE
    const sortedPeriods = [...policy.periods].sort(
      (a, b) => Number(b.year) - Number(a.year)
    );
    const lastPeriod = sortedPeriods[0]; // El de mayor año

    // Calcular comisión total del último periodo
    const policyValue = Number(lastPeriod.policyValue || 0);
    const policyFee = Number(lastPeriod.policyFee || 0);
    const advisorPercentage = Number(lastPeriod.advisorPercentage || 0);
    const numberOfPayments = Number(lastPeriod.numberOfPaymentsAdvisor || 12);

    // Comisión total anual del último periodo
    const totalCommissionLastPeriod =
      ((policyValue - policyFee) * advisorPercentage) / 100;

    // Si es anualizada, se paga todo de una vez al año
    if (policy.isCommissionAnnualized === true) {
      return totalCommissionLastPeriod;
    }

    // Si es normal, se divide entre el número de pagos del último periodo
    return totalCommissionLastPeriod / numberOfPayments;
  };

  // NUEVO: Obtener texto de frecuencia para mostrar
  const getFrequencyText = () => {
    if (policy.isCommissionAnnualized === true) {
      return "Anual";
    }

    const paymentsPerYear = parseInt(policy.numberOfPaymentsAdvisor);
    switch (paymentsPerYear) {
      case 12:
        return "Mensual";
      case 4:
        return "Trimestral";
      case 2:
        return "Semestral";
      case 1:
        return "Anual";
      default:
        return `Cada ${12 / paymentsPerYear} meses`;
    }
  };
  const refundsAmount = (policy.commissionRefunds || []).reduce(
    (acc, curr) => acc + Number(curr.amountRefunds || 0),
    0
  );

  // Usa la función mejorada que calcula correctamente por periodos con pagos generados
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
    commissionTotal: Number(commissionTotal.toFixed(2)), // Suma solo pagos generados, usando valores específicos de cada periodo
    released: Number(released.toFixed(2)),
    paid: Number(paid.toFixed(2)),
    appliedHistoricalAdvance: Number(appliedHistoricalAdvance.toFixed(2)),
    refundsAmount: Number(refundsAmount.toFixed(2)),
    afterBalance: Number(afterBalance.toFixed(2)),
    commissionInFavor: Number(commissionInFavor.toFixed(2)),
    individualCommission: calculateIndividualCommission(),
    frequencyText: getFrequencyText(),
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

  // Redondear todos los totales a 2 decimales
  return {
    commissionTotal: Number(totals.commissionTotal.toFixed(2)),
    released: Number(totals.released.toFixed(2)),
    paid: Number(totals.paid.toFixed(2)),
    appliedHistoricalAdvance: Number(
      totals.appliedHistoricalAdvance.toFixed(2)
    ),
    refundsAmount: Number(totals.refundsAmount.toFixed(2)),
    afterBalance: Number(totals.afterBalance.toFixed(2)),
    commissionInFavor: Number(totals.commissionInFavor.toFixed(2)),
  };
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
