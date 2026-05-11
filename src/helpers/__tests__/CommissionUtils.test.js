import { describe, it, expect } from 'vitest';
import {
  calculateAdvisorCommissionPerPeriod,
  calculateAgencyCommissionPerPeriod,
  getReleasedCommissionsLastPeriod,
  getAdvisorCommissionForPayment,
  getAgencyCommissionForPayment,
  calculateTotalAdvisorCommissionAllPeriods,
  calculateTotalAgencyCommissionAllPeriods,
  calculateTotalAdvisorCommissionsGenerated,
  calculateReleasedCommissionsGenerated,
  getAdvisorTotalAdvances,
} from '../CommissionUtils';

// ─────────────────────────────────────────────
// Helpers de datos
// ─────────────────────────────────────────────
const makePeriod = (overrides = {}) => ({
  id: 1,
  year: 2024,
  policyValue: 1000,
  policyFee: 100,
  advisorPercentage: 10,
  agencyPercentage: 20,
  numberOfPaymentsAdvisor: 12,
  ...overrides,
});

const makePayment = (overrides = {}) => ({
  number_payment: 1,
  status_payment_id: '1',
  createdAt: '2024-03-01T00:00:00Z',
  ...overrides,
});

// ─────────────────────────────────────────────
// calculateAdvisorCommissionPerPeriod
// ─────────────────────────────────────────────
describe('calculateAdvisorCommissionPerPeriod', () => {
  it('devuelve 0 si el periodo es null', () => {
    expect(calculateAdvisorCommissionPerPeriod(null)).toBe(0);
  });

  it('devuelve 0 si el periodo es undefined', () => {
    expect(calculateAdvisorCommissionPerPeriod(undefined)).toBe(0);
  });

  it('calcula correctamente con campos camelCase', () => {
    // (1000 - 100) * 10 / 100 = 90
    expect(calculateAdvisorCommissionPerPeriod(
      makePeriod({ policyValue: 1000, policyFee: 100, advisorPercentage: 10 })
    )).toBe(90);
  });

  it('calcula correctamente con campos snake_case', () => {
    // (2000 - 200) * 15 / 100 = 270
    expect(calculateAdvisorCommissionPerPeriod({
      policy_value: 2000,
      policy_fee: 200,
      advisor_percentage: 15,
    })).toBe(270);
  });

  it('da prioridad a camelCase sobre snake_case', () => {
    // camelCase gana: (500 - 50) * 5 / 100 = 22.5
    expect(calculateAdvisorCommissionPerPeriod({
      policyValue: 500,
      policy_value: 9999,
      policyFee: 50,
      policy_fee: 9999,
      advisorPercentage: 5,
      advisor_percentage: 99,
    })).toBe(22.5);
  });

  it('devuelve 0 si el porcentaje es 0', () => {
    expect(calculateAdvisorCommissionPerPeriod(
      makePeriod({ advisorPercentage: 0 })
    )).toBe(0);
  });

  it('devuelve 0 si policyValue es igual a policyFee', () => {
    expect(calculateAdvisorCommissionPerPeriod(
      makePeriod({ policyValue: 500, policyFee: 500 })
    )).toBe(0);
  });
});

// ─────────────────────────────────────────────
// calculateAgencyCommissionPerPeriod
// ─────────────────────────────────────────────
describe('calculateAgencyCommissionPerPeriod', () => {
  it('devuelve 0 si el periodo es null', () => {
    expect(calculateAgencyCommissionPerPeriod(null)).toBe(0);
  });

  it('calcula correctamente con campos camelCase', () => {
    // (1000 - 100) * 20 / 100 = 180
    expect(calculateAgencyCommissionPerPeriod(
      makePeriod({ policyValue: 1000, policyFee: 100, agencyPercentage: 20 })
    )).toBe(180);
  });

  it('calcula correctamente con campos snake_case', () => {
    // (3000 - 300) * 25 / 100 = 675
    expect(calculateAgencyCommissionPerPeriod({
      policy_value: 3000,
      policy_fee: 300,
      agency_percentage: 25,
    })).toBe(675);
  });

  it('devuelve 0 si el porcentaje es 0', () => {
    expect(calculateAgencyCommissionPerPeriod(
      makePeriod({ agencyPercentage: 0 })
    )).toBe(0);
  });
});

// ─────────────────────────────────────────────
// getReleasedCommissionsLastPeriod
// ─────────────────────────────────────────────
describe('getReleasedCommissionsLastPeriod', () => {
  it('devuelve {0,0} si la póliza es null', () => {
    expect(getReleasedCommissionsLastPeriod(null)).toEqual({ liberadas: 0, total: 0 });
  });

  it('devuelve liberadas=0 pero total=12 si no hay pagos (el total del periodo siempre se calcula)', () => {
    // payments=[] es truthy → la guardia no actúa; total se calcula del periodo
    expect(getReleasedCommissionsLastPeriod({
      payments: [],
      periods: [makePeriod()],
    })).toEqual({ liberadas: 0, total: 12 });
  });

  it('devuelve {0,0} si no hay periodos', () => {
    expect(getReleasedCommissionsLastPeriod({
      payments: [makePayment()],
      periods: [],
    })).toEqual({ liberadas: 0, total: 0 });
  });

  it('Escenario 4: anualizada y sin renovación — usa primer periodo, default 1 pago cuando numberOfPaymentsAdvisor es falsy', () => {
    // numberOfPaymentsAdvisor=undefined en periodo Y póliza → cae al || 1
    // firstPeriodIndex=0, startPayment=0*1+1=1, endPayment=1
    // Solo pago 1 cae en el rango → liberadas=1, total=1
    const policy = {
      isCommissionAnnualized: true,
      renewalCommission: false,
      periods: [
        makePeriod({ id: 1, year: 2023, numberOfPaymentsAdvisor: undefined }),
        makePeriod({ id: 2, year: 2024, numberOfPaymentsAdvisor: undefined }),
      ],
      payments: [
        makePayment({ number_payment: 1, status_payment_id: '2' }),
        makePayment({ number_payment: 2, status_payment_id: '2' }),
      ],
    };
    expect(getReleasedCommissionsLastPeriod(policy)).toEqual({ liberadas: 1, total: 1 });
  });

  it('Escenario 4: anualizada y sin renovación — usa numberOfPaymentsAdvisor del periodo', () => {
    // firstPeriod.numberOfPaymentsAdvisor = 12 → pagosPorPeriodo = 12
    // firstPeriodIndex=0, startPayment=1, endPayment=12
    // 3 pagos liberados en ese rango
    const policy = {
      isCommissionAnnualized: true,
      renewalCommission: false,
      periods: [makePeriod({ id: 1, year: 2023, numberOfPaymentsAdvisor: 12 })],
      payments: [
        makePayment({ number_payment: 1, status_payment_id: '2' }),
        makePayment({ number_payment: 5, status_payment_id: '2' }),
        makePayment({ number_payment: 12, status_payment_id: '2' }),
        makePayment({ number_payment: 13, status_payment_id: '2' }), // fuera del rango
      ],
    };
    expect(getReleasedCommissionsLastPeriod(policy)).toEqual({ liberadas: 3, total: 12 });
  });

  it('sin renovación (renewalCommission=false) — usa primer periodo como target', () => {
    // 2 periodos. Sin renovación → targetPeriod = año 2023 (índice 0)
    // pagosPorPeriodo = 12, startPayment=1, endPayment=12
    // 2 pagos liberados en rango 1-12
    const policy = {
      renewalCommission: false,
      periods: [
        makePeriod({ id: 1, year: 2023 }),
        makePeriod({ id: 2, year: 2024 }),
      ],
      payments: [
        makePayment({ number_payment: 1, status_payment_id: '2' }),
        makePayment({ number_payment: 12, status_payment_id: '2' }),
        makePayment({ number_payment: 13, status_payment_id: '2' }), // segundo periodo, no cuenta
      ],
    };
    expect(getReleasedCommissionsLastPeriod(policy)).toEqual({ liberadas: 2, total: 12 });
  });

  it('con renovación (renewalCommission=true) — usa ÚLTIMO periodo como target', () => {
    // 2 periodos. Con renovación → targetPeriod = año 2024 (índice 1)
    // pagosPorPeriodo = 12, startPayment=1*12+1=13, endPayment=24
    // 1 pago liberado en rango 13-24
    const policy = {
      renewalCommission: true,
      periods: [
        makePeriod({ id: 1, year: 2023 }),
        makePeriod({ id: 2, year: 2024 }),
      ],
      payments: [
        makePayment({ number_payment: 1, status_payment_id: '2' }),  // primer periodo, no cuenta
        makePayment({ number_payment: 13, status_payment_id: '2' }), // último periodo
        makePayment({ number_payment: 13, status_payment_id: '1' }), // no liberado
      ],
    };
    expect(getReleasedCommissionsLastPeriod(policy)).toEqual({ liberadas: 1, total: 12 });
  });

  it('acepta status_payment_id numérico (2) además de string ("2")', () => {
    const policy = {
      renewalCommission: false,
      periods: [makePeriod({ id: 1, year: 2023 })],
      payments: [
        makePayment({ number_payment: 1, status_payment_id: 2 }),   // numérico
        makePayment({ number_payment: 2, status_payment_id: '2' }), // string
      ],
    };
    expect(getReleasedCommissionsLastPeriod(policy)).toEqual({ liberadas: 2, total: 12 });
  });
});

// ─────────────────────────────────────────────
// getAdvisorCommissionForPayment
// ─────────────────────────────────────────────
describe('getAdvisorCommissionForPayment', () => {
  const period2023 = makePeriod({ id: 1, year: 2023, policyValue: 1200, policyFee: 0, advisorPercentage: 10, numberOfPaymentsAdvisor: 12 });
  const period2024 = makePeriod({ id: 2, year: 2024, policyValue: 1440, policyFee: 0, advisorPercentage: 10, numberOfPaymentsAdvisor: 12 });

  const basePolicy = {
    // Usar mediados de año para evitar problemas de timezone en getFullYear()
    startDate: '2023-06-15T12:00:00Z',
    numberOfPaymentsAdvisor: 12,
    periods: [period2023, period2024],
    payments: [],
  };

  it('devuelve 0 si no hay periodos', () => {
    expect(getAdvisorCommissionForPayment(makePayment({ number_payment: 1 }), { periods: [] })).toBe(0);
  });

  it('PRIORIDAD 1: usa number_payment para determinar el periodo correcto', () => {
    // number_payment=1 → cycleYear=0 → año 2023 → period2023
    // (1200 - 0) * 10 / 100 / 12 = 10
    const payment = makePayment({ number_payment: 1 });
    expect(getAdvisorCommissionForPayment(payment, basePolicy)).toBeCloseTo(10);
  });

  it('PRIORIDAD 1: pago en segundo periodo (number_payment=13)', () => {
    // number_payment=13 → cycleYear=1 → año 2024 → period2024
    // (1440 - 0) * 10 / 100 / 12 = 12
    const payment = makePayment({ number_payment: 13 });
    expect(getAdvisorCommissionForPayment(payment, basePolicy)).toBeCloseTo(12);
  });

  it('Fallback createdAt: usa año de creación si no hay number_payment', () => {
    // createdAt en 2024 → period2024 → (1440) * 10% / 12 = 12
    const payment = { createdAt: '2024-06-15T00:00:00Z' };
    expect(getAdvisorCommissionForPayment(payment, basePolicy)).toBeCloseTo(12);
  });

  it('Fallback year: usa campo year del pago', () => {
    // year=2023 → period2023 → 10
    const payment = { year: 2023 };
    expect(getAdvisorCommissionForPayment(payment, basePolicy)).toBeCloseTo(10);
  });

  it('Fallback periodId: usa el ID del periodo', () => {
    // periodId=2 → period2024 → 12
    const payment = { periodId: 2 };
    expect(getAdvisorCommissionForPayment(payment, basePolicy)).toBeCloseTo(12);
  });

  it('Último fallback: usa el primer periodo si nada encaja', () => {
    // Sin ninguna pista → period2023 → 10
    const payment = {};
    expect(getAdvisorCommissionForPayment(payment, basePolicy)).toBeCloseTo(10);
  });
});

// ─────────────────────────────────────────────
// getAgencyCommissionForPayment
// ─────────────────────────────────────────────
describe('getAgencyCommissionForPayment', () => {
  const period = makePeriod({ id: 1, year: 2024, policyValue: 1000, policyFee: 100, agencyPercentage: 20, numberOfPaymentsAdvisor: 12 });
  const policy = { periods: [period], payments: [] };

  it('devuelve 0 si no hay periodos', () => {
    expect(getAgencyCommissionForPayment(makePayment(), { periods: [] })).toBe(0);
  });

  it('calcula usando createdAt para encontrar el periodo', () => {
    // (1000 - 100) * 20 / 100 / 12 = 15
    const payment = { createdAt: '2024-05-01T00:00:00Z' };
    expect(getAgencyCommissionForPayment(payment, policy)).toBeCloseTo(15);
  });

  it('usa último periodo como fallback', () => {
    // Sin fecha → usa el último periodo (el único en este caso)
    const payment = {};
    expect(getAgencyCommissionForPayment(payment, policy)).toBeCloseTo(15);
  });
});

// ─────────────────────────────────────────────
// calculateTotalAdvisorCommissionAllPeriods
// ─────────────────────────────────────────────
describe('calculateTotalAdvisorCommissionAllPeriods', () => {
  it('devuelve 0 si la póliza es null', () => {
    expect(calculateTotalAdvisorCommissionAllPeriods(null)).toBe(0);
  });

  it('devuelve 0 si no hay periodos', () => {
    expect(calculateTotalAdvisorCommissionAllPeriods({ periods: [], payments: [] })).toBe(0);
  });

  it('devuelve 0 si no hay pagos para un periodo', () => {
    const policy = {
      periods: [makePeriod({ year: 2024 })],
      payments: [],
    };
    expect(calculateTotalAdvisorCommissionAllPeriods(policy)).toBe(0);
  });

  it('suma correctamente usando createdAt del pago', () => {
    // periodo 2024: (1000-100)*10/100 / 12 = 7.5 por pago
    // 2 pagos en 2024 → total = 15
    // Fechas en mediados de año para evitar ambigüedad de timezone en getFullYear()
    const policy = {
      periods: [makePeriod({ year: 2024, policyValue: 1000, policyFee: 100, advisorPercentage: 10, numberOfPaymentsAdvisor: 12 })],
      payments: [
        makePayment({ createdAt: '2024-06-15T12:00:00Z' }),
        makePayment({ createdAt: '2024-09-15T12:00:00Z' }),
      ],
    };
    expect(calculateTotalAdvisorCommissionAllPeriods(policy)).toBeCloseTo(15);
  });

  it('suma correctamente usando campo year del pago (fallback)', () => {
    const policy = {
      periods: [makePeriod({ year: 2023, policyValue: 1200, policyFee: 0, advisorPercentage: 10, numberOfPaymentsAdvisor: 12 })],
      payments: [
        { year: 2023 },
        { year: 2023 },
        { year: 2024 }, // diferente año, no debe contar
      ],
    };
    // 2 pagos × (1200*10%/100/12) = 2 × 10 = 20
    expect(calculateTotalAdvisorCommissionAllPeriods(policy)).toBeCloseTo(20);
  });

  it('acumula correctamente múltiples periodos', () => {
    // periodo 2023: (1200-0)*10/100 / 12 = 10 p/pago × 1 pago = 10
    // periodo 2024: (1440-0)*10/100 / 12 = 12 p/pago × 2 pagos = 24
    // total = 34
    // Fechas en mediados de año para evitar ambigüedad de timezone en getFullYear()
    const policy = {
      periods: [
        makePeriod({ id: 1, year: 2023, policyValue: 1200, policyFee: 0, advisorPercentage: 10, numberOfPaymentsAdvisor: 12 }),
        makePeriod({ id: 2, year: 2024, policyValue: 1440, policyFee: 0, advisorPercentage: 10, numberOfPaymentsAdvisor: 12 }),
      ],
      payments: [
        makePayment({ createdAt: '2023-06-15T12:00:00Z' }),
        makePayment({ createdAt: '2024-06-15T12:00:00Z' }),
        makePayment({ createdAt: '2024-09-15T12:00:00Z' }),
      ],
    };
    expect(calculateTotalAdvisorCommissionAllPeriods(policy)).toBeCloseTo(34);
  });
});

// ─────────────────────────────────────────────
// calculateTotalAdvisorCommissionsGenerated
// ─────────────────────────────────────────────
describe('calculateTotalAdvisorCommissionsGenerated', () => {
  it('devuelve 0 si la póliza es null', () => {
    expect(calculateTotalAdvisorCommissionsGenerated(null)).toBe(0);
  });

  it('devuelve 0 si payments no es array', () => {
    expect(calculateTotalAdvisorCommissionsGenerated({ payments: null, periods: [] })).toBe(0);
  });

  it('póliza anualizada: suma comisión completa de cada periodo', () => {
    // periodo 1: (1000-100)*10/100 = 90
    // periodo 2: (1200-0)*15/100 = 180
    // total = 270 (independiente de los pagos generados)
    const policy = {
      isCommissionAnnualized: true,
      periods: [
        makePeriod({ id: 1, policyValue: 1000, policyFee: 100, advisorPercentage: 10 }),
        makePeriod({ id: 2, policyValue: 1200, policyFee: 0, advisorPercentage: 15 }),
      ],
      payments: [makePayment()],
    };
    expect(calculateTotalAdvisorCommissionsGenerated(policy)).toBeCloseTo(270);
  });

  it('sin renovación: solo suma pagos del primer año (number_payment <= paymentsPerYear)', () => {
    // numberOfPaymentsAdvisor = 12 → solo pagos 1-12
    // 2 pagos válidos (1 y 12) × 10/pago = 20
    const policy = {
      renewalCommission: false,
      numberOfPaymentsAdvisor: 12,
      startDate: '2023-01-01',
      periods: [
        makePeriod({ id: 1, year: 2023, policyValue: 1200, policyFee: 0, advisorPercentage: 10, numberOfPaymentsAdvisor: 12 }),
      ],
      payments: [
        makePayment({ number_payment: 1 }),
        makePayment({ number_payment: 12 }),
        makePayment({ number_payment: 13 }), // segundo año, NO debe contar
      ],
    };
    expect(calculateTotalAdvisorCommissionsGenerated(policy)).toBeCloseTo(20);
  });

  it('con renovación: suma TODOS los pagos generados', () => {
    // 3 pagos × 10/pago = 30
    const policy = {
      renewalCommission: true,
      numberOfPaymentsAdvisor: 12,
      startDate: '2023-01-01',
      periods: [
        makePeriod({ id: 1, year: 2023, policyValue: 1200, policyFee: 0, advisorPercentage: 10, numberOfPaymentsAdvisor: 12 }),
        makePeriod({ id: 2, year: 2024, policyValue: 1200, policyFee: 0, advisorPercentage: 10, numberOfPaymentsAdvisor: 12 }),
      ],
      payments: [
        makePayment({ number_payment: 1 }),
        makePayment({ number_payment: 12 }),
        makePayment({ number_payment: 13 }),
      ],
    };
    expect(calculateTotalAdvisorCommissionsGenerated(policy)).toBeCloseTo(30);
  });
});

// ─────────────────────────────────────────────
// calculateReleasedCommissionsGenerated
// ─────────────────────────────────────────────
describe('calculateReleasedCommissionsGenerated', () => {
  it('devuelve 0 si la póliza es null', () => {
    expect(calculateReleasedCommissionsGenerated(null)).toBe(0);
  });

  it('devuelve 0 si no hay pagos', () => {
    expect(calculateReleasedCommissionsGenerated({
      payments: [],
      periods: [makePeriod()],
    })).toBe(0);
  });

  it('devuelve 0 si no hay periodos', () => {
    expect(calculateReleasedCommissionsGenerated({
      payments: [makePayment()],
      periods: [],
    })).toBe(0);
  });

  it('cuenta pagos liberados del ÚLTIMO periodo (mayor año)', () => {
    // 2 periodos: 2023 (índice 0), 2024 (índice 1) — último = 2024
    // numberOfPayments=12, startPayment=1*12+1=13, endPayment=24
    // pagos 13 y 20 liberados → 2
    const policy = {
      numberOfPayments: 12,
      periods: [
        makePeriod({ id: 1, year: 2023 }),
        makePeriod({ id: 2, year: 2024 }),
      ],
      payments: [
        makePayment({ number_payment: 1, status_payment_id: '2' }),  // primer periodo, no cuenta
        makePayment({ number_payment: 13, status_payment_id: '2' }), // último periodo ✓
        makePayment({ number_payment: 20, status_payment_id: '2' }), // último periodo ✓
        makePayment({ number_payment: 15, status_payment_id: '1' }), // no liberado
      ],
    };
    expect(calculateReleasedCommissionsGenerated(policy)).toBe(2);
  });

  it('con un solo periodo, cuenta pagos 1-12 liberados', () => {
    const policy = {
      numberOfPayments: 12,
      periods: [makePeriod({ id: 1, year: 2023 })],
      payments: [
        makePayment({ number_payment: 1, status_payment_id: '2' }),
        makePayment({ number_payment: 6, status_payment_id: '2' }),
        makePayment({ number_payment: 12, status_payment_id: '2' }),
        makePayment({ number_payment: 12, status_payment_id: '1' }), // no liberado
      ],
    };
    expect(calculateReleasedCommissionsGenerated(policy)).toBe(3);
  });
});

// ─────────────────────────────────────────────
// getAdvisorTotalAdvances
// ─────────────────────────────────────────────
describe('getAdvisorTotalAdvances', () => {
  it('devuelve 0 si el asesor es null', () => {
    expect(getAdvisorTotalAdvances(null)).toBe(0);
  });

  it('devuelve 0 si el asesor no tiene commissions', () => {
    expect(getAdvisorTotalAdvances({ commissions: null })).toBe(0);
  });

  it('devuelve 0 si no hay anticipos sin póliza', () => {
    const advisor = {
      commissions: [
        { policy_id: 5, status_advance_id: '1', advanceAmount: 100 }, // tiene póliza → no cuenta
      ],
    };
    expect(getAdvisorTotalAdvances(advisor)).toBe(0);
  });

  it('suma anticipos activos (status_advance_id="1") sin póliza asociada', () => {
    const advisor = {
      commissions: [
        { policy_id: null, status_advance_id: '1', advanceAmount: 200 },
        { policy_id: null, status_advance_id: '1', advanceAmount: 150 },
      ],
    };
    expect(getAdvisorTotalAdvances(advisor)).toBe(350);
  });

  it('acepta statusAdvance.id como alternativa a status_advance_id', () => {
    const advisor = {
      commissions: [
        { policy_id: null, statusAdvance: { id: '1' }, advanceAmount: 300 },
      ],
    };
    expect(getAdvisorTotalAdvances(advisor)).toBe(300);
  });

  it('ignora anticipos con status distinto de "1"', () => {
    const advisor = {
      commissions: [
        { policy_id: null, status_advance_id: '1', advanceAmount: 100 },
        { policy_id: null, status_advance_id: '2', advanceAmount: 500 }, // no activo
      ],
    };
    expect(getAdvisorTotalAdvances(advisor)).toBe(100);
  });

  it('ignora anticipos con policy_id definido', () => {
    const advisor = {
      commissions: [
        { policy_id: null, status_advance_id: '1', advanceAmount: 100 },
        { policy_id: 3, status_advance_id: '1', advanceAmount: 999 },
      ],
    };
    expect(getAdvisorTotalAdvances(advisor)).toBe(100);
  });
});
