import { Test, TestingModule } from '@nestjs/testing';
import { ReportFactory } from './factory-report';
import { ErrorManager } from '@/helpers/error.manager';
import { PolicyReportDTO } from '../dto/policyreport.dto';
import { PaymentReportDTO } from '../dto/paymentreport.dto';

describe('ReportFactory', () => {
  let factory: ReportFactory;

  // Mock completo para PolicyReportDTO
  const mockPolicyData: PolicyReportDTO = {
    id: '1',
    numberPolicy: 'POL-001',
    coverageAmount: '100000',
    agencyPercentage: '10',
    advisorPercentage: '5',
    policyValue: '1000',
    numberOfPayments: 12,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    policyFee: '50',
    paymentsToAdvisor: '50',
    observations: 'Test observations',
    renewalCommission: true,
    policyType: {
      policyName: 'Vida',
    },
    policyStatus: {
      id: '1',
      statusName: 'Activa',
    },
    paymentFrequency: {
      id: '1',
      frequencyName: 'Mensual',
    },
    company: {
      id: '1',
      companyName: 'Seguros Test',
    },
    advisor: {
      firstName: 'Juan',
      secondName: 'Carlos',
      surname: 'Pérez',
      secondSurname: 'González',
    },
    customer: {
      ci_ruc: '1234567890',
      firstName: 'Ana',
      secondName: 'María',
      surname: 'López',
      secondSurname: 'Rodríguez',
    },
    paymentMethod: {
      methodName: 'Efectivo',
    },
    bankAccount: {
      bank_id: '1',
      bank: {
        bankName: 'Banco Test',
      },
    },
    payments: [
      {
        id: 1,
        number_payment: 1,
        pending_value: 0,
        value: '500.00',
        credit: '0.00',
        balance: '500.00',
        total: '500.00',
        observations: 'Primer pago',
        policy_id: 1,
        status_payment_id: '1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        paymentStatus: {
          id: 1,
          statusNamePayment: 'Completado',
        },
      },
    ],
    renewals: [
      {
        id: '1',
        renewalNumber: 'REN-001',
        policy_id: '1',
        createdAt: new Date('2024-01-01'),
        observations: 'Primera renovación',
      },
    ],
  };

  // Mock completo para PaymentReportDTO
  const mockPaymentData: PaymentReportDTO[] = [
    {
      value: '500.00',
      pending_value: '0.00',
      observations: 'Pago completo',
      createdAt: '2024-01-15',
      policies: {
        numberPolicy: 'POL-001',
        policyValue: '1000.00',
        customer: {
          numberPhone: '0999999999',
          firstName: 'Ana',
          secondName: 'María',
          surname: 'López',
          secondSurname: 'Rodríguez',
        },
        company: {
          companyName: 'Seguros Test',
        },
        advisor: {
          firstName: 'Juan',
          secondName: 'Carlos',
          surname: 'Pérez',
          secondSurname: 'González',
        },
      },
      paymentStatus: {
        id: '1',
        statusNamePayment: 'Completado',
      },
    },
    {
      value: '500.00',
      pending_value: '250.00',
      observations: 'Pago parcial',
      createdAt: '2024-02-15',
      policies: {
        numberPolicy: 'POL-002',
        policyValue: '1500.00',
        customer: {
          numberPhone: '0988888888',
          firstName: 'Carlos',
          secondName: 'Eduardo',
          surname: 'Martínez',
          secondSurname: 'Silva',
        },
        company: {
          companyName: 'Seguros Test',
        },
        advisor: {
          firstName: 'Juan',
          secondName: 'Carlos',
          surname: 'Pérez',
          secondSurname: 'González',
        },
      },
      paymentStatus: {
        id: '2',
        statusNamePayment: 'Pendiente',
      },
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportFactory],
    }).compile();

    factory = module.get<ReportFactory>(ReportFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateHtml', () => {
    it('debería generar HTML para reporte de póliza correctamente', () => {
      // Act
      const result = factory.generateHtml('policy', mockPolicyData);

      // Assert
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html>');
      expect(result).toContain('</html>');
      expect(result).toContain('Reporte de Póliza');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(100);
    });

    it('debería generar HTML para reporte de pagos correctamente', () => {
      // Act
      const result = factory.generateHtml('payment', mockPaymentData);

      // Assert
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html>');
      expect(result).toContain('</html>');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(100);
    });

    it('debería ser case-insensitive para tipos de reporte', () => {
      // Act & Assert
      expect(() => factory.generateHtml('POLICY', mockPolicyData)).not.toThrow();
      expect(() => factory.generateHtml('Policy', mockPolicyData)).not.toThrow();
      expect(() => factory.generateHtml('PAYMENT', mockPaymentData)).not.toThrow();
      expect(() => factory.generateHtml('Payment', mockPaymentData)).not.toThrow();
    });

    it('debería lanzar BAD_REQUEST para tipo de reporte inválido', () => {
      // Act & Assert
      expect(() => factory.generateHtml(null as any, mockPolicyData)).toThrow(ErrorManager);
      expect(() => factory.generateHtml(undefined as any, mockPolicyData)).toThrow(ErrorManager);
      expect(() => factory.generateHtml('', mockPolicyData)).toThrow(ErrorManager);
      expect(() => factory.generateHtml(123 as any, mockPolicyData)).toThrow(ErrorManager);
    });

    it('debería lanzar BAD_REQUEST para datos nulos o undefined', () => {
      // Act & Assert
      expect(() => factory.generateHtml('policy', null)).toThrow(ErrorManager);
      expect(() => factory.generateHtml('policy', undefined)).toThrow(ErrorManager);
      expect(() => factory.generateHtml('payment', null)).toThrow(ErrorManager);
      expect(() => factory.generateHtml('payment', undefined)).toThrow(ErrorManager);
    });

    it('debería lanzar BAD_REQUEST para tipo de reporte no soportado', () => {
      // Act & Assert
      expect(() => factory.generateHtml('invoice', mockPolicyData)).toThrow(ErrorManager);
      expect(() => factory.generateHtml('report', mockPolicyData)).toThrow(ErrorManager);
      expect(() => factory.generateHtml('unknown', mockPolicyData)).toThrow(ErrorManager);
      
      try {
        factory.generateHtml('invoice', mockPolicyData);
      } catch (error) {
        expect(error.message).toContain('Tipos válidos: policy, payment');
      }
    });

    it('debería incluir información específica en reporte de póliza', () => {
      // Act
      const result = factory.generateHtml('policy', mockPolicyData);

      // Assert - Verificar que contiene elementos específicos de póliza
      expect(result).toContain('Reporte de Póliza');
      expect(result).toContain('POL-001'); // Policy number
      expect(result).toContain('Ana María López Rodríguez'); // Customer name
    });

    it('debería manejar array vacío de pagos correctamente', () => {
      // Act & Assert
      expect(() => factory.generateHtml('payment', [])).not.toThrow();
      
      const result = factory.generateHtml('payment', []);
      expect(result).toContain('<!DOCTYPE html>');
    });

    it('debería lanzar BAD_REQUEST si pagos no es un array', () => {
      // Act & Assert
      expect(() => factory.generateHtml('payment', 'not-an-array')).toThrow(ErrorManager);
      expect(() => factory.generateHtml('payment', {})).toThrow(ErrorManager);
      expect(() => factory.generateHtml('payment', 123)).toThrow(ErrorManager);
      
      try {
        factory.generateHtml('payment', 'not-an-array');
      } catch (error) {
        expect(error.message).toContain('Los datos de pagos deben ser un array válido');
      }
    });

    it('debería generar HTML válido con estructura completa', () => {
      // Act
      const policyResult = factory.generateHtml('policy', mockPolicyData);
      const paymentResult = factory.generateHtml('payment', mockPaymentData);

      // Assert - Verificar estructura HTML básica
      [policyResult, paymentResult].forEach(html => {
        expect(html).toMatch(/<!DOCTYPE html>/);
        expect(html).toMatch(/<html[^>]*>/);
        expect(html).toMatch(/<head[^>]*>/);
        expect(html).toMatch(/<\/head>/);
        expect(html).toMatch(/<body[^>]*>/);
        expect(html).toMatch(/<\/body>/);
        expect(html).toMatch(/<\/html>/);
      });
    });

    it('debería incluir estilos CSS en el HTML generado', () => {
      // Act
      const result = factory.generateHtml('policy', mockPolicyData);

      // Assert
      expect(result).toContain('<style>');
      expect(result).toContain('</style>');
      expect(result).toContain('font-family');
    });

    it('debería incluir nota de confidencialidad', () => {
      // Act
      const policyResult = factory.generateHtml('policy', mockPolicyData);
      const paymentResult = factory.generateHtml('payment', mockPaymentData);

      // Assert
      [policyResult, paymentResult].forEach(html => {
        expect(html).toContain('NOTA DE CONFIDENCIALIDAD');
        expect(html).toContain('Ley Orgánica de Protección de Datos Personales');
      });
    });

    it('debería manejar múltiples pagos correctamente', () => {
      // Arrange
      const manyPayments = Array.from({ length: 10 }, (_, i) => ({
        value: `${(i + 1) * 100}.00`,
        pending_value: i % 2 === 0 ? '0.00' : '50.00',
        observations: `Pago ${i + 1}`,
        createdAt: `2023-${String(i + 1).padStart(2, '0')}-01`,
        policies: {
          numberPolicy: `POL-${String(i + 1).padStart(3, '0')}`,
          policyValue: `${(i + 1) * 500}.00`,
          customer: {
            numberPhone: '0999999999',
            firstName: `Cliente`,
            secondName: `${i + 1}`,
            surname: 'Apellido',
            secondSurname: 'Segundo',
          },
          company: {
            companyName: 'Seguros Test',
          },
          advisor: {
            firstName: 'Juan',
            secondName: 'Carlos',
            surname: 'Pérez',
            secondSurname: 'González',
          },
        },
        paymentStatus: {
          id: '1',
          statusNamePayment: 'Completado',
        },
      })) as PaymentReportDTO[];

      // Act
      const result = factory.generateHtml('payment', manyPayments);

      // Assert
      expect(result).toContain('<!DOCTYPE html>');
      expect(result.length).toBeGreaterThan(1000); // HTML más largo con más datos
      
      // Verificar que incluye algunos datos de pagos
      expect(result).toContain('POL-001');
      expect(result).toContain('POL-010');
    });
  });

  describe('Error Handling', () => {
    it('debería propagar ErrorManager correctamente', () => {
      // Act & Assert
      try {
        factory.generateHtml('unsupported', mockPolicyData);
      } catch (error) {
        expect(error).toBeInstanceOf(ErrorManager);
        expect(error.message).toContain('BAD_REQUEST');
      }
    });

    it('debería convertir errores internos a ErrorManager', () => {
      // Arrange - Forzar un error interno simulando datos malformados que causen problemas en el template
      const malformedData = {
        toString: () => { throw new Error('Internal template error'); }
      };

      // Act & Assert
      expect(() => factory.generateHtml('policy', malformedData)).toThrow(ErrorManager);
      
      try {
        factory.generateHtml('policy', malformedData);
      } catch (error) {
        expect(error.message).toContain('Error procesando datos de la póliza');
      }
    });

    it('debería validar entrada con mensajes descriptivos', () => {
      const testCases = [
        { type: '', data: mockPolicyData, expectedMessage: 'cadena válida' },
        { type: 'policy', data: null, expectedMessage: 'son requeridos' },
        { type: 'invalid-type', data: mockPolicyData, expectedMessage: 'no soportado' },
      ];

      testCases.forEach(({ type, data, expectedMessage }) => {
        try {
          factory.generateHtml(type, data);
          fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(ErrorManager);
          expect(error.message).toContain(expectedMessage);
        }
      });
    });
  });
});
