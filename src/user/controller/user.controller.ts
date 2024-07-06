import { UserDTO } from '../dto/user.dto';
import { UserService } from './../services/user.service';
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
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Roles } from 'src/auth/decorators/decorators';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  //@AccessPublic()
  @Roles('ADMIN') //solo usuarios de tipo admin pordran agrear otros usuarios
  @Post('register')
  public async registerUser(@Body() body: UserDTO) {
    return await this.userService.createUser(body);
  }
  @Roles('ADMIN') //Solo usuarios admin podran ver todos los usuarios
  @Get('all')
  public async findAllUsers() {
    const allUser = await this.userService.findUsers();
    return allUser;
  }
  @Roles('ADMIN', 'BASIC') //Solo usuarios admin podran ver un usuario
  @Get(':id')
  public async findUserById(@Param('id', new ParseUUIDPipe()) id: string) {
    const user = await this.userService.findUserById(id);
    return user;
  }
  @Roles('ADMIN') //solo usuarios de tipo admin pordran eliminar otros usuarios
  @Delete('delete/:id')
  public async deleteUser(@Param('id', new ParseUUIDPipe()) id: string) {
    const deletedUser = await this.userService.deleteUser(id);
    return deletedUser;
  }
}
