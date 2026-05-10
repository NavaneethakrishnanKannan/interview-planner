import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { InterviewsModule } from './interviews/interviews.module';
import { NotesModule } from './notes/notes.module';
import { PrismaModule } from './prisma/prisma.module';
import { QuestionsModule } from './questions/questions.module';

function monorepoRootEnvPath(): string {
  const fromDistSrc = resolve(__dirname, '..', '..', '..', '..', '.env');
  if (existsSync(fromDistSrc)) {
    return fromDistSrc;
  }
  const fromSrc = resolve(__dirname, '..', '..', '..', '.env');
  if (existsSync(fromSrc)) {
    return fromSrc;
  }
  return fromDistSrc;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: monorepoRootEnvPath(),
    }),
    PrismaModule,
    AuthModule,
    DashboardModule,
    QuestionsModule,
    InterviewsModule,
    NotesModule,
  ],
})
export class AppModule {}
