import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { registerUserSchema } from '@repo/shared/schemas/register-user.schema';
import { signInUserSchema } from '@repo/shared/schemas/sign-in-user.schema';
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe';
import { throwHttpExceptionFromResult } from './auth.errors';
import { AuthService } from './auth.service';
import type { RegisterUserDto } from './dtos/registerUser.dto';
import type { SignInUserDto } from './dtos/signInUser.dto';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UsePipes(new ZodValidationPipe(signInUserSchema))
  async signIn(@Body() signInDto: SignInUserDto) {
    const result = await this.authService.signIn(signInDto);

    if (!result.success) {
      throwHttpExceptionFromResult(result);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('register')
  @UsePipes(new ZodValidationPipe(registerUserSchema))
  async register(@Body() registerDto: RegisterUserDto) {
    const result = await this.authService.register(registerDto);

    if (!result.success) {
      throwHttpExceptionFromResult(result);
    }
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/logout')
  async logout(@Request() req: Request) {
    return req.logout();
  }
}
