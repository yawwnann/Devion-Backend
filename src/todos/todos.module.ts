import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { TodoSettingsService } from './todo-settings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GithubModule } from '../github/github.module';
import { NotificationsModule } from '../notifications';

@Module({
  imports: [PrismaModule, GithubModule, NotificationsModule],
  controllers: [TodosController],
  providers: [TodosService, TodoSettingsService],
})
export class TodosModule {}
