import './env';
import 'reflect-metadata';
// El fix de DNS de Windows para `mongodb+srv://` vive en ./lib/database.ts
// (se aplica como efecto de import, ver ese archivo) y ese módulo se importa
// desde app.module.ts.
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: false, transform: true }));
  const port = process.env.PORT || 4500;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`RadarAI backend en http://localhost:${port}/api`);
}
bootstrap();
