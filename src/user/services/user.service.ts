import { UserEntity } from './../entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserDTO } from '../dto/user.dto';
import { Repository } from 'typeorm';
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
      console.log('Hashed password:', body.password);
      body.password = await bcrypt.hash(body.password, pwd);
      return await this.userRepository.save(body);
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //2:metodo para buscar usuarios por id
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

  //3: metodo para la compracion de la contraseña
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
}
