import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import axios from 'axios';
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

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  html_url: string;
  labels: { name: string }[];
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
  labels: { name: string; color: string }[];
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  draft: boolean;
  additions: number;
  deletions: number;
  changed_files: number;
  requested_reviewers: { login: string }[];
  reviews?: {
    user: { login: string };
    state: string;
  }[];
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

  async setToken(userId: string, token: string | null) {
    // If token is provided, verify it works
    if (token) {
      try {
        const response = await axios.get(`${this.GITHUB_API}/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (!response.data?.login) {
          throw new BadRequestException('Invalid GitHub token');
        }
      } catch (error) {
        throw new BadRequestException('Invalid GitHub token');
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { githubAccessToken: token },
    });

    return { message: token ? 'Token saved successfully' : 'Token removed' };
  }

  async getTokenStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { githubAccessToken: true },
    });

    return { hasToken: !!user?.githubAccessToken };
  }

  async getRepos(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { githubUsername: true },
    });

    if (!user?.githubUsername) {
      throw new NotFoundException('GitHub username not set');
    }

    // Check if we have any repos for this user
    const existingRepos = await this.prisma.gitHubRepo.findMany({
      where: { userId },
      take: 1,
    });

    const lastRepo = await this.prisma.gitHubRepo.findFirst({
      where: { userId },
      orderBy: { lastSyncedAt: 'desc' },
    });

    const needsSync =
      !lastRepo ||
      existingRepos.length === 0 ||
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
      select: { githubUsername: true, githubAccessToken: true },
    });

    if (!user?.githubUsername) {
      throw new NotFoundException('GitHub username not set');
    }

    // Use authenticated endpoint if token is available, otherwise use public endpoint
    const headers: Record<string, string> = {
      'User-Agent': 'Devion-App',
      Accept: 'application/vnd.github.v3+json',
    };

    let url: string;
    if (user.githubAccessToken) {
      // Authenticated request - can see private repos
      headers.Authorization = `Bearer ${user.githubAccessToken}`;
      url = `${this.GITHUB_API}/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator`;
    } else {
      // Public request - only public repos
      url = `${this.GITHUB_API}/users/${user.githubUsername}/repos?per_page=100&sort=updated`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new BadRequestException('Failed to fetch GitHub repos');
    }

    const repos: GitHubRepoResponse[] = await response.json();
    const now = new Date();

    // Use transaction with increased timeout for many repos
    await this.prisma.$transaction(
      async (tx) => {
        // Delete all existing repos for this user to ensure fresh data
        await tx.gitHubRepo.deleteMany({
          where: { userId },
        });

        for (const repo of repos) {
          const dbRepo = await tx.gitHubRepo.create({
            data: {
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
              isPrivate: repo.private,
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

    return { synced: repos.length };
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

  async getLanguageStats(userId: string) {
    const repos = await this.prisma.gitHubRepo.findMany({
      where: { userId },
      select: { language: true },
    });

    const languageCount = new Map<string, number>();

    repos.forEach((repo) => {
      const lang = repo.language || 'Unknown';
      languageCount.set(lang, (languageCount.get(lang) || 0) + 1);
    });

    return Array.from(languageCount.entries())
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Pull Request methods for Code Review Center
  async getPullRequests(
    userId: string,
    state: 'open' | 'closed' | 'all' = 'open',
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { githubAccessToken: true, githubUsername: true },
    });

    if (!user?.githubAccessToken || !user?.githubUsername) {
      throw new BadRequestException('GitHub configuration not found');
    }

    const url = `${this.GITHUB_API}/search/issues?q=is:pr+author:${user.githubUsername}+state:${state}&sort=updated&order=desc&per_page=50`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${user.githubAccessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    // Enrich PRs with full details (additions, deletions, changed_files)
    const prs = await Promise.all(
      response.data.items.slice(0, 20).map(async (pr: any) => {
        try {
          // Extract owner/repo from pr.repository_url
          const repoPath = pr.repository_url.replace(
            'https://api.github.com/repos/',
            '',
          );
          const [owner, repo] = repoPath.split('/');

          // Fetch full PR details
          const prDetail = await axios.get(
            `${this.GITHUB_API}/repos/${owner}/${repo}/pulls/${pr.number}`,
            {
              headers: {
                Authorization: `Bearer ${user.githubAccessToken}`,
                Accept: 'application/vnd.github.v3+json',
              },
            },
          );

          return {
            ...pr,
            additions: prDetail.data.additions,
            deletions: prDetail.data.deletions,
            changed_files: prDetail.data.changed_files,
          };
        } catch (error) {
          // If fetch fails, return PR without stats
          return pr;
        }
      }),
    );

    return prs;
  }

  async getPRDetails(
    owner: string,
    repo: string,
    prNumber: number,
    userId: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { githubAccessToken: true },
    });

    if (!user?.githubAccessToken) {
      throw new BadRequestException('GitHub access token not found');
    }

    const url = `${this.GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}`;
    const response = await axios.get<GitHubPullRequest>(url, {
      headers: {
        Authorization: `Bearer ${user.githubAccessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    // Get reviews
    const reviewsUrl = `${this.GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/reviews`;
    const reviewsResponse = await axios.get(reviewsUrl, {
      headers: {
        Authorization: `Bearer ${user.githubAccessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    return {
      ...response.data,
      reviews: reviewsResponse.data,
    };
  }

  async getPRFiles(
    owner: string,
    repo: string,
    prNumber: number,
    userId: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { githubAccessToken: true },
    });

    if (!user?.githubAccessToken) {
      throw new BadRequestException('GitHub access token not found');
    }

    const url = `${this.GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/files`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${user.githubAccessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    return response.data;
  }

  async submitReview(
    owner: string,
    repo: string,
    prNumber: number,
    userId: string,
    body: string,
    event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT',
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { githubAccessToken: true },
    });

    if (!user?.githubAccessToken) {
      throw new BadRequestException('GitHub access token not found');
    }

    const url = `${this.GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/reviews`;

    try {
      const response = await axios.post(
        url,
        { body, event },
        {
          headers: {
            Authorization: `Bearer ${user.githubAccessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        },
      );
      return response.data;
    } catch (error: any) {
      // Handle specific GitHub errors
      if (error.response?.status === 422) {
        const message = error.response?.data?.message || 'Validation failed';
        // Common 422 errors:
        // - Can't approve your own PR
        // - Pull request review thread is outdated
        throw new BadRequestException(message);
      }
      throw error;
    }
  }

  async getOverallStats(userId: string) {
    const repos = await this.prisma.gitHubRepo.findMany({
      where: { userId },
    });

    const totalStars = repos.reduce((sum, repo) => sum + repo.stars, 0);
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks, 0);
    const totalRepos = repos.length;

    const languages = new Map<string, number>();
    repos.forEach((repo) => {
      const lang = repo.language || 'Unknown';
      languages.set(lang, (languages.get(lang) || 0) + 1);
    });

    const topLanguages = Array.from(languages.entries())
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalRepos,
      totalStars,
      totalForks,
      topLanguages,
    };
  }

  // ==================== GITHUB ISSUES SYNC ====================

  async linkRepoToProject(
    userId: string,
    projectId: string,
    githubRepo: string,
  ) {
    // Validate repo format (owner/repo)
    if (!/^[\w-]+\/[\w.-]+$/.test(githubRepo)) {
      throw new BadRequestException(
        'Invalid GitHub repo format. Use: owner/repo',
      );
    }

    // Verify repo exists
    try {
      const response = await fetch(`${this.GITHUB_API}/repos/${githubRepo}`, {
        headers: { 'User-Agent': 'Devion-App' },
      });

      if (!response.ok) {
        throw new BadRequestException('GitHub repository not found');
      }
    } catch (error) {
      throw new BadRequestException(
        'Failed to verify GitHub repository: ' + error.message,
      );
    }

    // Update project with GitHub info
    return this.prisma.project.update({
      where: { id: projectId, userId },
      data: {
        githubRepo,
        githubUrl: `https://github.com/${githubRepo}`,
      },
    });
  }

  async syncIssuesForProject(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!project.githubRepo) {
      throw new BadRequestException('Project is not linked to a GitHub repo');
    }

    // Fetch issues from GitHub
    const response = await fetch(
      `${this.GITHUB_API}/repos/${project.githubRepo}/issues?state=all&per_page=100`,
      {
        headers: { 'User-Agent': 'Devion-App' },
      },
    );

    if (!response.ok) {
      throw new BadRequestException('Failed to fetch GitHub issues');
    }

    const issues: GitHubIssue[] = await response.json();

    // Get or create current week
    const now = new Date();
    const weekStart = this.getWeekStart(now);
    const weekEnd = this.getWeekEnd(weekStart);

    let week = await this.prisma.todoWeek.findUnique({
      where: {
        userId_weekStart: {
          userId,
          weekStart,
        },
      },
    });

    if (!week) {
      week = await this.prisma.todoWeek.create({
        data: {
          userId,
          weekStart,
          weekEnd,
        },
      });
    }

    const syncedTodos: any[] = [];

    for (const issue of issues) {
      // Check if todo already exists for this issue
      const existingTodo = await this.prisma.todo.findFirst({
        where: {
          githubIssueNumber: issue.number,
          githubRepoName: project.githubRepo,
          week: { userId },
        },
      });

      const labels = issue.labels.map((l) => l.name).join(', ');

      if (existingTodo) {
        // Update existing todo
        const updated = await this.prisma.todo.update({
          where: { id: existingTodo.id },
          data: {
            title: issue.title,
            isCompleted: issue.state === 'closed',
            githubIssueUrl: issue.html_url,
            githubLabels: labels,
            lastSyncedAt: new Date(),
          },
        });
        syncedTodos.push(updated);
      } else {
        // Create new todo from issue
        const created = await this.prisma.todo.create({
          data: {
            title: issue.title,
            isCompleted: issue.state === 'closed',
            day: 'Mon', // Default to Monday
            order: 0,
            weekId: week.id,
            githubIssueNumber: issue.number,
            githubIssueUrl: issue.html_url,
            githubRepoName: project.githubRepo,
            githubLabels: labels,
            lastSyncedAt: new Date(),
          },
        });
        syncedTodos.push(created);
      }
    }

    // Update project last synced time
    await this.prisma.project.update({
      where: { id: projectId },
      data: { lastSyncedAt: new Date() },
    });

    return {
      synced: syncedTodos.length,
      todos: syncedTodos,
    };
  }

  async createGitHubIssue(userId: string, todoId: string, githubRepo: string) {
    const todo = await this.prisma.todo.findFirst({
      where: { id: todoId, week: { userId } },
    });

    if (!todo) {
      throw new NotFoundException('Todo not found');
    }

    if (todo.githubIssueNumber) {
      throw new BadRequestException('Todo is already linked to a GitHub issue');
    }

    // Create issue on GitHub
    const response = await fetch(
      `${this.GITHUB_API}/repos/${githubRepo}/issues`,
      {
        method: 'POST',
        headers: {
          'User-Agent': 'Devion-App',
          'Content-Type': 'application/json',
          // Note: This requires authentication token
          // Authorization: `token ${githubToken}`,
        },
        body: JSON.stringify({
          title: todo.title,
          body: `Created from Devion Todo`,
        }),
      },
    );

    if (!response.ok) {
      throw new BadRequestException(
        'Failed to create GitHub issue. Make sure you have proper authentication.',
      );
    }

    const issue: GitHubIssue = await response.json();

    // Update todo with GitHub issue info
    return this.prisma.todo.update({
      where: { id: todoId },
      data: {
        githubIssueNumber: issue.number,
        githubIssueUrl: issue.html_url,
        githubRepoName: githubRepo,
        lastSyncedAt: new Date(),
      },
    });
  }

  async syncSingleTodo(userId: string, todoId: string) {
    const todo = await this.prisma.todo.findFirst({
      where: { id: todoId, week: { userId } },
    });

    if (!todo || !todo.githubIssueNumber || !todo.githubRepoName) {
      throw new BadRequestException('Todo is not linked to a GitHub issue');
    }

    // Fetch issue from GitHub
    const response = await fetch(
      `${this.GITHUB_API}/repos/${todo.githubRepoName}/issues/${todo.githubIssueNumber}`,
      {
        headers: { 'User-Agent': 'Devion-App' },
      },
    );

    if (!response.ok) {
      throw new BadRequestException('Failed to fetch GitHub issue');
    }

    const issue: GitHubIssue = await response.json();
    const labels = issue.labels.map((l) => l.name).join(', ');

    // Update todo
    return this.prisma.todo.update({
      where: { id: todoId },
      data: {
        title: issue.title,
        isCompleted: issue.state === 'closed',
        githubIssueUrl: issue.html_url,
        githubLabels: labels,
        lastSyncedAt: new Date(),
      },
    });
  }

  // ==================== COMMIT TRACKING ====================

  /**
   * Fetch commits that reference an issue number
   */
  async fetchCommitsForIssue(
    userId: string,
    repoOwner: string,
    repoName: string,
    issueNumber: number,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { githubAccessToken: true },
    });

    if (!user?.githubAccessToken) {
      throw new BadRequestException('GitHub access token required for commit tracking');
    }

    // Search for commits that mention the issue
    // GitHub search formats: "#123", "fixes #123", "closes #123", etc.
    const searchQuery = `repo:${repoOwner}/${repoName} ${issueNumber}`;
    
    try {
      const response = await axios.get(
        `${this.GITHUB_API}/search/commits?q=${encodeURIComponent(searchQuery)}&sort=committer-date&order=desc&per_page=50`,
        {
          headers: {
            Authorization: `Bearer ${user.githubAccessToken}`,
            Accept: 'application/vnd.github.cloak-preview+json', // Required for commit search
          },
        },
      );

      return response.data.items.map((commit: any) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author?.name || 'Unknown',
        authorEmail: commit.commit.author?.email,
        authorAvatar: commit.author?.avatar_url,
        url: commit.url,
        htmlUrl: commit.html_url,
        committedAt: new Date(commit.commit.author?.date || new Date()),
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch commits: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch detailed commit info including stats
   */
  async fetchCommitDetails(
    userId: string,
    repoOwner: string,
    repoName: string,
    sha: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { githubAccessToken: true },
    });

    if (!user?.githubAccessToken) {
      throw new BadRequestException('GitHub access token required');
    }

    const response = await axios.get(
      `${this.GITHUB_API}/repos/${repoOwner}/${repoName}/commits/${sha}`,
      {
        headers: {
          Authorization: `Bearer ${user.githubAccessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );

    return {
      sha: response.data.sha,
      message: response.data.commit.message,
      author: response.data.commit.author?.name || 'Unknown',
      authorEmail: response.data.commit.author?.email,
      authorAvatar: response.data.author?.avatar_url,
      url: response.data.url,
      htmlUrl: response.data.html_url,
      additions: response.data.stats?.additions || 0,
      deletions: response.data.stats?.deletions || 0,
      committedAt: new Date(response.data.commit.author?.date || new Date()),
    };
  }

  /**
   * Sync commits for a todo with GitHub issue
   */
  async syncCommitsForTodo(userId: string, todoId: string) {
    const todo = await this.prisma.todo.findFirst({
      where: { id: todoId, week: { userId } },
      select: {
        id: true,
        githubIssueNumber: true,
        githubRepoName: true,
      },
    });

    if (!todo || !todo.githubIssueNumber || !todo.githubRepoName) {
      throw new BadRequestException('Todo not linked to GitHub issue');
    }

    const [owner, repo] = todo.githubRepoName.split('/');
    if (!owner || !repo) {
      throw new BadRequestException('Invalid repository name format. Expected: owner/repo');
    }

    // Fetch commits
    const commits = await this.fetchCommitsForIssue(
      userId,
      owner,
      repo,
      todo.githubIssueNumber,
    );

    // Get detailed info for each commit to get stats
    const detailedCommits = await Promise.all(
      commits.map((commit) =>
        this.fetchCommitDetails(userId, owner, repo, commit.sha),
      ),
    );

    // Upsert commits to database
    for (const commitData of detailedCommits) {
      await this.prisma.gitHubCommit.upsert({
        where: { sha: commitData.sha },
        create: {
          ...commitData,
          todoId: todo.id,
        },
        update: {
          message: commitData.message,
          author: commitData.author,
          authorEmail: commitData.authorEmail,
          authorAvatar: commitData.authorAvatar,
          additions: commitData.additions,
          deletions: commitData.deletions,
        },
      });
    }

    // Update last synced timestamp
    await this.prisma.todo.update({
      where: { id: todoId },
      data: { lastSyncedAt: new Date() },
    });

    return {
      synced: detailedCommits.length,
      commits: detailedCommits,
    };
  }

  /**
   * Get commits for a todo
   */
  async getCommitsForTodo(userId: string, todoId: string) {
    const todo = await this.prisma.todo.findFirst({
      where: { id: todoId, week: { userId } },
      select: { id: true },
    });

    if (!todo) {
      throw new NotFoundException('Todo not found');
    }

    return this.prisma.gitHubCommit.findMany({
      where: { todoId: todo.id },
      orderBy: { committedAt: 'desc' },
    });
  }

  // Create GitHub Issue
  async createIssue(
    userId: string,
    repoOwner: string,
    repoName: string,
    issueData: {
      title: string;
      body?: string;
      labels?: string[];
      assignees?: string[];
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.githubAccessToken) {
      throw new UnauthorizedException('GitHub token not set');
    }

    try {
      const response = await axios.post(
        `${this.GITHUB_API}/repos/${repoOwner}/${repoName}/issues`,
        {
          title: issueData.title,
          body: issueData.body || '',
          labels: issueData.labels || [],
          assignees: issueData.assignees || [],
        },
        {
          headers: {
            Authorization: `Bearer ${user.githubAccessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        },
      );

      return {
        number: response.data.number,
        url: response.data.html_url,
        title: response.data.title,
        state: response.data.state,
        createdAt: response.data.created_at,
      };
    } catch (error) {
      console.error('Failed to create GitHub issue:', error);
      throw new BadRequestException('Failed to create GitHub issue');
    }
  }

  // Get Recent Commits from User's Repos
  async getRecentCommits(userId: string, limit: number = 20) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.githubUsername || !user?.githubAccessToken) {
      throw new UnauthorizedException('GitHub not configured');
    }

    try {
      // Get user's repos first
      const reposResponse = await axios.get(
        `${this.GITHUB_API}/users/${user.githubUsername}/repos`,
        {
          headers: {
            Authorization: `Bearer ${user.githubAccessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
          params: {
            sort: 'updated',
            per_page: 10, // Get top 10 active repos
          },
        },
      );

      const commits: Array<{
        sha: string;
        message: string;
        author: string;
        authorAvatar?: string;
        date: string;
        url: string;
        repo: string;
        repoUrl: string;
      }> = [];

      // Get recent commits from each repo
      for (const repo of reposResponse.data.slice(0, 10)) {
        // Scan top 10 active repos
        try {
          const commitsResponse = await axios.get(
            `${this.GITHUB_API}/repos/${user.githubUsername}/${repo.name}/commits`,
            {
              headers: {
                Authorization: `Bearer ${user.githubAccessToken}`,
                Accept: 'application/vnd.github.v3+json',
              },
              params: {
                per_page: 10, // Get more commits per repo
              },
            },
          );

          commits.push(
            ...commitsResponse.data.map((commit: any) => ({
              sha: commit.sha,
              message: commit.commit.message,
              author: commit.commit.author.name,
              authorAvatar: commit.author?.avatar_url,
              date: commit.commit.author.date,
              url: commit.html_url,
              repo: repo.name,
              repoUrl: repo.html_url,
            })),
          );
        } catch (error) {
          console.error(`Failed to fetch commits for ${repo.name}:`, error);
        }
      }

      // Sort by date and limit
      return commits
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch recent commits:', error);
      throw new BadRequestException('Failed to fetch recent commits');
    }
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getWeekEnd(weekStart: Date): Date {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6); // Sunday
    d.setHours(23, 59, 59, 999);
    return d;
  }
}
