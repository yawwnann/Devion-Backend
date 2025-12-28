import {
  Injectable,
  NotFoundException,
  BadRequestException,
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
  private readonly GITHUB_API = 'https://api.github.com';
  private readonly CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

  constructor(private prisma: PrismaService) {}

  async setUsername(userId: string, username: string) {
    // Verify GitHub user exists
    const response = await fetch(`${this.GITHUB_API}/users/${username}`);
    if (!response.ok) {
      throw new BadRequestException('GitHub user not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { githubUsername: username },
    });

    // Sync repos immediately
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

    // Check if we need to sync
    const lastRepo = await this.prisma.gitHubRepo.findFirst({
      where: { userId },
      orderBy: { lastSyncedAt: 'desc' },
    });

    const needsSync =
      !lastRepo ||
      Date.now() - lastRepo.lastSyncedAt.getTime() > this.CACHE_DURATION;

    if (needsSync) {
      await this.syncRepos(userId);
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
    );

    if (!response.ok) {
      throw new BadRequestException('Failed to fetch GitHub repos');
    }

    const repos: GitHubRepoResponse[] = await response.json();
    const now = new Date();

    for (const repo of repos) {
      if (repo.private) continue; // Skip private repos

      await this.prisma.gitHubRepo.upsert({
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

      // Record stats for time-series
      await this.prisma.gitHubRepoStat.create({
        data: {
          repoId: (await this.prisma.gitHubRepo.findUnique({
            where: { userId_repoId: { userId, repoId: repo.id } },
          }))!.id,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          commits: 0, // Would need separate API call
          recordedAt: now,
        },
      });
    }

    return { synced: repos.filter((r) => !r.private).length };
  }

  async getRepoStats(userId: string, repoId: string, days = 30) {
    const repo = await this.prisma.gitHubRepo.findUnique({
      where: { id: repoId },
      select: { userId: true },
    });

    if (!repo) throw new NotFoundException('Repo not found');
    if (repo.userId !== userId) throw new NotFoundException('Repo not found');

    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.prisma.gitHubRepoStat.findMany({
      where: { repoId, recordedAt: { gte: since } },
      orderBy: { recordedAt: 'asc' },
    });
  }
}
