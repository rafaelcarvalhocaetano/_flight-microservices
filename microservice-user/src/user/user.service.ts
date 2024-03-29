import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { USER } from '../common/models/model';

@Injectable()
export class UserService {
  constructor(@InjectModel(USER.name) private readonly model: Model<User>) {}

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  async create(userDTO: CreateUserDto): Promise<User> {
    const hash = await this.hashPassword(userDTO.password);
    const newUser = new this.model({ ...userDTO, password: hash });
    return await newUser.save();
  }

  async findByUsername(username: string): Promise<User> {
    return await this.model.findOne({ username });
  }

  async findAll(): Promise<User[]> {
    return await this.model.find();
  }

  async findOne(id: string): Promise<User> {
    return await this.model.findById(id);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const hash = await this.hashPassword(updateUserDto.password);
    const newUser = { ...updateUserDto, password: hash };
    return await this.model.findByIdAndUpdate(id, newUser);
  }

  remove(id: string) {
    this.model.findByIdAndDelete(id);
  }

  async checkPassword(password: string, passwordDB: string): Promise<boolean> {
    return await bcrypt.compare(password, passwordDB);
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.findByUsername(username);
    const isValidPassword = await this.checkPassword(
      password,
      user.password,
    );
    if (user && isValidPassword) return user;
    return null;
  }
}
