import { describe, it, expect, vi } from 'vitest';
import {
  filterCardAndAccountByCustomer,
  handleCardAccountById,
  handleCardAccountByEvent,
  getPaymentsByFrequency,
  getFrequencyIdFromPayments,
  calculateAdvisorPayment,
} from '../PolicyFormHelpers';

// ─────────────────────────────────────────────
// Helpers de datos
// ─────────────────────────────────────────────
const makeCustomer = (id, ci_ruc) => ({ id, ci_ruc, name: `Cliente ${id}` });

const makeCard = (ci_ruc, overrides = {}) => ({
  id: Math.random(),
  customer: { ci_ruc },
  ...overrides,
});

const makeAccount = (ci_ruc, overrides = {}) => ({
  id: Math.random(),
  customer: { ci_ruc },
  ...overrides,
});

// ─────────────────────────────────────────────
// filterCardAndAccountByCustomer
// ─────────────────────────────────────────────
describe('filterCardAndAccountByCustomer', () => {
  const customers = [
    makeCustomer(1, '0901234567'),
    makeCustomer(2, '0912345678'),
  ];

  const cards = [
    makeCard('0901234567'),
    makeCard('0901234567'),
    makeCard('0912345678'),
  ];

  const accounts = [
    makeAccount('0901234567'),
    makeAccount('0912345678'),
    makeAccount('0912345678'),
  ];

  it('limpia tarjetas y cuentas si el cliente no existe', () => {
    const setFilteredCard = vi.fn();
    const setFilteredAccount = vi.fn();

    filterCardAndAccountByCustomer(999, customers, cards, accounts, setFilteredCard, setFilteredAccount);

    expect(setFilteredCard).toHaveBeenCalledWith([]);
    expect(setFilteredAccount).toHaveBeenCalledWith([]);
  });

  it('filtra tarjetas por el ci_ruc del cliente seleccionado', () => {
    const setFilteredCard = vi.fn();
    const setFilteredAccount = vi.fn();

    filterCardAndAccountByCustomer(1, customers, cards, accounts, setFilteredCard, setFilteredAccount);

    const passedCards = setFilteredCard.mock.calls[0][0];
    expect(passedCards).toHaveLength(2);
    expect(passedCards.every(c => c.customer.ci_ruc === '0901234567')).toBe(true);
  });

  it('filtra cuentas por el ci_ruc del cliente seleccionado', () => {
    const setFilteredCard = vi.fn();
    const setFilteredAccount = vi.fn();

    filterCardAndAccountByCustomer(2, customers, cards, accounts, setFilteredCard, setFilteredAccount);

    const passedAccounts = setFilteredAccount.mock.calls[0][0];
    expect(passedAccounts).toHaveLength(2);
    expect(passedAccounts.every(a => a.customer.ci_ruc === '0912345678')).toBe(true);
  });

  it('acepta selectedCustomerId como string aunque el id sea número', () => {
    const setFilteredCard = vi.fn();
    const setFilteredAccount = vi.fn();

    // id=1 como número, selectedCustomerId='1' como string
    filterCardAndAccountByCustomer('1', customers, cards, accounts, setFilteredCard, setFilteredAccount);

    expect(setFilteredCard.mock.calls[0][0]).toHaveLength(2);
  });

  it('llama a setFilteredCard([]) si no hay tarjetas', () => {
    const setFilteredCard = vi.fn();
    const setFilteredAccount = vi.fn();

    filterCardAndAccountByCustomer(1, customers, [], accounts, setFilteredCard, setFilteredAccount);

    expect(setFilteredCard).toHaveBeenCalledWith([]);
  });

  it('llama a setFilteredAccount([]) si no hay cuentas', () => {
    const setFilteredCard = vi.fn();
    const setFilteredAccount = vi.fn();

    filterCardAndAccountByCustomer(1, customers, cards, [], setFilteredCard, setFilteredAccount);

    expect(setFilteredAccount).toHaveBeenCalledWith([]);
  });

  it('devuelve arrays vacíos si el cliente no tiene tarjetas ni cuentas que coincidan', () => {
    const setFilteredCard = vi.fn();
    const setFilteredAccount = vi.fn();

    const otherCustomers = [makeCustomer(3, '9999999999')];

    filterCardAndAccountByCustomer(3, otherCustomers, cards, accounts, setFilteredCard, setFilteredAccount);

    expect(setFilteredCard.mock.calls[0][0]).toHaveLength(0);
    expect(setFilteredAccount.mock.calls[0][0]).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────
// handleCardAccountById
// ─────────────────────────────────────────────
describe('handleCardAccountById', () => {
  it('delega correctamente a filterCardAndAccountByCustomer', () => {
    const customers = [makeCustomer(1, '0901234567')];
    const cards = [makeCard('0901234567')];
    const accounts = [makeAccount('0901234567')];
    const setFilteredCard = vi.fn();
    const setFilteredAccount = vi.fn();

    handleCardAccountById(1, customers, cards, accounts, setFilteredCard, setFilteredAccount);

    expect(setFilteredCard.mock.calls[0][0]).toHaveLength(1);
    expect(setFilteredAccount.mock.calls[0][0]).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────
// handleCardAccountByEvent
// ─────────────────────────────────────────────
describe('handleCardAccountByEvent', () => {
  it('llama a changed con el evento y filtra correctamente', () => {
    const customers = [makeCustomer(1, '0901234567')];
    const cards = [makeCard('0901234567')];
    const accounts = [makeAccount('0901234567')];
    const setFilteredCard = vi.fn();
    const setFilteredAccount = vi.fn();
    const changed = vi.fn();

    const event = { target: { value: '1' } };

    handleCardAccountByEvent(event, customers, cards, accounts, setFilteredCard, setFilteredAccount, changed);

    expect(setFilteredCard.mock.calls[0][0]).toHaveLength(1);
    expect(setFilteredAccount.mock.calls[0][0]).toHaveLength(1);
    expect(changed).toHaveBeenCalledWith(event);
  });
});

// ─────────────────────────────────────────────
// getPaymentsByFrequency
// ─────────────────────────────────────────────
describe('getPaymentsByFrequency', () => {
  it('1 (Mensual) → 12 pagos', () => {
    expect(getPaymentsByFrequency(1)).toBe(12);
  });

  it('2 (Trimestral) → 4 pagos', () => {
    expect(getPaymentsByFrequency(2)).toBe(4);
  });

  it('3 (Semestral) → 2 pagos', () => {
    expect(getPaymentsByFrequency(3)).toBe(2);
  });

  it('4 (Anual) → 1 pago', () => {
    expect(getPaymentsByFrequency(4)).toBe(1);
  });

  it('ID desconocido → 12 pagos (default mensual)', () => {
    expect(getPaymentsByFrequency(99)).toBe(12);
  });

  it('acepta string como frequencyId', () => {
    expect(getPaymentsByFrequency('2')).toBe(4);
  });
});

// ─────────────────────────────────────────────
// getFrequencyIdFromPayments
// ─────────────────────────────────────────────
describe('getFrequencyIdFromPayments', () => {
  it('12 pagos → frecuencia 1 (Mensual)', () => {
    expect(getFrequencyIdFromPayments(12)).toBe(1);
  });

  it('4 pagos → frecuencia 2 (Trimestral)', () => {
    expect(getFrequencyIdFromPayments(4)).toBe(2);
  });

  it('2 pagos → frecuencia 3 (Semestral)', () => {
    expect(getFrequencyIdFromPayments(2)).toBe(3);
  });

  it('1 pago → frecuencia 4 (Anual)', () => {
    expect(getFrequencyIdFromPayments(1)).toBe(4);
  });

  it('valor desconocido → frecuencia 1 (default mensual)', () => {
    expect(getFrequencyIdFromPayments(7)).toBe(1);
  });

  it('acepta string como numberOfPayments', () => {
    expect(getFrequencyIdFromPayments('4')).toBe(2);
  });

  it('es inverso de getPaymentsByFrequency para todos los valores válidos', () => {
    [1, 2, 3, 4].forEach((freqId) => {
      const payments = getPaymentsByFrequency(freqId);
      expect(getFrequencyIdFromPayments(payments)).toBe(freqId);
    });
  });
});

// ─────────────────────────────────────────────
// calculateAdvisorPayment
// ─────────────────────────────────────────────
describe('calculateAdvisorPayment', () => {
  it('devuelve "0.00" si policyValue es 0', () => {
    expect(calculateAdvisorPayment(0, 0, 20, 15)).toBe('0.00');
  });

  it('devuelve "0.00" si agencyPercentage es 0', () => {
    expect(calculateAdvisorPayment(1000, 100, 0, 15)).toBe('0.00');
  });

  it('devuelve "0.00" si advisorPercentage es 0', () => {
    expect(calculateAdvisorPayment(1000, 100, 20, 0)).toBe('0.00');
  });

  it('calcula correctamente: (agencyTotal - advisorTotal)', () => {
    // base = 1000 - 100 = 900
    // agencyTotal = 900 * 20 / 100 = 180
    // advisorTotal = 900 * 15 / 100 = 135
    // resultado = 180 - 135 = 45.00
    expect(calculateAdvisorPayment(1000, 100, 20, 15)).toBe('45.00');
  });

  it('calcula con policyFee = 0', () => {
    // base = 1200
    // agency = 1200 * 25 / 100 = 300
    // advisor = 1200 * 10 / 100 = 120
    // resultado = 300 - 120 = 180.00
    expect(calculateAdvisorPayment(1200, 0, 25, 10)).toBe('180.00');
  });

  it('acepta strings como argumentos (parseFloat)', () => {
    expect(calculateAdvisorPayment('1000', '100', '20', '15')).toBe('45.00');
  });

  it('devuelve "0.00" con strings vacíos', () => {
    expect(calculateAdvisorPayment('', '', '', '')).toBe('0.00');
  });

  it('el resultado tiene siempre 2 decimales', () => {
    const result = calculateAdvisorPayment(1000, 0, 33.333, 11.111);
    expect(result).toMatch(/^\d+\.\d{2}$/);
  });
});
