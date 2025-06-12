
//HELPER 1: CALCULATE COMMISSION VALUE
export const calculateCommissionValue = (policy) => {
    if (!policy) return 0;
  
    if (!policy.renewalCommission) {
      return Number(policy.paymentsToAdvisor) || 0;
    }
  
    if (policy.isCommissionAnnualized === true) {
      const numPeriodos = 1 + (Array.isArray(policy.renewals) ? policy.renewals.length : 0);
      return numPeriodos * (Number(policy.paymentsToAdvisor) || 0);
    } else {
      let totalPagos = Array.isArray(policy.payments) ? policy.payments.length : 0;
      if (Array.isArray(policy.renewals)) {
        for (const renewal of policy.renewals) {
          if (Array.isArray(renewal.payments)) {
            totalPagos += renewal.payments.length;
          }
        }
      }
      const perPayment = Number(policy.paymentsToAdvisor) / Number(policy.numberOfPaymentsAdvisor || 1);
      return perPayment * totalPagos;
    }
  };
  
  //ELPER 2: CALCULATE RELEASED COMMISSIONS
  export const calculateReleasedCommissions = (policy) => {
    if (!policy) return 0;
  
    if (!policy.renewalCommission) {
      if (policy.isCommissionAnnualized === true) {
        return Number(policy.paymentsToAdvisor || 0);
      } else {
        if (!Array.isArray(policy.payments)) return 0;
        const advisorPercentage = Number(policy.advisorPercentage || 0) / 100;
        const releasedPayments = policy.payments.filter(
          (payment) => payment.paymentStatus && payment.paymentStatus.id == 2
        );
        return releasedPayments.reduce(
          (total, payment) => total + Number(payment.value || 0) * advisorPercentage,
          0
        );
      }
    }
  
    let total = 0;
  
    if (policy.isCommissionAnnualized === true) {
      total += Number(policy.paymentsToAdvisor || 0);
  
      if (Array.isArray(policy.renewals)) {
        for (const renewal of policy.renewals) {
          total += Number(renewal.paymentsToAdvisor || policy.paymentsToAdvisor || 0);
        }
      }
      return total;
    }
  
    const advisorPercentage = Number(policy.advisorPercentage || 0) / 100;
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
            (sum, payment) => sum + Number(payment.value || 0) * advisorPercentage,
            0
          );
        }
      }
    }
  
    return total;
  };