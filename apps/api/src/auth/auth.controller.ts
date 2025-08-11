import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
} from '@nestjs/common';
import { registerUserSchema } from '@repo/shared/schemas/register-user.schema';
import { signInUserSchema } from '@repo/shared/schemas/sign-in-user.schema';
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';
import type { RegisterUserDto } from './dtos/registerUser.dto';
import type { SignInUserDto } from './dtos/signInUser.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UsePipes(new ZodValidationPipe(signInUserSchema))
  signIn(@Body() signInDto: SignInUserDto) {
    console.log('Signing in user:', signInDto);
    return this.authService.signIn(signInDto);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  @UsePipes(new ZodValidationPipe(registerUserSchema))
  register(@Body() registerDto: RegisterUserDto) {
    console.log('Registering user:', registerDto);
    return this.authService.register(registerDto);
  }
}
