import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { registerUserSchema } from '@repo/shared/schemas/register-user.schema';
import { signInUserSchema } from '@repo/shared/schemas/sign-in-user.schema';
import { updateUserSchema } from '@repo/shared/schemas/update-user.schema';
import type { JwtPayload } from '@repo/shared/types/jwt-payload';
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe';
import { User } from 'src/user/user.decorator';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import type { RegisterUserDto } from './dtos/registerUser.dto';
import type { SignInUserDto } from './dtos/signInUser.dto';
import type { UpdateUserDto } from './dtos/updateUser.dto';

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

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@User() user: JwtPayload) {
    return user;
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Put('profile')
  updateProfile(
    @User() user: JwtPayload,
    @Body(new ZodValidationPipe(updateUserSchema)) updateDto: UpdateUserDto,
  ) {
    return this.authService.updateProfile(user.sub, updateDto);
  }
}
