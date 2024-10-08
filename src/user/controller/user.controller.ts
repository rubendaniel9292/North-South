import { Roles } from '@/auth/decorators/decorators';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserDTO } from '../dto/user.dto';
import { UserService } from '../services/user.service';

@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  //@AccessPublic()
  @Roles('ADMIN') //solo usuarios de tipo admin pordran agrear otros usuarios
  @Post('register')
  public async registerUser(@Body() body: UserDTO) {
    const newUser = await this.userService.createUser(body);
    if (newUser) {
      return {
        status: 'success',
        newUser,
      };
    }
  }
  @Roles('ADMIN') //Solo usuarios admin podran ver todos los usuarios
  @Get('all')
  public async findAllUsers() {
    const users = await this.userService.findUsers();
    if (users) {
      return {
        status: 'success',
        users,
      };
    }
  }
  @Roles('ADMIN', 'BASIC')
  @Get(':id')
  public async findUserById(@Param('id', new ParseUUIDPipe()) id: string) {
    const user = await this.userService.findUserById(id);
    return user;
  }
  @Roles('ADMIN') //solo usuarios de tipo admin pordran eliminar otros usuarios
  @Delete('delete/:id')
  public async deleteUser(@Param('id', new ParseUUIDPipe()) id: string) {
    const deletedUser = await this.userService.deleteUser(id);
    if (deletedUser) {
      return {
        status: 'success',
        deletedUser,
      };
    }
  }
}
