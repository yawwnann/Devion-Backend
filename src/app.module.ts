import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma';
import { AuthModule } from './auth';
import { PagesModule } from './pages';
import { BlocksModule } from './blocks';
import { GithubModule } from './github';
import { AnalyticsModule } from './analytics';
import { HealthModule } from './health/health.module';
import { ProjectsModule } from './projects/projects.module';
import { ProjectCategoriesModule } from './project-categories/project-categories.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { TodosModule } from './todos/todos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    PrismaModule,
    AuthModule,
    PagesModule,
    BlocksModule,
    GithubModule,
    AnalyticsModule,
    HealthModule,
    ProjectsModule,
    ProjectCategoriesModule,
    PaymentMethodsModule,
    TodosModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
