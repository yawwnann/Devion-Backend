import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma';
import { AuthModule } from './auth';
import { PagesModule } from './pages';
import { BlocksModule } from './blocks';
import { GithubModule } from './github';
import { AnalyticsModule } from './analytics';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    PagesModule,
    BlocksModule,
    GithubModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
