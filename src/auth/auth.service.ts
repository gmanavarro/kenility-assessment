import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './auth.types';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: AuthCredentialsDto) {
    const { username, password } = registerDto;

    const existingUser = await this.usersService.findByUsername(username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.usersService.create(username, hashedPassword);

    const token = this.jwtService.sign({
      username: user.username,
      sub: user._id.toString(),
    });
    return { token };
  }

  async login(loginDto: AuthCredentialsDto) {
    const { username, password } = loginDto;
    const user = await this.usersService.findByUsername(username);

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const tokenPayload: JwtPayload = {
      sub: user._id.toString(),
    };

    const token = this.jwtService.sign(tokenPayload);
    return { token };
  }
}
