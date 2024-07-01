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
      return await this.userRepository.save(body);
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //2: metodo para listar todos los usuarios, el equivalente en sql SELECT * FROM users;
  public findUsers = async (): Promise<UserEntity[]> => {
    try {
      const users: UserEntity[] = await this.userRepository.find();
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
  public findUserById = async (id: string): Promise<UserEntity> => {
    try {
      const user: UserEntity = await this.userRepository
        .createQueryBuilder('user')
        .where({ id })
        .getOne();
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
