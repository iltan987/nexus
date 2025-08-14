import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from '@repo/shared/types/jwt-payload';
import { argon2id, hash, verify, type Options } from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AUTH_ERROR_CODES,
  createErrorResult,
  createSuccessResult,
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
        email: user.email,
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

  // Fields that are included in JWT payload and require token regeneration
  private readonly JWT_PAYLOAD_FIELDS = ['username', 'name', 'email'] as const;

  /**
   * Checks if the update requires JWT token regeneration
   * @param updateDto - The update data
   * @returns true if token should be regenerated
   */
  private shouldRegenerateToken(updateDto: UpdateUserDto): boolean {
    return this.JWT_PAYLOAD_FIELDS.some(
      (field) => updateDto[field] !== undefined,
    );
  }

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

      this.logger.log(`User registered successfully: ${registerDto.email}`);
      return createSuccessResult(undefined);
    } catch (error) {
      this.logger.error(
        `Error during registration for email: ${registerDto.email}`,
        error,
      );

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

      // Check for duplicate email
      if (updateDto.email) {
        const emailExists = await this.prismaService.user.findUnique({
          where: { email: updateDto.email },
        });

        if (emailExists && emailExists.id !== userId) {
          return createErrorResult(AUTH_ERROR_CODES.EMAIL_CONFLICT);
        }
      }

      // Check for duplicate username
      if (updateDto.username) {
        const usernameExists = await this.prismaService.user.findUnique({
          where: { username: updateDto.username },
        });

        if (usernameExists && usernameExists.id !== userId) {
          return createErrorResult(AUTH_ERROR_CODES.USERNAME_CONFLICT);
        }
      }

      // Check if token regeneration is needed
      const needsTokenRegeneration = this.shouldRegenerateToken(updateDto);

      const updatedUser = await this.prismaService.user.update({
        where: { id: userId },
        data: {
          ...(updateDto.email ? { email: updateDto.email } : {}),
          ...(updateDto.name !== undefined ? { name: updateDto.name } : {}),
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

      // Generate new token if JWT payload fields were updated
      if (needsTokenRegeneration) {
        const payload: JwtPayload = {
          sub: updatedUser.id,
          username: updatedUser.username,
          name: updatedUser.name,
          email: updatedUser.email,
        };

        const newToken = await this.jwtService.signAsync(payload);
        this.logger.log(`New JWT token generated for user: ${updatedUser.id}`);

        return createSuccessResult<{ access_token: string }>({
          access_token: newToken,
        });
      }

      return createSuccessResult<{ access_token: undefined }>({
        access_token: undefined,
      });
    } catch (error) {
      this.logger.error(`Error updating profile for user ID: ${userId}`, error);
      return createErrorResult(AUTH_ERROR_CODES.INTERNAL_ERROR);
    }
  }
}
