import { Body, ConflictException, Controller, Get, Post } from '@nestjs/common';
import { User as UserModel } from '@repo/db/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getAllUsers(): Promise<any> {
    return this.prisma.user.findMany();
  }

  @Post()
  async signupUser(
    @Body() userData: { name?: string; email: string },
  ): Promise<UserModel> {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: userData.email,
      },
    });
    if (existingUser) {
      throw new ConflictException(
        `User with email ${userData.email} already exists.`,
      );
    }
    return this.prisma.user.create({ data: userData });
  }
}
