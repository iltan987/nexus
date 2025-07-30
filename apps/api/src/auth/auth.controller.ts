import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dtos/registerUser.dto';
import { SignInUserDto } from './dtos/signInUser.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: SignInUserDto) {
    return this.authService.signIn({
      email: signInDto.email,
      password: signInDto.password,
    });
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
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
