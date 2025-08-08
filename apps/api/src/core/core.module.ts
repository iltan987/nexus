import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from 'src/config/env.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      validate: validateEnv,
    }),
  ],
  exports: [ConfigModule],
})
export class CoreModule {}
