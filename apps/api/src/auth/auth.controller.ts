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
import { RegisterUserDto } from './dtos/registerUser.dto';
import { SignInUserDto } from './dtos/signInUser.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UsePipes(new ZodValidationPipe(signInUserSchema))
  signIn(@Body() signInDto: SignInUserDto) {
    console.log('Signing in user:', signInDto);
    return signInDto;
    // return this.authService.signIn({
    //   email: signInDto.email,
    //   password: signInDto.password,
    // });
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  @UsePipes(new ZodValidationPipe(registerUserSchema))
  register(@Body() registerDto: RegisterUserDto) {
    console.log('Registering user:', registerDto);
    return registerDto;

    // return this.authService.register({
    //   email: registerDto.email,
    //   name: registerDto.name,
    //   username: registerDto.username,
    //   password: registerDto.password,
    //   dateOfBirth: new Date(registerDto.dateOfBirth),
    // });
  }
}
