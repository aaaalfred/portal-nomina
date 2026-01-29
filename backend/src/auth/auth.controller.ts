import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoginDto } from './dto/login.dto';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Login de empleado (RFC)' })
  @ApiBody({ type: LoginDto })
  @UseGuards(LocalAuthGuard)
  @Post('login/employee')
  async loginEmployee(@Request() req) {
    return this.authService.login(req.user, 'employee');
  }

  @ApiOperation({ summary: 'Login de usuario (nóminas/admin)' })
  @ApiBody({ type: LoginDto })
  @UseGuards(LocalAuthGuard)
  @Post('login/user')
  async loginUser(@Request() req) {
    return this.authService.login(req.user, 'user');
  }
}
