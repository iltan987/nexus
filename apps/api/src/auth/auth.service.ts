import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { argon2id, hash, verify } from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async signIn({ email, password }: { email: string; password: string }) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

      if (!user || !user.password) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await verify(user.password, password);

      if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;

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
