import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma';

interface GitHubRepoResponse {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  private: boolean;
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly GITHUB_API = 'https://api.github.com';
  private readonly CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

  constructor(private prisma: PrismaService) {}

  async setUsername(userId: string, username: string) {
    // Sanitize username
    const sanitizedUsername = username.trim().toLowerCase();

    if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(sanitizedUsername)) {
      throw new BadRequestException('Invalid GitHub username format');
    }

    // Verify GitHub user exists
    try {
      const response = await fetch(
        `${this.GITHUB_API}/users/${sanitizedUsername}`,
        {
          headers: { 'User-Agent': 'Devion-App' },
        },
      );

      if (!response.ok) {
        throw new BadRequestException('GitHub user not found');
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`GitHub API error: ${error}`);
      throw new BadRequestException('Failed to verify GitHub user');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { githubUsername: sanitizedUsername },
    });

    return this.syncRepos(userId);
  }

  async getRepos(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { githubUsername: true },
    });

    if (!user?.githubUsername) {
      throw new NotFoundException('GitHub username not set');
    }

    const lastRepo = await this.prisma.gitHubRepo.findFirst({
      where: { userId },
      orderBy: { lastSyncedAt: 'desc' },
    });

    const needsSync =
      !lastRepo ||
      Date.now() - lastRepo.lastSyncedAt.getTime() > this.CACHE_DURATION;

    if (needsSync) {
      try {
        await this.syncRepos(userId);
      } catch (error) {
        this.logger.warn(`Sync failed, returning cached data: ${error}`);
      }
    }

    return this.prisma.gitHubRepo.findMany({
      where: { userId },
      orderBy: { stars: 'desc' },
    });
  }

  async syncRepos(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { githubUsername: true },
    });

    if (!user?.githubUsername) {
      throw new NotFoundException('GitHub username not set');
    }

    const response = await fetch(
      `${this.GITHUB_API}/users/${user.githubUsername}/repos?per_page=100&sort=updated`,
      { headers: { 'User-Agent': 'Devion-App' } },
    );

    if (!response.ok) {
      throw new BadRequestException('Failed to fetch GitHub repos');
    }

    const repos: GitHubRepoResponse[] = await response.json();
    const now = new Date();
    const publicRepos = repos.filter((r) => !r.private);

    // Use transaction with increased timeout for many repos
    await this.prisma.$transaction(
      async (tx) => {
        for (const repo of publicRepos) {
          const dbRepo = await tx.gitHubRepo.upsert({
            where: { userId_repoId: { userId, repoId: repo.id } },
            create: {
              userId,
              repoId: repo.id,
              name: repo.name,
              fullName: repo.full_name,
              description: repo.description,
              url: repo.html_url,
              language: repo.language,
              stars: repo.stargazers_count,
              forks: repo.forks_count,
              openIssues: repo.open_issues_count,
              lastSyncedAt: now,
            },
            update: {
              name: repo.name,
              fullName: repo.full_name,
              description: repo.description,
              url: repo.html_url,
              language: repo.language,
              stars: repo.stargazers_count,
              forks: repo.forks_count,
              openIssues: repo.open_issues_count,
              lastSyncedAt: now,
            },
          });

          // Record stats
          await tx.gitHubRepoStat.create({
            data: {
              repoId: dbRepo.id,
              stars: repo.stargazers_count,
              forks: repo.forks_count,
              commits: 0,
              recordedAt: now,
            },
          });
        }
      },
      {
        maxWait: 15000, // 15 seconds
        timeout: 30000, // 30 seconds
      },
    );

    return { synced: publicRepos.length };
  }

  async getRepoStats(userId: string, repoId: string, days = 30) {
    const repo = await this.prisma.gitHubRepo.findUnique({
      where: { id: repoId },
      select: { userId: true },
    });

    if (!repo || repo.userId !== userId) {
      throw new NotFoundException('Repo not found');
    }

    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.prisma.gitHubRepoStat.findMany({
      where: { repoId, recordedAt: { gte: since } },
      orderBy: { recordedAt: 'asc' },
    });
  }
}
