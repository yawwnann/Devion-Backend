import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectSettingsService } from './project-settings.service';
import { ProjectsController } from './projects.controller';
import { PrismaModule } from '../prisma';
import { CalendarModule } from '../calendar';
import { NotificationsModule } from '../notifications';

@Module({
  imports: [PrismaModule, CalendarModule, NotificationsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectSettingsService],
})
export class ProjectsModule {}
