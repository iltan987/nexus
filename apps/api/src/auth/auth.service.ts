import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from '@repo/shared/types/jwt-payload';
import { argon2id, hash, verify, type Options } from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import type { RegisterUserDto } from './dtos/registerUser.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  private readonly logger = new Logger(AuthService.name);

  async signIn({ email, password }: { email: string; password: string }) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { email },
      });

      if (!user || !user.password) {
        this.logger.warn(
          `Sign-in attempt with non-existing user with email: ${email}`,
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await verify(user.password, password);

      if (!isPasswordValid) {
        this.logger.warn(`Invalid password for user with email: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      this.logger.log(`User signed in successfully: ${email}`);

      const payload: JwtPayload = {
        sub: user.id,
        username: user.username,
        name: user.name,
      };

      return {
        access_token: await this.jwtService.signAsync(payload),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error during sign-in for email: ${email}`, error);
      throw new InternalServerErrorException(
        'An error occurred during sign-in. Please try again later.',
      );
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

  async register(registerDto: RegisterUserDto) {
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
          throw new ConflictException('Email already in use');
        }
        throw new ConflictException('Username already in use');
      }

      const hashedPassword = await hash(registerDto.password, this.hashOptions);

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
  }
}
