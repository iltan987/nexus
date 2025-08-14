import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from '@repo/shared/types/jwt-payload';
import { argon2id, hash, verify, type Options } from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AUTH_ERROR_CODES,
  createErrorResult,
  createSuccessResult,
  createVoidSuccessResult,
  type RegisterResult,
  type SignInResult,
  type UpdateProfileResult,
} from './auth.errors';
import type { RegisterUserDto } from './dtos/registerUser.dto';
import type { UpdateUserDto } from './dtos/updateUser.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  private readonly logger = new Logger(AuthService.name);

  async signIn({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<SignInResult> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { email },
      });

      if (!user || !user.password) {
        this.logger.warn(
          `Sign-in attempt with non-existing user with email: ${email}`,
        );
        return createErrorResult(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
      }

      const isPasswordValid = await verify(user.password, password);

      if (!isPasswordValid) {
        this.logger.warn(`Invalid password for user with email: ${email}`);
        return createErrorResult(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
      }

      this.logger.log(`User signed in successfully: ${email}`);

      const payload: JwtPayload = {
        sub: user.id,
        username: user.username,
        name: user.name,
      };

      return createSuccessResult({
        access_token: await this.jwtService.signAsync(payload),
      });
    } catch (error) {
      this.logger.error(`Error during sign-in for email: ${email}`, error);
      return createErrorResult(AUTH_ERROR_CODES.INTERNAL_ERROR);
    }
  }

  private readonly hashOptions: Options & {
    raw?: boolean;
  } = {
    type: argon2id,
    memoryCost: 19 * 1024, // 19 MiB in KiB
    timeCost: 2,
    parallelism: 1,
  };

  async register(registerDto: RegisterUserDto): Promise<RegisterResult> {
    try {
      await this.prismaService.$transaction(async (prisma) => {
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: registerDto.email },
              { username: registerDto.username },
            ],
          },
        });

        if (existingUser) {
          if (existingUser.email === registerDto.email) {
            throw new Error('EMAIL_EXISTS');
          }
          throw new Error('USERNAME_EXISTS');
        }

        const hashedPassword = await hash(
          registerDto.password,
          this.hashOptions,
        );

        await prisma.user.create({
          data: {
            ...registerDto,
            password: hashedPassword,
          },
          select: {
            id: true,
          },
        });
        this.logger.log(`User registered successfully: ${registerDto.email}`);
      });

      return createVoidSuccessResult();
    } catch (error) {
      this.logger.error(
        `Error during registration for email: ${registerDto.email}`,
        error,
      );

      if (error instanceof Error) {
        if (error.message === 'EMAIL_EXISTS') {
          return createErrorResult(AUTH_ERROR_CODES.EMAIL_CONFLICT);
        }
        if (error.message === 'USERNAME_EXISTS') {
          return createErrorResult(AUTH_ERROR_CODES.USERNAME_CONFLICT);
        }
      }

      return createErrorResult(AUTH_ERROR_CODES.INTERNAL_ERROR);
    }
  }

  async updateProfile(
    userId: string,
    updateDto: UpdateUserDto,
  ): Promise<UpdateProfileResult> {
    try {
      const existingUser = await this.prismaService.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        return createErrorResult(AUTH_ERROR_CODES.USER_NOT_FOUND);
      }

      const updatedUser = await this.prismaService.user.update({
        where: { id: userId },
        data: {
          ...(updateDto.email ? { email: updateDto.email } : {}),
          ...(updateDto.name ? { name: updateDto.name } : {}),
          ...(updateDto.username ? { username: updateDto.username } : {}),
          ...(updateDto.password
            ? { password: await hash(updateDto.password, this.hashOptions) }
            : {}),
          ...(updateDto.dateOfBirth
            ? { dateOfBirth: updateDto.dateOfBirth }
            : {}),
        },
      });

      this.logger.log(`User profile updated successfully: ${updatedUser.id}`);

      return createVoidSuccessResult();
    } catch (error) {
      this.logger.error(`Error updating profile for user ID: ${userId}`, error);
      return createErrorResult(AUTH_ERROR_CODES.INTERNAL_ERROR);
    }
  }
}
