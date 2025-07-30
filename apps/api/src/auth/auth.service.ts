import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async signIn({ email, password }: { email: string; password: string }) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user || !user.password || user.password !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

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

    await this.prismaService.user.create({
      data: {
        email,
        name,
        username,
        password,
        dateOfBirth,
      },
      select: {
        id: true,
      },
    });
  }
}
