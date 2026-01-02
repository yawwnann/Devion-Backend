import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { GithubService } from './github.service';
import {
  SetGithubUsernameDto,
  SetGithubTokenDto,
  SyncIssuesDto,
  CreateIssueDto,
  LinkRepoDto,
  SyncSingleTodoDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('github')
@UseGuards(JwtAuthGuard)
export class GithubController {
  constructor(private githubService: GithubService) {}

  @Post('username')
  setUsername(@CurrentUser() user: User, @Body() dto: SetGithubUsernameDto) {
    return this.githubService.setUsername(user.id, dto.username);
  }

  @Post('token')
  setToken(@CurrentUser() user: User, @Body() dto: SetGithubTokenDto) {
    return this.githubService.setToken(user.id, dto.token || null);
  }

  @Get('token-status')
  getTokenStatus(@CurrentUser() user: User) {
    return this.githubService.getTokenStatus(user.id);
  }

  @Get('repos')
  getRepos(@CurrentUser() user: User) {
    return this.githubService.getRepos(user.id);
  }

  @Post('sync')
  syncRepos(@CurrentUser() user: User) {
    return this.githubService.syncRepos(user.id);
  }

  @Get('repos/:repoId/stats')
  getRepoStats(
    @CurrentUser() user: User,
    @Param('repoId') repoId: string,
    @Query('days') days?: string,
  ) {
    return this.githubService.getRepoStats(
      user.id,
      repoId,
      days ? parseInt(days) : 30,
    );
  }

  // ==================== GITHUB ISSUES SYNC ====================

  @Post('link-repo')
  linkRepo(@CurrentUser() user: User, @Body() dto: LinkRepoDto) {
    return this.githubService.linkRepoToProject(
      user.id,
      dto.projectId,
      dto.githubRepo,
    );
  }

  @Post('sync-issues')
  syncIssues(@CurrentUser() user: User, @Body() dto: SyncIssuesDto) {
    return this.githubService.syncIssuesForProject(user.id, dto.projectId);
  }

  @Post('create-issue')
  createIssue(@CurrentUser() user: User, @Body() dto: CreateIssueDto) {
    return this.githubService.createGitHubIssue(
      user.id,
      dto.todoId,
      dto.githubRepo,
    );
  }

  @Patch('sync-todo')
  syncSingleTodo(@CurrentUser() user: User, @Body() dto: SyncSingleTodoDto) {
    return this.githubService.syncSingleTodo(user.id, dto.todoId);
  }

  // ==================== CODE REVIEW CENTER ====================

  @Get('pull-requests')
  getPullRequests(
    @CurrentUser() user: User,
    @Query('state') state?: 'open' | 'closed' | 'all',
  ) {
    return this.githubService.getPullRequests(user.id, state);
  }

  @Get('pull-requests/:owner/:repo/:number')
  getPRDetails(
    @CurrentUser() user: User,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number') number: string,
  ) {
    return this.githubService.getPRDetails(
      owner,
      repo,
      parseInt(number),
      user.id,
    );
  }

  @Get('pull-requests/:owner/:repo/:number/files')
  getPRFiles(
    @CurrentUser() user: User,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number') number: string,
  ) {
    return this.githubService.getPRFiles(
      owner,
      repo,
      parseInt(number),
      user.id,
    );
  }

  @Post('pull-requests/:owner/:repo/:number/reviews')
  submitReview(
    @CurrentUser() user: User,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('number') number: string,
    @Body()
    body: { comment: string; event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT' },
  ) {
    return this.githubService.submitReview(
      owner,
      repo,
      parseInt(number),
      user.id,
      body.comment,
      body.event,
    );
  }
}
