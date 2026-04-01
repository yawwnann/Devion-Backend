import { PrismaService } from '../../prisma/prisma.service';
import { ToolResult } from '../chatbot.types';

export async function getGitHubStats(
  prisma: PrismaService,
  params: { includeRepos?: boolean; includeCommits?: boolean; limit?: number },
  userId: string,
): Promise<ToolResult> {
  try {
    const { includeRepos = true, includeCommits = false, limit = 5 } = params;

    const result: Record<string, unknown> = {};

    // Get GitHub user info (filter by userId)
    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: {
        githubUsername: true,
        githubAccessToken: true,
      },
    });

    result.githubConnected = !!user?.githubUsername;
    result.githubUsername = user?.githubUsername || null;
    result.hasToken = !!user?.githubAccessToken;

    if (includeRepos && result.githubConnected) {
      const repos = await prisma.gitHubRepo.findMany({
        where: { userId },
        orderBy: { stars: 'desc' },
        take: limit,
      });

      result.repos = repos.map((r) => ({
        id: r.id,
        name: r.name,
        fullName: r.fullName,
        description: r.description,
        language: r.language,
        stars: r.stars,
        forks: r.forks,
        url: r.url,
        githubUpdatedAt: r.githubUpdatedAt,
      }));

      // Summary stats
      result.totalRepos = repos.length;
      result.totalStars = repos.reduce((sum, r) => sum + r.stars, 0);
      result.languageStats = repos.reduce((acc, r) => {
        if (r.language) {
          acc[r.language] = (acc[r.language] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
    }

    if (includeCommits && result.githubConnected) {
      // Get all commits and filter by user's todos
      const allCommits = await prisma.gitHubCommit.findMany({
        include: {
          todo: {
            select: {
              week: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
        orderBy: { committedAt: 'desc' },
      });

      // Filter commits that belong to this user
      const userCommits = allCommits.filter((c) => c.todo.week.userId === userId);

      result.recentCommits = userCommits.slice(0, limit).map((c) => ({
        id: c.id,
        sha: c.sha,
        message: c.message,
        author: c.author,
        additions: c.additions,
        deletions: c.deletions,
        committedAt: c.committedAt,
        htmlUrl: c.htmlUrl,
      }));
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      data: {},
      error: error instanceof Error ? error.message : 'Failed to get GitHub stats',
    };
  }
}
