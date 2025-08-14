import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { registerUserSchema } from '@repo/shared/schemas/register-user.schema';
import { signInUserSchema } from '@repo/shared/schemas/sign-in-user.schema';
import { updateUserSchema } from '@repo/shared/schemas/update-user.schema';
import type { JwtPayload } from '@repo/shared/types/jwt-payload';
import type { Response } from 'express';
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe';
import { User } from 'src/user/user.decorator';
import { throwHttpExceptionFromResult } from './auth.errors';
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
  async signIn(
    @Body() signInDto: SignInUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log('Signing in user:', signInDto);
    const result = await this.authService.signIn(signInDto);

    if (!result.success) {
      throwHttpExceptionFromResult(result);
    }

    // Set JWT token as HTTP-only cookie
    res.cookie('access_token', result.data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Return empty response body since token is in cookie
    return;
  }

  @HttpCode(HttpStatus.OK)
  @Post('register')
  @UsePipes(new ZodValidationPipe(registerUserSchema))
  async register(@Body() registerDto: RegisterUserDto) {
    console.log('Registering user:', registerDto);
    const result = await this.authService.register(registerDto);

    if (!result.success) {
      throwHttpExceptionFromResult(result);
    }

    return result.data;
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@User() user: JwtPayload) {
    return user;
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Put('profile')
  async updateProfile(
    @User() user: JwtPayload,
    @Body(new ZodValidationPipe(updateUserSchema)) updateDto: UpdateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.updateProfile(user.sub, updateDto);

    if (!result.success) {
      throwHttpExceptionFromResult(result);
    }

    // If a new token was generated, update the cookie
    if (result.data.access_token) {
      res.cookie('access_token', result.data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    // Clear the access token cookie
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return;
  }
}
