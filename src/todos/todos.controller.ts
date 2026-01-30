import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { TodosService } from './todos.service';
import { TodoSettingsService } from './todo-settings.service';
import { GithubService } from '../github/github.service';

@Controller('todos')
@UseGuards(JwtAuthGuard)
export class TodosController {
  constructor(
    private todosService: TodosService,
    private todoSettingsService: TodoSettingsService,
    private githubService: GithubService,
  ) {}

  @Get('current-week')
  async getCurrentWeek(@Request() req) {
    return this.todosService.getCurrentWeek(req.user.id);
  }

  @Post()
  async createTodo(
    @Request() req,
    @Body() data: { title: string; day: string; dueDate?: string; priority?: string; status?: string },
  ) {
    return this.todosService.createTodo(req.user.id, data);
  }

  @Patch(':id')
  async updateTodo(
    @Request() req,
    @Param('id') id: string,
    @Body() data: { title?: string; isCompleted?: boolean; dueDate?: string; priority?: string; status?: string; githubIssueNumber?: number; githubRepoName?: string },
  ) {
    return this.todosService.updateTodo(req.user.id, id, data);
  }

  @Delete(':id')
  async deleteTodo(@Request() req, @Param('id') id: string) {
    return this.todosService.deleteTodo(req.user.id, id);
  }

  @Post('reorder')
  async reorderTodos(
    @Request() req,
    @Body() data: { todoIds: string[] },
  ) {
    return this.todosService.reorderTodos(req.user.id, data.todoIds);
  }

  @Post('new-week')
  async createNewWeek(@Request() req) {
    return this.todosService.createNewWeek(req.user.id);
  }

  // GitHub Commit Tracking
  @Get(':id/commits')
  async getCommits(@Request() req, @Param('id') id: string) {
    return this.githubService.getCommitsForTodo(req.user.id, id);
  }

  @Post(':id/commits/sync')
  async syncCommits(@Request() req, @Param('id') id: string) {
    return this.githubService.syncCommitsForTodo(req.user.id, id);
  }

  @Patch(':id/github')
  async linkToGitHub(
    @Request() req,
    @Param('id') id: string,
    @Body() data: { issueNumber: number; repoName: string },
  ) {
    return this.todosService.updateTodo(req.user.id, id, {
      githubIssueNumber: data.issueNumber,
      githubRepoName: data.repoName,
    });
  }

  // Settings endpoints
  @Get('settings')
  async getSettings(@Request() req) {
    return this.todoSettingsService.getSettings(req.user.id);
  }

  @Patch('settings')
  async updateSettings(
    @Request() req,
    @Body() data: { title?: string; description?: string; icon?: string },
  ) {
    return this.todoSettingsService.updateSettings(req.user.id, data);
  }

  @Post('settings/cover')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCover(@Request() req, @UploadedFile() file: Express.Multer.File) {
    return this.todoSettingsService.uploadCover(req.user.id, file);
  }

  @Delete('settings/cover')
  async deleteCover(@Request() req) {
    return this.todoSettingsService.deleteCover(req.user.id);
  }
}
