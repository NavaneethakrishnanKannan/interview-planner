import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.use(cookieParser());
  const corsOrigins = process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()).filter(Boolean);
  app.enableCors({
    origin: corsOrigins?.length
      ? corsOrigins
      : (
          origin: string | undefined,
          callback: (err: Error | null, allow?: boolean) => void,
        ) => {
          if (!origin) {
            callback(null, true);
            return;
          }
          const ok = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
          callback(null, ok);
        },
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
