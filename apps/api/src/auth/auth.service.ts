import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { argon2id, hash, verify } from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

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
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
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

  private readonly hashOptions = {
    type: argon2id,
    memoryCost: 19 * 1024, // 19 MiB in KiB
    timeCost: 2,
    parallelism: 1,
  };

  async register({
    email,
    name,
    username,
    password,
    dateOfBirth,
  }: {
    email: string;
    name?: string;
    username: string;
    password: string;
    dateOfBirth: Date;
  }) {
    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await hash(password, this.hashOptions);

    await this.prismaService.user.create({
      data: {
        email,
        name,
        username,
        password: hashedPassword,
        dateOfBirth,
      },
      select: {
        id: true,
      },
    });
  }
}
