import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { GithubService } from './github.service';
import { SetGithubUsernameDto } from './dto';
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
}
