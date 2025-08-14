import { ConsoleLogger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      prefix: 'Nexus',
    }),
  });

  app.use(cookieParser());
  app.enableCors({
    origin: true, // Allow all origins for development
    credentials: true, // Allow cookies to be sent
  });

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
