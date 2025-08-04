import { Roles } from '@/auth/decorators/decorators';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UpdateUserDTO, UserDTO } from '../dto/user.dto';
import { UserService } from '../services/user.service';
import { TaskDTO } from '../dto/task.dto';

@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) { }

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
    return {
      status: 'success',
      user,
    };
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

  @Roles('ADMIN') //solo usuarios de tipo admin pordran actualizar otros usuarios
  @Put(':id')
  public async updateUser(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateDto: Partial<UpdateUserDTO>
  ) {
    const updatedUser = await this.userService.updateUser(id, updateDto);
    return {
      status: 'success',
      updatedUser,
    };
  }

  @Roles('BASIC', 'ADMIN')
  @Post(':id/tasks')
  public async createTask(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: TaskDTO
  ) {
    const newTask = await this.userService.createTask(id, body);
    return {
      status: 'success',
      newTask,
    };
  }

  @Roles('BASIC', 'ADMIN')
  @Get('get-task/:id/tasks')
  public async getTasksByUserId(@Param('id', new ParseUUIDPipe()) id: string) {
    const tasks = await this.userService.getTasksByUserId(id);
    return {
      status: 'success',
      tasks,
    };
  }

  @Roles('BASIC', 'ADMIN')
  @Delete('delete-tasks/:taskId')
  public async deleteTask(
    @Param('taskId', new ParseIntPipe()) taskId: number, // Corregido: agregado 'new'
  ) {
    const deleteTask = await this.userService.deleteTask(taskId);
    return {
      status: 'success',
      deleteTask,
    };
  }
}
