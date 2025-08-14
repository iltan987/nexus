import { Injectable, Logger } from '@nestjs/common';
import { argon2id, hash, verify, type Options } from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AUTH_ERROR_CODES,
  createErrorResult,
  createSuccessResult,
  type RegisterResult,
  type SignInResult,
} from './auth.errors';
import type { RegisterUserDto } from './dtos/registerUser.dto';

type UserCredentials = {
  email: string;
  password: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  private readonly logger = new Logger(AuthService.name);

  async validateUser({
    email,
    password,
  }: UserCredentials): Promise<SignInResult> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { email },
        select: {
          id: true,
          password: true,
        },
      });

      if (!user || !user.password) {
        this.logger.debug(
          `Sign-in attempt with non-existing user with email: ${email}`,
        );
        return createErrorResult(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
      }

      const isPasswordValid = await verify(user.password, password);

      if (!isPasswordValid) {
        this.logger.debug(`Invalid password for user with email: ${email}`);
        return createErrorResult(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
      }

      this.logger.debug(`User signed in successfully: ${email}`);

      return createSuccessResult({ id: user.id });
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
      const existingUser = await this.prismaService.user.findFirst({
        where: {
          OR: [
            { email: registerDto.email },
            { username: registerDto.username },
          ],
        },
      });

      if (existingUser) {
        if (existingUser.email === registerDto.email) {
          return createErrorResult(AUTH_ERROR_CODES.EMAIL_CONFLICT);
        }
        return createErrorResult(AUTH_ERROR_CODES.USERNAME_CONFLICT);
      }

      // Hash password outside transaction
      const hashedPassword = await hash(registerDto.password, this.hashOptions);

      // Only use transaction for the actual user creation
      await this.prismaService.user.create({
        data: {
          ...registerDto,
          password: hashedPassword,
        },
        select: {
          id: true,
        },
      });

      this.logger.debug(`User registered successfully: ${registerDto.email}`);
      return createSuccessResult(undefined);
    } catch (error) {
      this.logger.error(
        `Error during registration for email: ${registerDto.email}`,
        error,
      );

      return createErrorResult(AUTH_ERROR_CODES.INTERNAL_ERROR);
    }
  }
}
