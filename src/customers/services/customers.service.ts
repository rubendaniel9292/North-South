import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { ErrorManager } from '@/helpers/error.manager';
import { CustomersEntity } from '../entities/customer.entity';
import { ValidateEntity } from '@/helpers/validations';
import { CustomerDTO } from '../dto/customer.dto';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';

@Injectable()
export class CustomersService extends ValidateEntity {
  constructor(
    @InjectRepository(CustomersEntity)
    private readonly customerRepository: Repository<CustomersEntity>,
    private readonly redisService: RedisModuleService,
  ) {
    // Pasar el repositorio al constructor de la clase base
    super(customerRepository);
  }
  //1:metodo para registrar un cliente
  public createCustomer = async (
    body: CustomerDTO,
  ): Promise<CustomersEntity> => {
    try {
      // Primero validaR cédula y correo
      await this.validateInput(body, 'customer');
      body.firstName = body.firstName.toUpperCase();
      body.secondName = body.secondName.toUpperCase();
      body.surname = body.surname.toUpperCase()
      body.secondSurname = body.secondSurname.toUpperCase();
      const newCustomer = await this.customerRepository.save(body);

      console.log('Cliente guardado', newCustomer);
      // Invalida la caché de la lista de clientes
      await this.redisService.del('customers');

      return newCustomer;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //2: Método para obtener todos los clientes con las relaciones
  public getAllCustomers = async (
    search?: string,
  ): Promise<CustomersEntity[]> => {
    try {
      // Verificar si los datos están en Redis

      const cachedCustomer = await this.redisService.get('customers');
      if (cachedCustomer) {
        return JSON.parse(cachedCustomer);
      }
      // Crea un array de condiciones de búsqueda
      const whereConditions: any[] = [];

      if (search) {
        const searchCondition = Like(`%${search}%`);
        whereConditions.push(
          { firstName: searchCondition },
          { surname: searchCondition },
          { ci_ruc: searchCondition },
          { secondSurname: searchCondition },
          { secondName: searchCondition },
        );
      }

      const customers: CustomersEntity[] = await this.customerRepository.find({
        /*
        Objeto de selección: para  un control 
        más detallado sobre qué campos de las relaciones incluir en el resultado.
        */
        order: {
          id: "DESC",
        },
        where: whereConditions.length > 0 ? whereConditions : undefined,
        relations: ['civil', 'city', 'province', 'policies'],
        select: {
          civil: {
            id: true,
            status: true, // Solo selecciona el campo 'status', no el 'id'
          },
          city: {
            id: true,
            cityName: true, // Selecciona solo el nombre de la ciudad
          },
          province: {
            id: true,
            provinceName: true, // Selecciona solo el nombre de la provincia
          },
        },
      });

      if (!customers.length) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }

      await this.redisService.set(
        'customers',
        JSON.stringify(customers),
        32400,
      ); // TTL de 9 horas

      return customers;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //:3 Método para obtener todos los clientes con las relaciones por id
  public getCustomerById = async (id: number): Promise<CustomersEntity> => {
    try {

      const cachedCustomer = await this.redisService.get(`customer:${id}`);
      if (cachedCustomer) {
        return JSON.parse(cachedCustomer);
      }
      const customer: CustomersEntity = await this.customerRepository.findOne({
        where: { id },
        relations: [
          'civil',
          'city',
          'policies',
          'province',
          'policies.paymentFrequency',
          'policies.company',
          'policies.paymentMethod',
          'policies.policyStatus',
          'policies.policyType',
          'policies.advisor',
          'policies.bankAccount',
          'policies.bankAccount.bank',
          'policies.creditCard',
          'policies.creditCard.bank',
          'policies.payments',
          'policies.renewals',
        ],
        select: {
          city: {
            id: true,
            cityName: true, // Selecciona solo el nombre de la ciudad
          },
          province: {
            id: true,
            provinceName: true, // Selecciona solo el nombre de la provincia
          },
          civil: {
            id: true,
            status: true,
          },
          policies: {
            id: true,
            numberPolicy: true,
            coverageAmount: true,
            agencyPercentage: true,
            advisorPercentage: true,
            policyValue: true,
            numberOfPayments: true,
            startDate: true,
            endDate: true,
            paymentsToAdvisor: true,
            policyFee: true,
            renewalCommission: true,
            observations: true,
            bankAccount: {
              bank_id: true,
              bank: {
                bankName: true,
              },
            },
            creditCard: {
              bank_id: true,
              bank: {
                bankName: true,
              },
            },
          },
        },
      });
      if (!customer) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }

      await this.redisService.set(`customer:${id}`, JSON.stringify(customer), 32400);
      return customer;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //4: Método para actualizar un cliente  
  public updateCustomer = async (
    id: number,
    updateData: Partial<CustomersEntity>,
  ): Promise<CustomersEntity> => {
    try {
      const customer = await this.customerRepository.findOne({ where: { id } });
      if (!customer) {
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: 'No se encontró el cliente',
        });
      }
      // Convertir a mayúsculas y asignar de nuevo
      updateData.firstName = updateData.firstName.toUpperCase();
      updateData.secondName = updateData.secondName.toUpperCase();
      updateData.surname = updateData.surname.toUpperCase();
      updateData.secondSurname = updateData.secondSurname.toUpperCase();

      // Validar y asignar solo las propiedades permitidas de updateData
      Object.assign(customer, updateData);
      // Guardar el cliente actualizado en la base de datos
      const customerUpdated = await this.customerRepository.save(customer);

      // Limpiar todas las claves de caché relevantes
      await this.redisService.del(`customer:${id}`);
      await this.redisService.del('customers');

      // Actualizar caché con los datos más recientes
      await this.redisService.set(
        `customer:${id}`,
        JSON.stringify(customerUpdated),
        32400,
      );

      //console.log('Cliente actualizado:', customerUpdated);
      return customerUpdated;

    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  }
}