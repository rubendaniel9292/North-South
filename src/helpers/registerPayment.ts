import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentService } from '../payment/services/payment.service';
import { PaymentEntity } from '../payment/entity/payment.entity';
import { PaymentDTO } from '@/payment/dto/payment.dto';
import { PolicyEntity } from '@/policy/entities/policy.entity';
import { DateHelper } from './date.helper';

@Injectable()
export class PaymentSchedulerService implements OnModuleInit {
  constructor(private readonly paymentService: PaymentService) { }

  /**
   * Función optimizada para verificar si hay pagos pendientes sin cargar todos los pagos en memoria
   * Esta función reemplaza el uso de getAllPayments() en onModuleInit para evitar memory leak
   * 
   * Implementación optimizada que:
   * 1. Usa COUNT en lugar de SELECT *
   * 2. Solo verifica pagos con pending_value > 0
   * 3. No carga relaciones innecesarias
   * 4. Retorna boolean directamente
   * 
   * @returns Promise<boolean> - true si hay pagos pendientes, false si no
   */
  private async checkIfPendingPaymentsExist(): Promise<boolean> {
    try {
      // Usar el método optimizado del PaymentService
      return await this.paymentService.checkPendingPaymentsExist();
    } catch (error) {
      console.error('Error al verificar pagos pendientes:', error);
      // En caso de error, devolver false para no bloquear la inicialización
      return false;
    }
  }

  async onModuleInit() {
    console.log('Inicializando módulo y verificando pagos pendientes...');
    try {
      // OPTIMIZACIÓN: Usar función que no carga todos los pagos en memoria
      const hasPendingPayments = await this.checkIfPendingPaymentsExist();
      
      if (hasPendingPayments) {
        console.log('Se encontraron pagos pendientes que deben procesarse. Procesando...');
        await this.processOverduePaymentsBatched();
      } else {
        console.log('No hay pagos pendientes que procesar. Módulo inicializado correctamente.');
      }
    } catch (error) {
      console.error('Error al verificar pagos al inicializar el módulo:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    try {
      await this.verifyAndProcessPaymentsBatched();
    } catch (error) {
      console.error('Error al verificar y procesar pagos en el cron job:', error);
    }
  }

  // Versión por lotes para el cron diario
  async verifyAndProcessPaymentsBatched() {
    const today = new Date();
    console.log(`Verificación diaria de pagos por lotes - ${today.toLocaleDateString('es-EC')}`);
    
    try {
      const totalPolicies = await this.paymentService.countPoliciesWithPendingPayments();
      
      if (totalPolicies === 0) {
        console.log('No hay pagos pendientes para procesar.');
        return;
      }

      const batchSize = this.getBatchSize(totalPolicies);
      const processedPolicies = new Set<number>();
      let totalProcessed = 0;
      let paymentsCreated = 0;
      
      for (let offset = 0; offset < totalPolicies; offset += batchSize) {
        const batchPayments = await this.paymentService.getPaymentsWithPendingValuePaginated(batchSize, offset);
        
        if (batchPayments.length === 0) break;

        for (const payment of batchPayments) {
          try {
            if (processedPolicies.has(payment.policy_id)) continue;
            if (payment.pending_value <= 0) continue;
            
            const policy = await this.paymentService.getPolicyWithPayments(payment.policy_id);
            processedPolicies.add(payment.policy_id);
            totalProcessed++;
            
            if (!policy.renewals) policy.renewals = [];
            if (policy.policy_status_id == 2 || policy.policy_status_id == 3) continue;
            
            const isRenewed = this.isPolicyRenewed(policy);
            let maxAllowedPayments = policy.numberOfPayments;
            if (isRenewed && policy.renewals && policy.renewals.length > 0) {
              maxAllowedPayments = policy.numberOfPayments * (policy.renewals.length + 1);
            }
            const currentPaymentsCount = policy.payments.length;
            if (currentPaymentsCount >= maxAllowedPayments && payment.pending_value <= 0) continue;
            
            // 🔧 CREAR TODOS LOS PAGOS FALTANTES HASTA HOY (bucle)
            // CRÍTICO: Usar el ÚLTIMO pago de la póliza como base, no el primero con pending_value
            const allPolicyPayments = policy.payments.filter(p => p.policy_id === payment.policy_id);
            const lastPayment = allPolicyPayments.sort((a, b) => b.number_payment - a.number_payment)[0];
            let currentPayment = lastPayment || payment;
            let paymentsCreatedForThisPolicy = 0;
            const maxIterations = 100; // Protección contra bucle infinito
            let iterations = 0;
            const createdPaymentsDates: string[] = [];
            
            while (iterations < maxIterations) {
              iterations++;
              
              const nextPaymentDate = this.calculateNextPaymentDate(currentPayment, policy);
              if (!nextPaymentDate) break;
              
              const todayNorm = DateHelper.normalizeDateForComparison(today);
              const nextPaymentDateNorm = DateHelper.normalizeDateForComparison(nextPaymentDate);

              // Si la fecha del próximo pago es HOY o ANTERIOR
              if (nextPaymentDateNorm.getTime() <= todayNorm.getTime()) {
                const createdPayment = await this.createOverduePayment(currentPayment, policy, nextPaymentDateNorm);
                if (createdPayment) {
                  paymentsCreated++;
                  paymentsCreatedForThisPolicy++;
                  createdPaymentsDates.push(nextPaymentDateNorm.toISOString().split('T')[0]);
                  // Actualizar el pago actual para calcular el siguiente
                  currentPayment = createdPayment;
                  // Actualizar la póliza con el nuevo pago
                  policy.payments.push(createdPayment);
                } else {
                  break;
                }
              } else {
                break;
              }
              
              // Verificar límite de pagos
              if (policy.payments.length >= maxAllowedPayments) {
                break;
              }
            }
            
            if (paymentsCreatedForThisPolicy > 0) {
              console.log(`✓ ${policy.numberPolicy || `Póliza ${policy.id}`}: ${paymentsCreatedForThisPolicy} pagos [${createdPaymentsDates.join(', ')}]`);
            }
            
          } catch (error) {
            console.error(`Error procesando pago ${payment.id}:`, error);
            continue;
          }
        }
        
        // Pequeña pausa entre lotes
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Resumen consolidado solo si se procesó algo
      if (totalProcessed > 0) {
        console.log(`✅ Verificación diaria por lotes completada: ${totalProcessed} pólizas verificadas, ${paymentsCreated} pagos creados`);
      }
    } catch (error) {
      console.error('Error en la verificación diaria por lotes:', error);
      throw error;
    }
  }

  // PROCESA SOLO PAGOS VENCIDOS (evita duplicados por fecha) - OPTIMIZADO CON LOTES
  async processOverduePaymentsBatched() {
    const today = new Date();
    console.log(`Procesando pagos vencidos desde ${today.toLocaleDateString('es-EC')} (usando procesamiento por lotes)`);
    
    try {
      // Obtener el total de pólizas con pagos pendientes
      const totalPolicies = await this.paymentService.countPoliciesWithPendingPayments();
      
      if (totalPolicies === 0) {
        console.log('No hay pagos pendientes para procesar.');
        return;
      }

      // Calcular tamaño de lote dinámico basado en el volumen
      const batchSize = this.getBatchSize(totalPolicies);
      const totalBatches = Math.ceil(totalPolicies / batchSize);
      
      console.log(`📊 Total de registros: ${totalPolicies}, Lotes de ${batchSize}, Total de lotes: ${totalBatches}`);

      const processedPolicies = new Set<number>();
      let totalProcessed = 0;
      let paymentsCreated = 0;
      let skippedPolicies = 0;
      let currentBatch = 1;

      // Procesar por lotes
      for (let offset = 0; offset < totalPolicies; offset += batchSize) {
        console.log(`🔄 Procesando lote ${currentBatch}/${totalBatches} (registros ${offset + 1}-${Math.min(offset + batchSize, totalPolicies)})`);
        
        // Obtener el lote actual
        const batchPayments = await this.paymentService.getPaymentsWithPendingValuePaginated(batchSize, offset);
        
        if (batchPayments.length === 0) {
          console.log(`✅ Lote ${currentBatch} vacío, finalizando procesamiento`);
          break;
        }

        // Procesar cada pago del lote actual
        for (const payment of batchPayments) {
          try {
            if (processedPolicies.has(payment.policy_id)) continue;
            if (payment.pending_value <= 0) continue;
            
            const policy = await this.paymentService.getPolicyWithPayments(payment.policy_id);
            
            // Marcar como procesada inmediatamente
            processedPolicies.add(payment.policy_id);
            totalProcessed++;
            
            if (policy.policy_status_id == 2 || policy.policy_status_id == 3) {
              skippedPolicies++;
              continue;
            }
            
            const isRenewed = this.isPolicyRenewed(policy);
            let relevantPayments = policy.payments.filter(p => p.policy_id === payment.policy_id);
            if (isRenewed) {
              const lastRenewalDate = this.getLastRenewalDate(policy);
              relevantPayments = relevantPayments.filter(
                p => DateHelper.normalizeDateForComparison(p.createdAt) >= lastRenewalDate
              );
            }
            if (relevantPayments.length >= policy.numberOfPayments) {
              continue;
            }
            
            // 🔧 CREAR TODOS LOS PAGOS FALTANTES HASTA HOY (bucle)
            let currentPayment = payment;
            let paymentsCreatedForThisPolicy = 0;
            const maxIterations = 100; // Protección contra bucle infinito
            let iterations = 0;
            
            // 🔧 CRÍTICO: Usar el ÚLTIMO pago de la póliza como base, no el primero con pending_value
            const allPolicyPayments = policy.payments.filter(p => p.policy_id === payment.policy_id);
            const lastPayment = allPolicyPayments.sort((a, b) => b.number_payment - a.number_payment)[0];
            currentPayment = lastPayment || payment;
            
            const createdPaymentsDates: string[] = [];
            
            while (iterations < maxIterations) {
              iterations++;
              
              const nextPaymentDate = this.calculateNextPaymentDate(currentPayment, policy);
              if (!nextPaymentDate) break;
              
              const todayNorm = DateHelper.normalizeDateForComparison(today);
              const nextPaymentDateNorm = DateHelper.normalizeDateForComparison(nextPaymentDate);

              // Si la fecha del próximo pago es HOY o ANTERIOR
              if (nextPaymentDateNorm.getTime() <= todayNorm.getTime()) {
                const createdPayment = await this.createOverduePayment(currentPayment, policy, nextPaymentDateNorm);
                if (createdPayment) {
                  paymentsCreated++;
                  paymentsCreatedForThisPolicy++;
                  createdPaymentsDates.push(nextPaymentDateNorm.toISOString().split('T')[0]);
                  // Actualizar el pago actual para calcular el siguiente
                  currentPayment = createdPayment;
                  // Actualizar la póliza con el nuevo pago
                  policy.payments.push(createdPayment);
                } else {
                  break;
                }
              } else {
                break;
              }
              
              // Verificar si ya se completó el ciclo
              const updatedRelevantPayments = policy.payments.filter(p => p.policy_id === payment.policy_id);
              if (updatedRelevantPayments.length >= policy.numberOfPayments) {
                break;
              }
            }
            
            if (paymentsCreatedForThisPolicy > 0) {
              console.log(`✓ ${policy.numberPolicy || `Póliza ${policy.id}`}: ${paymentsCreatedForThisPolicy} pagos [${createdPaymentsDates.join(', ')}]`);
            }
            
          } catch (error) {
            console.error(`Error procesando pago ${payment.id}:`, error);
          }
        }

        // Progreso del lote
        console.log(`✅ Lote ${currentBatch} completado`);
        currentBatch++;

        // Pequeña pausa entre lotes para no sobrecargar el sistema
        if (currentBatch <= totalBatches) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Resumen consolidado final
      console.log(`🎉 Procesamiento por lotes completado: ${totalProcessed} pólizas procesadas, ${paymentsCreated} pagos creados, ${skippedPolicies} pólizas omitidas (canceladas/culminadas)`);
      
    } catch (error) {
      console.error('Error en el procesamiento por lotes:', error);
      throw error;
    }
  }

  /**
   * Detecta automáticamente la capacidad del servidor basándose en las especificaciones del sistema
   */
  private detectServerCapacity(): 'basic' | 'intermediate' | 'high' {
    try {
      const os = require('os');
      const totalMemoryGB = os.totalmem() / (1024 * 1024 * 1024); // Convertir bytes a GB
      const cpuCount = os.cpus().length;
      
      console.log(`🖥️ Especificaciones del servidor: ${totalMemoryGB.toFixed(1)}GB RAM, ${cpuCount} vCPU`);
      
      // Clasificación automática basada en recursos del sistema
      if (totalMemoryGB >= 12 && cpuCount >= 6) {
        console.log('📊 Servidor clasificado como: HIGH CAPACITY');
        return 'high';        // 12GB+ RAM y 6+ vCPU = Servidor potente
      } else if (totalMemoryGB >= 6 && cpuCount >= 4) {
        console.log('📊 Servidor clasificado como: INTERMEDIATE CAPACITY');
        return 'intermediate'; // 6-12GB RAM y 4-6 vCPU = Servidor intermedio
      } else {
        console.log('📊 Servidor clasificado como: BASIC CAPACITY (conservador)');
        return 'basic';       // < 6GB RAM o < 4 vCPU = Servidor básico
      }
    } catch (error) {
      console.warn('⚠️ No se pudo detectar capacidad del servidor, usando modo básico por seguridad');
      return 'basic'; // Fallback seguro
    }
  }

  /**
   * Calcula el tamaño de lote dinámico basado en el volumen total y capacidad AUTO-DETECTADA del servidor
   * 
   * DETECCIÓN AUTOMÁTICA:
   * - Básico: < 6GB RAM o < 4 vCPU (incluye tu servidor 2GB/2vCPU)
   * - Intermedio: 6-12GB RAM y 4-6 vCPU  
   * - Alto: 12GB+ RAM y 6+ vCPU
   * 
   * El sistema se ajusta automáticamente sin cambios manuales
   */
  private getBatchSize(totalPolicies: number): number {
    // DETECCIÓN AUTOMÁTICA: Ya no necesitas cambiar esto manualmente
    type ServerCapacity = 'basic' | 'intermediate' | 'high';
    const SERVER_CAPACITY: ServerCapacity = this.detectServerCapacity();
    
    // Factores de escalamiento por capacidad del servidor
    const capacityMultipliers: Record<ServerCapacity, number> = {
      basic: 1,        // Servidor básico (conservador)
      intermediate: 2, // Servidor intermedio (2x más capacidad)
      high: 4          // Servidor potente (4x más capacidad)
    };
    
    const multiplier = capacityMultipliers[SERVER_CAPACITY];
    
    // Tamaños base optimizados por volumen (AJUSTADO PARA SERVIDOR 2GB RAM / 2 vCPU)
    let baseBatchSize: number;
    
    if (totalPolicies < 100) {
      baseBatchSize = 15;              // Pocas pólizas: lotes pequeños (era 25)
    } else if (totalPolicies < 500) {
      baseBatchSize = 20;              // Volumen bajo-medio: lotes pequeños (era 50)
    } else if (totalPolicies < 1000) {
      baseBatchSize = 15;              // Volumen medio: lotes pequeños (era 35)
    } else if (totalPolicies < 5000) {
      baseBatchSize = 10;              // Volumen alto: lotes muy pequeños (era 25)
    } else {
      baseBatchSize = 8;               // Volumen muy alto: lotes ultra pequeños (era 15)
    }
    
    // Aplicar multiplicador de capacidad del servidor
    const scaledBatchSize = baseBatchSize * multiplier;
    
    // Límites de seguridad para evitar sobrecargas (AJUSTADO PARA SERVIDOR 2GB RAM)
    const maxBatchSizes: Record<ServerCapacity, number> = {
      basic: 50,       // Máximo conservador para 2GB RAM (era 100)
      intermediate: 150, // Para servidores 4-8GB RAM (era 250)
      high: 300        // Para servidores 16GB+ RAM (era 500)
    };
    
    const maxBatchSize = maxBatchSizes[SERVER_CAPACITY];
    const minBatchSize = 10;
    
    const finalBatchSize = Math.max(minBatchSize, Math.min(scaledBatchSize, maxBatchSize));
    
    console.log(`📊 Configuración de lotes: Servidor=${SERVER_CAPACITY}, Base=${baseBatchSize}, Escalado=${scaledBatchSize}, Final=${finalBatchSize}`);
    
    return finalBatchSize;
  }

  // PROCESA SOLO PAGOS VENCIDOS (evita duplicados por fecha) - OPTIMIZADO
  async processOverduePaymentsOnly() {
    const today = new Date();
    console.log(`Procesando pagos vencidos desde ${today.toLocaleDateString('es-EC')}`);

    // OPTIMIZACIÓN: Solo obtener pagos con pending_value > 0 en lugar de TODOS
    const payments = await this.paymentService.getPaymentsWithPendingValue();
    if (payments.length === 0) {
      console.log('No hay pagos pendientes para procesar.');
      return;
    }

    const processedPolicies = new Set<number>();
    let totalProcessed = 0;
    let paymentsCreated = 0;
    let skippedPolicies = 0;

    for (const payment of payments) {
      try {
        if (processedPolicies.has(payment.policy_id)) continue;
        if (payment.pending_value <= 0) continue;

        const policy = await this.paymentService.getPolicyWithPayments(payment.policy_id);

        // Marcar como procesada inmediatamente para evitar logs duplicados
        processedPolicies.add(payment.policy_id);
        totalProcessed++;

        if (policy.policy_status_id == 2 || policy.policy_status_id == 3) {
          skippedPolicies++;
          continue;
        }

        const isRenewed = this.isPolicyRenewed(policy);
        let relevantPayments = policy.payments.filter(p => p.policy_id === payment.policy_id);
        if (isRenewed) {
          const lastRenewalDate = this.getLastRenewalDate(policy);
          relevantPayments = relevantPayments.filter(
            p => DateHelper.normalizeDateForComparison(p.createdAt) >= lastRenewalDate
          );
        }
        if (relevantPayments.length >= policy.numberOfPayments) {
          continue;
        }

        const nextPaymentDate = this.calculateNextPaymentDate(payment, policy);
        const todayNorm = DateHelper.normalizeDateForComparison(today);
        const nextPaymentDateNorm = DateHelper.normalizeDateForComparison(nextPaymentDate);

        // SOLO crear pago si la fecha del próximo pago es HOY o ANTES
        if (nextPaymentDateNorm.getTime() === todayNorm.getTime()) {
          const createdPayment = await this.createOverduePayment(payment, policy, nextPaymentDateNorm);
          if (createdPayment) {
            paymentsCreated++;
          }
        }
      } catch (error) {
        console.error(`Error procesando pago ${payment.id}:`, error);
      }
    }

    // Resumen consolidado
    console.log(`✅ Procesamiento completado: ${totalProcessed} pólizas procesadas, ${paymentsCreated} pagos creados, ${skippedPolicies} pólizas omitidas (canceladas/culminadas)`);
  }

  async verifyAndProcessPayments() {
    const today = new Date();
    // OPTIMIZACIÓN: Solo obtener pagos con pending_value > 0
    const payments = await this.paymentService.getPaymentsWithPendingValue();
    if (payments.length === 0) {
      console.log('No hay pagos pendientes para procesar.');
      return;
    }

    const processedPolicies = new Set<number>();
    let totalProcessed = 0;
    let paymentsCreated = 0;

    for (const payment of payments) {
      try {
        if (processedPolicies.has(payment.policy_id)) continue;
        if (payment.pending_value <= 0) continue;

        const policy = await this.paymentService.getPolicyWithPayments(payment.policy_id);
        processedPolicies.add(payment.policy_id);
        totalProcessed++;

        if (!policy.renewals) policy.renewals = [];
        if (policy.policy_status_id == 2 || policy.policy_status_id == 3) continue;

        const isRenewed = this.isPolicyRenewed(policy);
        let maxAllowedPayments = policy.numberOfPayments;
        if (isRenewed && policy.renewals && policy.renewals.length > 0) {
          maxAllowedPayments = policy.numberOfPayments * (policy.renewals.length + 1);
        }
        const currentPaymentsCount = policy.payments.length;
        if (currentPaymentsCount >= maxAllowedPayments && payment.pending_value <= 0) continue;

        const nextPaymentDate = this.calculateNextPaymentDate(payment, policy);
        const todayNorm = DateHelper.normalizeDateForComparison(today);
        const nextPaymentDateNorm = DateHelper.normalizeDateForComparison(nextPaymentDate);

        // SOLO crear pago si la fecha del próximo pago es HOY exactamente
        if (nextPaymentDateNorm.getTime() === todayNorm.getTime()) {
          const createdPayment = await this.createOverduePayment(payment, policy, nextPaymentDateNorm);
          if (createdPayment) {
            paymentsCreated++;
          }
        }
      } catch (error) {
        console.error(`Error procesando pago ${payment.id}:`, error);
        continue;
      }
    }

    // Resumen consolidado solo si se procesó algo
    if (totalProcessed > 0) {
      console.log(`✅ Verificación diaria completada: ${totalProcessed} pólizas verificadas, ${paymentsCreated} pagos creados`);
    }
  }

  // Método para crear un pago solo si NO existe pago para esa fecha
  async createOverduePayment(payment: PaymentEntity, policy: PolicyEntity, paymentDueDate: Date, observationText?: string): Promise<PaymentEntity | null> {
    try {
      if (policy.policy_status_id == 2 || policy.policy_status_id == 3) {
        return null;
      }
      if (!policy.payments) {
        return null;
      }
      if (!policy.renewals) policy.renewals = [];
      if (payment.pending_value <= 0) {
        return null;
      }

      // Validar que NO exista un pago en esa fecha
      const alreadyExistsForDate = policy.payments.some(p =>
        DateHelper.normalizeDateForComparison(p.createdAt).getTime() === paymentDueDate.getTime()
      );
      if (alreadyExistsForDate) {
        return null;
      }

      // Calcular el siguiente número de pago
      let currentPolicyPayments = policy.payments.filter(p => p.policy_id === payment.policy_id);
      const totalPaymentsInCycle = Number(policy.numberOfPayments);
      const maxNumberPayment = Math.max(
        ...currentPolicyPayments.map((p) => p.number_payment),
        0
      );
      const nextPaymentNumber = maxNumberPayment + 1;

      // Chequeo extra por número de pago (defensivo)
      const existingPayment = currentPolicyPayments.find(p => p.number_payment === nextPaymentNumber);
      if (existingPayment) {
        return null;
      }

      // Calcular valor del pago y saldo pendiente
      const valueToPay = Number(policy.policyValue) / totalPaymentsInCycle;
      let newPendingValue: number;
      const isLastPaymentInCycle = (nextPaymentNumber % totalPaymentsInCycle === 0);
      if (isLastPaymentInCycle) {
        newPendingValue = 0;
      } else {
        const positionInCycle = nextPaymentNumber % totalPaymentsInCycle || totalPaymentsInCycle;
        const remainingPaymentsInCycle = totalPaymentsInCycle - positionInCycle;
        newPendingValue = remainingPaymentsInCycle * valueToPay;
      }
      if (newPendingValue < 0) newPendingValue = 0;

      const newPayment: PaymentDTO = {
        policy_id: payment.policy_id,
        number_payment: nextPaymentNumber,
        value: valueToPay,
        pending_value: Number(newPendingValue.toFixed(2)),
        credit: 0,
        balance: valueToPay,
        total: 0,
        status_payment_id: 1,
        observations: observationText || 'Pago generado automáticamente según la fecha de pago',
        createdAt: paymentDueDate, // fecha de vencimiento, NO la actual
      };

      const savedPayment = await this.paymentService.createPayment(newPayment);
      return savedPayment;
    } catch (error) {
      console.error('Error al crear pago:', error);
      throw error;
    }
  }

  // Cálculo de próxima fecha de pago
  calculateNextPaymentDate(payment: PaymentEntity, policy?: PolicyEntity): Date | null {
    if (!payment.createdAt) {
      console.error(`No se puede calcular la próxima fecha de pago para el pago ID: ${payment.id} (falta createdAt).`);
      return null;
    }
    
    // Intentar obtener la frecuencia desde el payment o desde la policy
    let paymentFrequencyId: number;
    
    if (payment.policies?.paymentFrequency) {
      paymentFrequencyId = Number(payment.policies.paymentFrequency.id);
    } else if (policy?.payment_frequency_id) {
      paymentFrequencyId = Number(policy.payment_frequency_id);
    } else {
      console.error(`No se puede calcular la próxima fecha de pago para el pago ID: ${payment.id} (falta frecuencia).`);
      return null;
    }
    
    const lastPaymentDate = DateHelper.normalizeDateForComparison(new Date(payment.createdAt));
    if (isNaN(lastPaymentDate.getTime())) {
      console.error(`Fecha de último pago inválida para el pago ID: ${payment.id}.`);
      return null;
    }
    const nextDate = new Date(lastPaymentDate);
    switch (paymentFrequencyId) {
      case 1: // Mensual
      case 5: // Otro pago (Mensual)
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 2: // Trimestral
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 3: // Semestral
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case 4: // Anual
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        console.error(`Frecuencia de pago no válida para el pago ID: ${payment.id}.`);
        return null;
    }
    return nextDate;
  }

  // Métodos auxiliares igual que en tu código original
  isPolicyRenewed(policy: PolicyEntity): boolean {
    if (!policy.renewals || policy.renewals.length === 0) {
      return false;
    }
    return true;
  }

  getLastRenewalDate(policy: PolicyEntity): Date {
    if (!policy.renewals || policy.renewals.length === 0) {
      return new Date(policy.startDate);
    }
    const sortedRenewals = [...policy.renewals].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const lastRenewal = sortedRenewals[0];
    return new Date(lastRenewal.createdAt);
  }

  // Manual para pruebas (VERSIÓN OPTIMIZADA POR LOTES)
  async manualProcessPayments() {
    console.log('Iniciando procesamiento manual de pagos por lotes...');
    try {
      // Obtener el total de pólizas con pagos pendientes
      const totalPolicies = await this.paymentService.countPoliciesWithPendingPayments();
      
      if (totalPolicies === 0) {
        console.log('No hay pagos pendientes para procesar.');
        return { 
          message: 'No hay pagos pendientes para procesar.',
          createdPayments: [],
          totalProcessed: 0
        };
      }

      // Usar lotes para el procesamiento manual también
      const batchSize = this.getBatchSize(totalPolicies);
      const totalBatches = Math.ceil(totalPolicies / batchSize);
      
      console.log(`📊 Procesamiento manual: ${totalPolicies} registros, lotes de ${batchSize}, total de lotes: ${totalBatches}`);

      const createdPayments = [];
      const processedPolicies = new Set<number>();
      let currentBatch = 1;
      
      // Procesar por lotes
      for (let offset = 0; offset < totalPolicies; offset += batchSize) {
        console.log(`🔄 Procesando lote manual ${currentBatch}/${totalBatches} (registros ${offset + 1}-${Math.min(offset + batchSize, totalPolicies)})`);
        
        // Obtener el lote actual
        const batchPayments = await this.paymentService.getPaymentsWithPendingValuePaginated(batchSize, offset);
        
        if (batchPayments.length === 0) {
          console.log(`✅ Lote ${currentBatch} vacío, finalizando procesamiento manual`);
          break;
        }

        // Procesar cada pago del lote
        for (const payment of batchPayments) {
          try {
            if (processedPolicies.has(payment.policy_id)) continue;
            
            const policy = await this.paymentService.getPolicyWithPayments(payment.policy_id);
            if (!policy.renewals) policy.renewals = [];
            
            if (policy.policy_status_id == 2 || policy.policy_status_id == 3) {
              processedPolicies.add(payment.policy_id);
              continue;
            }
            
            const nextPaymentDate = this.calculateNextPaymentDate(payment, policy);
            const nextPaymentDateNorm = DateHelper.normalizeDateForComparison(nextPaymentDate);
            const newPayment = await this.createOverduePayment(payment, policy, nextPaymentDateNorm, 'Pago generado de manera manual');
            
            if (newPayment) {
              createdPayments.push(newPayment);
            }
            
            processedPolicies.add(payment.policy_id);
          } catch (error) {
            console.error(`Error procesando pago manual ${payment.id}:`, error);
          }
        }

        // Progreso del lote
        console.log(`✅ Lote manual ${currentBatch} completado`);
        currentBatch++;

        // Pequeña pausa entre lotes para no sobrecargar
        if (currentBatch <= totalBatches) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`🎉 Procesamiento manual por lotes completado: ${processedPolicies.size} pólizas procesadas, ${createdPayments.length} pagos creados`);
      
      return { 
        message: `Procesamiento manual completado: ${createdPayments.length} pagos creados`,
        createdPayments,
        totalProcessed: processedPolicies.size,
        totalBatches
      };
    } catch (error) {
      console.error('Error en el procesamiento manual por lotes:', error);
      throw error;
    }
  }

  // Versión original mantenida como fallback (DEPRECADA - usar la versión por lotes)
  async manualProcessPaymentsLegacy() {
    console.log('Iniciando procesamiento manual de pagos (versión legacy)...');
    try {
      // OPTIMIZACIÓN: Solo obtener pagos con pending_value > 0
      const payments = await this.paymentService.getPaymentsWithPendingValue();
      if (payments.length === 0) {
        console.log('No hay pagos pendientes para procesar.');
        return { message: 'No hay pagos pendientes para procesar.' };
      }
      const createdPayments = [];
      const processedPolicies = new Set<number>();
      for (const payment of payments) {
        if (processedPolicies.has(payment.policy_id)) continue;
        const policy = await this.paymentService.getPolicyWithPayments(payment.policy_id);
        if (!policy.renewals) policy.renewals = [];
        if (policy.policy_status_id == 2 || policy.policy_status_id == 3) {
          processedPolicies.add(payment.policy_id);
          continue;
        }
        const nextPaymentDate = this.calculateNextPaymentDate(payment, policy);
        const nextPaymentDateNorm = DateHelper.normalizeDateForComparison(nextPaymentDate);
        const newPayment = await this.createOverduePayment(payment, policy, nextPaymentDateNorm, 'Pago generado de manera manual');
        if (newPayment) createdPayments.push(newPayment);
        processedPolicies.add(payment.policy_id);
      }
      console.log('Procesamiento manual completado!!...');
      return { createdPayments };
    } catch (error) {
      console.error('Error en el procesamiento manual:', error);
      throw error;
    }
  }
}