import './env';
import 'reflect-metadata';
// IMPORTANTE: se conecta con `connectMongoose` de @ceo-core/database dentro
// de app.module.ts, NO con `MongooseModule.forRoot(uri)` a secas — el simple
// hecho de importar `@ceo-core/database` ya aplica el fix de DNS de Windows
// para `mongodb+srv://` (ver ceo-core-modules/packages/ceo-database, y
// PLAN-servicios-independientes.md del ecosistema).
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
