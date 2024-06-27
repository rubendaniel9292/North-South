import { UserDTO } from '../dto/user.dto';
import { UserService } from './../services/user.service';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Post('register')
  public async registerUser(@Body() body: UserDTO) {
    return await this.userService.createUser(body);
  }
  @Get(':id')
  public async findUserById(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.userService.findUserById(id);
  }
}
