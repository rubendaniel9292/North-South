// Devuelve { liberadas, total } del último periodo para mostrar en columna "N° comisiones liberadas"
export function getReleasedCommissionsLastPeriod(policy) {
  if (!policy || !policy.payments || !policy.periods || policy.periods.length === 0) {
    return { liberadas: 0, total: 0 };
  }
  // Escenario 4: anualizada y sin comisión por renovación
  if (policy.isCommissionAnnualized === true && policy.renewalCommission === false) {
    // Solo el primer periodo
    const firstPeriod = policy.periods.reduce((min, curr) => curr.year < min.year ? curr : min, policy.periods[0]);
    const firstPeriodIndex = policy.periods.findIndex(p => p.id === firstPeriod.id);
    const pagosPorPeriodo = firstPeriod.numberOfPaymentsAdvisor || policy.numberOfPaymentsAdvisor || 1;
    const startPayment = firstPeriodIndex * pagosPorPeriodo + 1;
    const endPayment = startPayment + pagosPorPeriodo - 1;
    const liberadas = policy.payments.filter(
      (p) => (p.status_payment_id === '2' || p.status_payment_id === 2) &&
        p.number_payment >= startPayment && p.number_payment <= endPayment
    ).length;
    return { liberadas, total: pagosPorPeriodo };
  }
  // Si no hay comisión por renovación, tomar solo el primer periodo
  const useFirstPeriod = policy.renewalCommission === false;
  const targetPeriod = useFirstPeriod
    ? policy.periods.reduce((min, curr) => curr.year < min.year ? curr : min, policy.periods[0])
    : policy.periods.reduce((max, curr) => curr.year > max.year ? curr : max, policy.periods[0]);
  const targetPeriodIndex = policy.periods.findIndex(p => p.id === targetPeriod.id);
  const pagosPorPeriodo = targetPeriod.numberOfPaymentsAdvisor || policy.numberOfPaymentsAdvisor || 12;
  const startPayment = targetPeriodIndex * pagosPorPeriodo + 1;
  const endPayment = startPayment + pagosPorPeriodo - 1;
  // Pagos liberados en el periodo correspondiente
  const liberadas = policy.payments.filter(
    (p) => (p.status_payment_id === '2' || p.status_payment_id === 2) &&
      p.number_payment >= startPayment && p.number_payment <= endPayment
  ).length;
  return { liberadas, total: pagosPorPeriodo };
}

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
  let period = null;

  // ✅ PRIORIDAD 1: Usar number_payment para calcular el año del ciclo
  if (payment.number_payment && policy.startDate && policy.periods?.length) {
    const policyStartDate = new Date(policy.startDate);
    const startYear = policyStartDate.getFullYear();
    
    // Calcular a qué año pertenece este pago
    const cycleYear = Math.floor((payment.number_payment - 1) / 12);
    const targetYear = startYear + cycleYear;

    // Buscar el periodo por año
    period = policy.periods.find((p) => Number(p.year) === targetYear);
    
    // Si no se encuentra por año exacto, buscar el periodo más cercano
    if (!period) {
      // Ordenar periodos por año
      const sortedPeriods = [...policy.periods].sort((a, b) => Number(a.year) - Number(b.year));
      
      // Encontrar el periodo correcto basado en el índice del ciclo
      if (cycleYear < sortedPeriods.length) {
        period = sortedPeriods[cycleYear];
      } else {
        // Si el pago está más allá de los periodos definidos, usar el último
        period = sortedPeriods[sortedPeriods.length - 1];
      }
    }
  }

  // Fallback 2: usar createdAt si existe
  if (!period && payment.createdAt) {
    const paymentYear = new Date(payment.createdAt).getFullYear();
    period = policy.periods?.find((p) => Number(p.year) === paymentYear);
  }

  // Fallback 3: buscar por year si existe en el pago
  if (!period && payment.year) {
    period = policy.periods?.find(
      (p) => Number(p.year) === Number(payment.year)
    );
  }

  // Fallback 4: buscar por periodId si existe
  if (!period && payment.periodId) {
    period = policy.periods?.find((p) => p.id === payment.periodId);
  }

  // Último fallback: usar el primer periodo
  if (!period && policy.periods?.length) {
    period = policy.periods[0];
  }

  if (!period) return 0;

  // Usa los valores específicos del periodo encontrado
  const policyValue = Number(period.policyValue ?? period.policy_value ?? 0);
  const policyFee = Number(period.policyFee ?? period.policy_fee ?? 0);
  const advisorPercentage = Number(
    period.advisorPercentage ?? period.advisor_percentage ?? 0
  );
  
  // ✅ SIEMPRE usar 12 pagos/año para calcular comisión por pago
  // Esto mantiene consistencia: la comisión total no cambia si modificas la frecuencia de cobro
  // La comisión anual se divide entre 12 meses, independiente de cómo el cliente pague
  const numPayments = 12;

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

  // ✅ Para comisiones ANUALIZADAS: usar períodos completos
  if (policy.isCommissionAnnualized === true) {
    if (policy.periods && Array.isArray(policy.periods)) {
      let total = 0;
      for (const period of policy.periods) {
        const policyValue = Number(period.policyValue || 0);
        const policyFee = Number(period.policyFee || 0);
        const advisorPercentage = Number(period.advisorPercentage || 0);

        const periodCommission =
          ((policyValue - policyFee) * advisorPercentage) / 100;
        total += periodCommission;
      }
      return total;
    }

    // Fallback
    const periods =
      1 + (Array.isArray(policy.renewals) ? policy.renewals.length : 0);
    return Number(policy.paymentsToAdvisor || 0) * periods;
  }

  // ✅ VERIFICAR SI TIENE COMISIÓN POR RENOVACIÓN (campo correcto del backend: renewalCommission)
  const hasRenewalCommission = policy.renewalCommission === true || 
                                policy.renewalCommission === 1 ||
                                policy.renewalCommission === "true";

  // DEBUG temporal para VIDAFALSA0002
  if (policy.numberPolicy === "VIDAFALSA0002") {
    console.log("🔍 VIDAFALSA0002 - Debug:");
    console.log("  renewalCommission:", policy.renewalCommission);
    console.log("  hasRenewalCommission (calculado):", hasRenewalCommission);
    console.log("  Total pagos:", policy.payments?.length);
    console.log("  Periodos:", policy.periods?.length);
    console.log("  Pagos detalle:", policy.payments?.map(p => ({ 
      num: p.number_payment, 
      comision: getAdvisorCommissionForPayment(p, policy).toFixed(2)
    })));
  }

  // Si NO tiene comisión por renovación, solo contar pagos del PRIMER año
  if (!hasRenewalCommission) {
    return policy.payments
      .filter(payment => {
        if (!payment.number_payment) return false;
        // Solo pagos del 1 al 12 (primer año)
        return payment.number_payment >= 1 && payment.number_payment <= 12;
      })
      .reduce(
        (total, payment) => total + getAdvisorCommissionForPayment(payment, policy),
        0
      );
  }

  // ✅ Si tiene renovación: sumar TODOS los pagos generados
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
 
  if (!policy || !policy.payments || !policy.periods || policy.periods.length === 0) return 0;
  // Encontrar el último periodo (mayor año)
  const lastPeriod = policy.periods.reduce((max, curr) => curr.year > max.year ? curr : max, policy.periods[0]);
  // Determinar el índice del último periodo
  const lastPeriodIndex = policy.periods.findIndex(p => p.id === lastPeriod.id);
  // Calcular el rango de pagos para ese periodo
  const pagosPorPeriodo = policy.numberOfPayments || 12;
  const startPayment = lastPeriodIndex * pagosPorPeriodo + 1;
  const endPayment = startPayment + pagosPorPeriodo - 1;
  // Filtrar pagos liberados del último periodo
  const releasedPayments = policy.payments.filter(
    (p) => (p.status_payment_id === '2' || p.status_payment_id === 2) &&
      p.number_payment >= startPayment && p.number_payment <= endPayment
  );
  return releasedPayments.length;
};

export const calculateReleasedAgencyCommissionsGenerated = (policy) => {
  if (!policy || !Array.isArray(policy.payments)) return 0;
  return policy.payments
    .filter((payment) => {
      // Acepta ambos formatos: paymentStatus.id o status_payment_id
      const statusId = payment.paymentStatus?.id || payment.status_payment_id;
      return statusId == 2;
    })
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
      const released = calculateReleasedCommissions(policy); // ✅ Usar método correcto
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

// Función para obtener descuentos con motivos (actualizar CommissionUtils.js)
export const getRefundsDetails = (policy) => {
  if (!policy.commissionRefunds || policy.commissionRefunds.length === 0) {
    return { total: 0, details: [] };
  }

  const details = policy.commissionRefunds.map((refund) => ({
    amount: Number(refund.amountRefunds || 0),
    reason: refund.reason || "Sin motivo especificado",
    id: refund.id,
  }));

  const total = details.reduce((sum, refund) => sum + refund.amount, 0);

  return { total, details };
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

      // Validar valores
      if (isNaN(totalCommissionToAdvisor) || isNaN(numberOfPayments) || numberOfPayments === 0) {
        return 0;
      }

      if (policy.isCommissionAnnualized === true) {
        return totalCommissionToAdvisor;
      }
      
      const result = totalCommissionToAdvisor / numberOfPayments;
      return isNaN(result) || !isFinite(result) ? 0 : result;
    }

    // ✅ ORDENAR PERIODOS POR AÑO Y TOMAR EL MÁS RECIENTE
    const sortedPeriods = [...policy.periods].sort(
      (a, b) => Number(b.year) - Number(a.year)
    );
    const lastPeriod = sortedPeriods[0]; // El de mayor año

    if (!lastPeriod) return 0;

    // Calcular comisión total del último periodo
    const policyValue = Number(lastPeriod.policyValue || 0);
    const policyFee = Number(lastPeriod.policyFee || 0);
    const advisorPercentage = Number(lastPeriod.advisorPercentage || 0);
    
    // ✅ USAR LA FRECUENCIA ACTUAL DE LA PÓLIZA, NO DEL PERIODO
    const numberOfPayments = Number(policy.numberOfPaymentsAdvisor || 12);

    // Validar valores
    if (isNaN(policyValue) || isNaN(policyFee) || isNaN(advisorPercentage) || isNaN(numberOfPayments) || numberOfPayments === 0) {
      return 0;
    }

    // Comisión total anual del último periodo
    const totalCommissionLastPeriod =
      ((policyValue - policyFee) * advisorPercentage) / 100;

    // Validar resultado intermedio
    if (isNaN(totalCommissionLastPeriod) || !isFinite(totalCommissionLastPeriod)) {
      return 0;
    }

    // Si es anualizada, se paga todo de una vez al año
    if (policy.isCommissionAnnualized === true) {
      return totalCommissionLastPeriod;
    }

    // Si es normal, se divide entre la frecuencia ACTUAL de la póliza
    const result = totalCommissionLastPeriod / numberOfPayments;
    return isNaN(result) || !isFinite(result) ? 0 : result;
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

  // ✅ CORREGIR: Usar getRefundsDetails en lugar de cálculo manual
  const refundsData = getRefundsDetails(policy);
  const refundsAmount = refundsData.total;

  // Usa la función que calcula correctamente por periodos con pagos generados
  const commissionTotal = calculateTotalAdvisorCommissionsGenerated(policy);

  const releasedCalculated = calculateReleasedCommissions(policy);
  
  // ✅ IMPORTANTE: Las comisiones liberadas NUNCA pueden superar las comisiones totales
  const released = Math.min(releasedCalculated, commissionTotal);
  
  // Validar que released es un número válido
  const validReleased = isNaN(released) || !isFinite(released) ? 0 : released;
  const validRefundsAmount = isNaN(refundsAmount) || !isFinite(refundsAmount) ? 0 : refundsAmount;
  
  const releasedNet = validReleased - validRefundsAmount;
  const paid = Array.isArray(policy.commissions)
    ? policy.commissions.reduce(
        (sum, p) => {
          const amount = Number(p.advanceAmount) || 0;
          return sum + (isNaN(amount) ? 0 : amount);
        },
        0
      )
    : 0;
    
  const appliedHistoricalAdvance = Number(policy.appliedHistoricalAdvance) || 0;
  const validAppliedHistoricalAdvance = isNaN(appliedHistoricalAdvance) ? 0 : appliedHistoricalAdvance;
  
  const afterBalance = releasedNet - paid - validAppliedHistoricalAdvance;
  const commissionInFavor = Math.max(afterBalance, 0);

  return {
    commissionTotal: Number((commissionTotal || 0).toFixed(2)), // Suma solo pagos generados, usando valores específicos de cada periodo
    released: Number(validReleased.toFixed(2)),
    paid: Number(paid.toFixed(2)),
    appliedHistoricalAdvance: Number(validAppliedHistoricalAdvance.toFixed(2)),
    refundsAmount: Number(validRefundsAmount.toFixed(2)),
    refundsDetails: refundsData.details, // ✅ CORREGIR: Usar refundsData.details
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
      
      // Validar cada valor antes de sumarlo
      const validCommissionTotal = isNaN(f.commissionTotal) || !isFinite(f.commissionTotal) ? 0 : f.commissionTotal;
      const validReleased = isNaN(f.released) || !isFinite(f.released) ? 0 : f.released;
      const validPaid = isNaN(f.paid) || !isFinite(f.paid) ? 0 : f.paid;
      const validAppliedHistoricalAdvance = isNaN(f.appliedHistoricalAdvance) || !isFinite(f.appliedHistoricalAdvance) ? 0 : f.appliedHistoricalAdvance;
      const validRefundsAmount = isNaN(f.refundsAmount) || !isFinite(f.refundsAmount) ? 0 : f.refundsAmount;
      const validAfterBalance = isNaN(f.afterBalance) || !isFinite(f.afterBalance) ? 0 : f.afterBalance;
      const validCommissionInFavor = isNaN(f.commissionInFavor) || !isFinite(f.commissionInFavor) ? 0 : f.commissionInFavor;
      
      acc.commissionTotal += validCommissionTotal;
      acc.released += validReleased;
      acc.paid += validPaid;
      acc.appliedHistoricalAdvance += validAppliedHistoricalAdvance;
      acc.refundsAmount += validRefundsAmount;
      acc.afterBalance += validAfterBalance;
      acc.commissionInFavor += validCommissionInFavor;
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
    const validAdvanceValue = Number(advanceValue) || 0;
    if (!isNaN(validAdvanceValue) && isFinite(validAdvanceValue)) {
      totals.afterBalance -= validAdvanceValue;
    }
  }

  // Redondear todos los totales a 2 decimales y validar
  return {
    commissionTotal: Number((totals.commissionTotal || 0).toFixed(2)),
    released: Number((totals.released || 0).toFixed(2)),
    paid: Number((totals.paid || 0).toFixed(2)),
    appliedHistoricalAdvance: Number((totals.appliedHistoricalAdvance || 0).toFixed(2)),
    refundsAmount: Number((totals.refundsAmount || 0).toFixed(2)),
    afterBalance: Number((totals.afterBalance || 0).toFixed(2)),
    commissionInFavor: Number((totals.commissionInFavor || 0).toFixed(2)),
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

export const calculateReleasedCommissions = (policy) => {
  if (!policy) return 0;

  // PÓLIZA ANUALIZADA: Usar cálculo por períodos (sin cambios)
  if (policy.isCommissionAnnualized === true) {
    if (policy.periods && Array.isArray(policy.periods)) {
      let total = 0;
      for (const period of policy.periods) {
        const policyValue = Number(period.policyValue || 0);
        const policyFee = Number(period.policyFee || 0);
        const advisorPercentage = Number(period.advisorPercentage || 0);
        if (isNaN(policyValue) || isNaN(policyFee) || isNaN(advisorPercentage)) {
          continue;
        }
        const periodCommission = ((policyValue - policyFee) * advisorPercentage) / 100;
        if (!isNaN(periodCommission) && isFinite(periodCommission)) {
          total += periodCommission;
        }
      }
      return total;
    }
    const periods = 1 + (Array.isArray(policy.renewals) ? policy.renewals.length : 0);
    const paymentsToAdvisor = Number(policy.paymentsToAdvisor || 0);
    if (isNaN(paymentsToAdvisor) || isNaN(periods)) {
      return 0;
    }
    return paymentsToAdvisor * periods;
  }

  // PÓLIZA NORMAL: Sumar la comisión real de cada pago liberado usando los valores del periodo correspondiente
  let totalReleased = 0;
  if (Array.isArray(policy.payments)) {
    for (const payment of policy.payments) {
      const statusId = payment.paymentStatus?.id || payment.status_payment_id;
      if (statusId == 2) {
        totalReleased += getAdvisorCommissionForPayment(payment, policy);
      }
    }
  }
  // Si hay renovaciones, sumar también los pagos liberados de cada renovación
  if (Array.isArray(policy.renewals)) {
    for (const renewal of policy.renewals) {
      if (Array.isArray(renewal.payments)) {
        for (const payment of renewal.payments) {
          const statusId = payment.paymentStatus?.id || payment.status_payment_id;
          if (statusId == 2) {
            totalReleased += getAdvisorCommissionForPayment(payment, policy);
          }
        }
      }
    }
  }
  if (isNaN(totalReleased) || !isFinite(totalReleased)) {
    return 0;
  }
  return totalReleased;
};
