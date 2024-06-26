import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
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
      body.password = await bcrypt.hash(body.password, pwd);
      return await this.userRepository.save(body);
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}
