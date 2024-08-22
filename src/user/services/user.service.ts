import { UserEntity } from './../entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserDTO } from '../dto/user.dto';
import { DeleteResult, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt-updated';
import { ErrorManager } from 'src/helpers/error.manager';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}
  //1:metodo para crear usuarios que haran usos del sistema
  public createUser = async (body: UserDTO): Promise<UserEntity> => {
    try {
      const pwd = parseInt(process.env.HASH_SALT);
      body.password = await bcrypt.hash(body.password, pwd);

      // Verificar si el correo ya existe registrado
      //body.email! le dice al compilador que body.email no es null ni undefined
      const existingUser = await this.userRepository.findOne({
        where: { email: body.email!.toLowerCase() },
      });
      if (existingUser) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'El correo ya está registrado',
        });
      }
      const newUser = await this.userRepository.save(body);
      return newUser;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //2:
  public findUsers = async (): Promise<UserEntity[]> => {
    try {
      const users: UserEntity[] = await this.userRepository.find(); //obtener el listado de usuarios el equivalente en sql SELECT * FROM users;
      /*const [users, count] = await this.userRepository
        .createQueryBuilder()
        .getManyAndCount();*/
      if (users.length === 0) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }

      return users;
    } catch (error) {
      //se ejecuta el errir
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //3:metodo para buscar usuarios por id SELECT * FROM users WHERE id = '31850ef1-7e45-4164-a97f-066fea0c1016';
  public findUserById = async (uuid: string): Promise<UserEntity> => {
    try {
      /* otra manera igual funciona
      const user: UserEntity = await this.userRepository
        .createQueryBuilder('user')
        .where({ id })
        .getOne();*/
      const user = await this.userRepository.findOne({ where: { uuid } });

      if (!user) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      return user;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //4: metodo para la compracion de la contraseña
  public findAndCompare = async ({
    key,
    value,
  }: {
    key: keyof UserDTO;
    value: any;
  }) => {
    try {
      const user: UserEntity = await this.userRepository
        .createQueryBuilder('user')
        .addSelect('user.password') //incluir la contraseña en la consulta para su comparacon
        .where({ [key]: value })
        .getOne();
      return user;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //4: metodo para borrar usuarios por id, lo mismo que hacer DELETE FROM users WHERE id = '780a7470-f485-436e-816f-ce33c5cca75e';
  public deleteUser = async (id: string): Promise<DeleteResult | undefined> => {
    try {
      const user: DeleteResult = await this.userRepository.delete(id);
      if (user.affected === 0) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se pudo eliminar el usuario el usuario',
        });
      }
      return user;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}
