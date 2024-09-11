import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { ErrorManager } from '@/helpers/error.manager';
import { CustomersEntity } from '../entities/customer.entity';
import { ValidateEntity } from '@/helpers/validations';
import { CustomerDTO } from '../dto/customer.dto';

@Injectable()
export class CustomersService extends ValidateEntity {
  constructor(
    @InjectRepository(CustomersEntity)
    private readonly customerRepository: Repository<CustomersEntity>,
  ) {
    // Pasar el repositorio al constructor de la clase base
    super(customerRepository);
  }
  //1:metodo para registrar un cliente
  public createCustomer = async (
    body: CustomerDTO,
  ): Promise<CustomersEntity> => {
    try {
      // Primero validamos cédula y correo
      await this.validateInput(body, 'customer');
      const newCustomer = await this.customerRepository.save(body);
      //consulta futura para la eliminacion del usuario no se aconseja en produccion
      //await this.customersRepository.query(`TRUNCATE TABLE customers RESTART IDENTITY CASCADE`);

      console.log(newCustomer);
      return newCustomer;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  // Método para obtener todos los clientes con las relaciones
  public getAllCustomers = async (): Promise<CustomersEntity[]> => {
    try {
      /* euivalente en sql a 
      --consulta de ejemplo 2 asegurarte de que los registros se muestran incluso si alguna relación está rota o faltante
SELECT 
    c.id,
    c.ci_ruc,
    c.first_name,
    c.second_name,
    c.surname,
    c.second_surname,
    cs.status,
    c.birthdate,
    c.email,
    c.number_phone,
    c.address,
    c.personal_data,
    ci.city_name,
    p.province_name
FROM 
    customers c
LEFT JOIN 
    province pro ON c.province_id = pro.id
LEFT JOIN 
    city ci ON c.city_id = ci.id
LEFT JOIN 
    province p ON ci.province_id = p.id
LEFT JOIN 
    civil_status cs ON c.status_id = cs.id;

      */
      const customers: CustomersEntity[] = await this.customerRepository.find({
        /* Array de strings: para seleccionar campos específicos del objeto principal 
        y estás de acuerdo con traer todos los campos de las relaciones.
    select: [
    'id',
    'ci_ruc',
    'firstName',
    'secondName',
    'surname',
    'secondSurname',
    'birthdate',
    'email',
    'numberPhone',
    'address',
    'personalData',
  ], */
        /*
  Objeto de selección: para cuando necesites un control 
  más detallado sobre qué campos de las relaciones quieres incluir en el resultado.
  */
        relations: ['civil', 'city', 'province'],
        select: {
          id: true,
          ci_ruc: true,
          firstName: true,
          secondName: true,
          surname: true,
          secondSurname: true,
          birthdate: true,
          email: true,
          numberPhone: true,
          address: true,
          personalData: true,
          civil: {
            status: true, // Solo selecciona el campo 'status', no el 'id'
          },
          city: {
            cityName: true, // Selecciona solo el nombre de la ciudad
          },
          province: {
            provinceName: true, // Selecciona solo el nombre de la provincia
          },
        },
      });

      return customers;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}