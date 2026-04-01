import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectSettingsService } from './project-settings.service';
import { ProjectsController } from './projects.controller';
import { PrismaModule } from '../prisma';
import { CalendarModule } from '../calendar';

@Module({
  imports: [PrismaModule, CalendarModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectSettingsService],
})
export class ProjectsModule {}
