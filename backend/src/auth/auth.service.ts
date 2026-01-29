import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmployeesService } from '../employees/employees.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private employeesService: EmployeesService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateEmployee(rfc: string, password: string) {
    const employee = await this.employeesService.findByRfc(rfc);
    
    if (!employee || !employee.active) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, employee.passwordHash);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return {
      id: employee.id,
      rfc: employee.rfc,
      name: employee.name,
      type: 'employee',
    };
  }

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    
    if (!user || !user.active) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      type: 'user',
    };
  }

  async login(user: any, userType: string) {
    const payload = {
      sub: user.id,
      type: userType,
      ...(userType === 'employee' 
        ? { rfc: user.rfc, name: user.name }
        : { username: user.username, role: user.role }
      ),
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        type: userType,
        ...(userType === 'employee'
          ? { rfc: user.rfc, name: user.name }
          : { username: user.username, role: user.role }
        ),
      },
    };
  }
}
