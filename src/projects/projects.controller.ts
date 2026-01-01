import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import type { User } from '@prisma/client';
import { ProjectsService } from './projects.service';
import { ProjectSettingsService } from './project-settings.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(
    private projectsService: ProjectsService,
    private settingsService: ProjectSettingsService,
  ) {}

  // ========== Project Settings ==========
  @Get('settings')
  getSettings(@CurrentUser() user: User) {
    return this.settingsService.getSettings(user.id);
  }

  @Patch('settings')
  updateSettings(
    @CurrentUser() user: User,
    @Body() dto: { title?: string; description?: string; icon?: string },
  ) {
    return this.settingsService.updateSettings(user.id, dto);
  }

  @Post('settings/cover')
  @UseInterceptors(FileInterceptor('file'))
  uploadCover(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.settingsService.uploadCover(user.id, file);
  }

  @Delete('settings/cover')
  removeCover(@CurrentUser() user: User) {
    return this.settingsService.removeCover(user.id);
  }

  // ========== Projects CRUD ==========
  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.projectsService.findAll(user.id);
  }

  @Get('stats')
  getStats(@CurrentUser() user: User) {
    return this.projectsService.getStats(user.id);
  }

  // ========== CSV Export/Import ==========
  @Get('export/csv')
  async exportCsv(@CurrentUser() user: User, @Res() res: Response) {
    const csv = await this.projectsService.exportToCsv(user.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=projects-${Date.now()}.csv`,
    );
    res.send(csv);
  }

  @Post('import/csv')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.projectsService.importFromCsv(user.id, file);
  }

  // ========== XLSX Export/Import ==========
  @Get('export/xlsx')
  async exportXlsx(@CurrentUser() user: User, @Res() res: Response) {
    const buffer = await this.projectsService.exportToXlsx(user.id);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=projects-${Date.now()}.xlsx`,
    );
    res.send(buffer);
  }

  @Post('import/xlsx')
  @UseInterceptors(FileInterceptor('file'))
  async importXlsx(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.projectsService.importFromXlsx(user.id, file);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.projectsService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.projectsService.remove(id, user.id);
  }
}
