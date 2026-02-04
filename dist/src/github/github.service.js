"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var GithubService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const prisma_1 = require("../prisma");
let GithubService = GithubService_1 = class GithubService {
    prisma;
    logger = new common_1.Logger(GithubService_1.name);
    GITHUB_API = 'https://api.github.com';
    CACHE_DURATION = 1000 * 60 * 30;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async setUsername(userId, username) {
        const sanitizedUsername = username.trim().toLowerCase();
        if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(sanitizedUsername)) {
            throw new common_1.BadRequestException('Invalid GitHub username format');
        }
        try {
            const response = await fetch(`${this.GITHUB_API}/users/${sanitizedUsername}`, {
                headers: { 'User-Agent': 'Devion-App' },
            });
            if (!response.ok) {
                throw new common_1.BadRequestException('GitHub user not found');
            }
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException)
                throw error;
            this.logger.error(`GitHub API error: ${error}`);
            throw new common_1.BadRequestException('Failed to verify GitHub user');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { githubUsername: sanitizedUsername },
        });
        return this.syncRepos(userId);
    }
    async setToken(userId, token) {
        if (token) {
            try {
                const response = await axios_1.default.get(`${this.GITHUB_API}/user`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                });
                if (!response.data?.login) {
                    throw new common_1.BadRequestException('Invalid GitHub token');
                }
            }
            catch {
                throw new common_1.BadRequestException('Invalid GitHub token');
            }
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { githubAccessToken: token },
        });
        return { message: token ? 'Token saved successfully' : 'Token removed' };
    }
    async getTokenStatus(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { githubAccessToken: true },
        });
        return { hasToken: !!user?.githubAccessToken };
    }
    async getRepos(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { githubUsername: true },
        });
        if (!user?.githubUsername) {
            throw new common_1.NotFoundException('GitHub username not set');
        }
        const existingRepos = await this.prisma.gitHubRepo.findMany({
            where: { userId },
            take: 1,
        });
        const lastRepo = await this.prisma.gitHubRepo.findFirst({
            where: { userId },
            orderBy: { lastSyncedAt: 'desc' },
        });
        const needsSync = !lastRepo ||
            existingRepos.length === 0 ||
            Date.now() - lastRepo.lastSyncedAt.getTime() > this.CACHE_DURATION;
        if (needsSync) {
            try {
                await this.syncRepos(userId);
            }
            catch (error) {
                this.logger.warn(`Sync failed, returning cached data: ${error}`);
            }
        }
        return this.prisma.gitHubRepo.findMany({
            where: { userId },
            orderBy: { stars: 'desc' },
        });
    }
    async syncRepos(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { githubUsername: true, githubAccessToken: true },
        });
        if (!user?.githubUsername) {
            throw new common_1.NotFoundException('GitHub username not set');
        }
        const headers = {
            'User-Agent': 'Devion-App',
            Accept: 'application/vnd.github.v3+json',
        };
        let url;
        if (user.githubAccessToken) {
            headers.Authorization = `Bearer ${user.githubAccessToken}`;
            url = `${this.GITHUB_API}/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator`;
        }
        else {
            url = `${this.GITHUB_API}/users/${user.githubUsername}/repos?per_page=100&sort=updated`;
        }
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new common_1.BadRequestException('Failed to fetch GitHub repos');
        }
        const repos = (await response.json());
        const now = new Date();
        await this.prisma.$transaction(async (tx) => {
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
        }, {
            maxWait: 15000,
            timeout: 30000,
        });
        return { synced: repos.length };
    }
    async getRepoStats(userId, repoId, days = 30) {
        const repo = await this.prisma.gitHubRepo.findUnique({
            where: { id: repoId },
            select: { userId: true },
        });
        if (!repo || repo.userId !== userId) {
            throw new common_1.NotFoundException('Repo not found');
        }
        const since = new Date();
        since.setDate(since.getDate() - days);
        return this.prisma.gitHubRepoStat.findMany({
            where: { repoId, recordedAt: { gte: since } },
            orderBy: { recordedAt: 'asc' },
        });
    }
    async getLanguageStats(userId) {
        const repos = await this.prisma.gitHubRepo.findMany({
            where: { userId },
            select: { language: true },
        });
        const languageCount = new Map();
        repos.forEach((repo) => {
            const lang = repo.language || 'Unknown';
            languageCount.set(lang, (languageCount.get(lang) || 0) + 1);
        });
        return Array.from(languageCount.entries())
            .map(([language, count]) => ({ language, count }))
            .sort((a, b) => b.count - a.count);
    }
    async getPullRequests(userId, state = 'open') {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { githubAccessToken: true, githubUsername: true },
        });
        if (!user?.githubAccessToken || !user?.githubUsername) {
            throw new common_1.BadRequestException('GitHub configuration not found');
        }
        const url = `${this.GITHUB_API}/search/issues?q=is:pr+author:${user.githubUsername}+state:${state}&sort=updated&order=desc&per_page=50`;
        const response = await axios_1.default.get(url, {
            headers: {
                Authorization: `Bearer ${user.githubAccessToken}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });
        const prs = await Promise.all(response.data.items
            .slice(0, 20)
            .map(async (pr) => {
            try {
                const repoPath = pr.repository_url.replace('https://api.github.com/repos/', '');
                const [owner, repo] = repoPath.split('/');
                const prDetail = await axios_1.default.get(`${this.GITHUB_API}/repos/${owner}/${repo}/pulls/${pr.number}`, {
                    headers: {
                        Authorization: `Bearer ${user.githubAccessToken}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                });
                return {
                    ...pr,
                    additions: prDetail.data.additions,
                    deletions: prDetail.data.deletions,
                    changed_files: prDetail.data.changed_files,
                };
            }
            catch {
                return pr;
            }
        }));
        return prs;
    }
    async getPRDetails(owner, repo, prNumber, userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { githubAccessToken: true },
        });
        if (!user?.githubAccessToken) {
            throw new common_1.BadRequestException('GitHub access token not found');
        }
        const url = `${this.GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}`;
        const response = await axios_1.default.get(url, {
            headers: {
                Authorization: `Bearer ${user.githubAccessToken}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });
        const reviewsUrl = `${this.GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/reviews`;
        const reviewsResponse = await axios_1.default.get(reviewsUrl, {
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
    async getPRFiles(owner, repo, prNumber, userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { githubAccessToken: true },
        });
        if (!user?.githubAccessToken) {
            throw new common_1.BadRequestException('GitHub access token not found');
        }
        const url = `${this.GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/files`;
        const response = await axios_1.default.get(url, {
            headers: {
                Authorization: `Bearer ${user.githubAccessToken}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });
        return response.data;
    }
    async submitReview(owner, repo, prNumber, userId, body, event) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { githubAccessToken: true },
        });
        if (!user?.githubAccessToken) {
            throw new common_1.BadRequestException('GitHub access token not found');
        }
        const url = `${this.GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/reviews`;
        try {
            const response = await axios_1.default.post(url, { body, event }, {
                headers: {
                    Authorization: `Bearer ${user.githubAccessToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                if (error.response?.status === 422) {
                    const message = error.response?.data?.message ||
                        'Validation failed';
                    throw new common_1.BadRequestException(message);
                }
            }
            throw error;
        }
    }
    async getOverallStats(userId) {
        const repos = await this.prisma.gitHubRepo.findMany({
            where: { userId },
        });
        const totalStars = repos.reduce((sum, repo) => sum + repo.stars, 0);
        const totalForks = repos.reduce((sum, repo) => sum + repo.forks, 0);
        const totalRepos = repos.length;
        const languages = new Map();
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
    async linkRepoToProject(userId, projectId, githubRepo) {
        if (!/^[\w-]+\/[\w.-]+$/.test(githubRepo)) {
            throw new common_1.BadRequestException('Invalid GitHub repo format. Use: owner/repo');
        }
        try {
            const response = await fetch(`${this.GITHUB_API}/repos/${githubRepo}`, {
                headers: { 'User-Agent': 'Devion-App' },
            });
            if (!response.ok) {
                throw new common_1.BadRequestException('GitHub repository not found');
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new common_1.BadRequestException('Failed to verify GitHub repository: ' + message);
        }
        return this.prisma.project.update({
            where: { id: projectId, userId },
            data: {
                githubRepo,
                githubUrl: `https://github.com/${githubRepo}`,
            },
        });
    }
    async syncIssuesForProject(userId, projectId) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId, userId },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        if (!project.githubRepo) {
            throw new common_1.BadRequestException('Project is not linked to a GitHub repo');
        }
        const response = await fetch(`${this.GITHUB_API}/repos/${project.githubRepo}/issues?state=all&per_page=100`, {
            headers: { 'User-Agent': 'Devion-App' },
        });
        if (!response.ok) {
            throw new common_1.BadRequestException('Failed to fetch GitHub issues');
        }
        const issues = (await response.json());
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
        const syncedTodos = [];
        for (const issue of issues) {
            const existingTodo = await this.prisma.todo.findFirst({
                where: {
                    githubIssueNumber: issue.number,
                    githubRepoName: project.githubRepo,
                    week: { userId },
                },
            });
            const labels = issue.labels.map((l) => l.name).join(', ');
            if (existingTodo) {
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
            }
            else {
                const created = await this.prisma.todo.create({
                    data: {
                        title: issue.title,
                        isCompleted: issue.state === 'closed',
                        day: 'Mon',
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
        await this.prisma.project.update({
            where: { id: projectId },
            data: { lastSyncedAt: new Date() },
        });
        return {
            synced: syncedTodos.length,
            todos: syncedTodos,
        };
    }
    async createGitHubIssue(userId, todoId, githubRepo) {
        const todo = await this.prisma.todo.findFirst({
            where: { id: todoId, week: { userId } },
        });
        if (!todo) {
            throw new common_1.NotFoundException('Todo not found');
        }
        if (todo.githubIssueNumber) {
            throw new common_1.BadRequestException('Todo is already linked to a GitHub issue');
        }
        const response = await fetch(`${this.GITHUB_API}/repos/${githubRepo}/issues`, {
            method: 'POST',
            headers: {
                'User-Agent': 'Devion-App',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: todo.title,
                body: `Created from Devion Todo`,
            }),
        });
        if (!response.ok) {
            throw new common_1.BadRequestException('Failed to create GitHub issue. Make sure you have proper authentication.');
        }
        const issue = await response.json();
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
    async syncSingleTodo(userId, todoId) {
        const todo = await this.prisma.todo.findFirst({
            where: { id: todoId, week: { userId } },
        });
        if (!todo || !todo.githubIssueNumber || !todo.githubRepoName) {
            throw new common_1.BadRequestException('Todo is not linked to a GitHub issue');
        }
        const response = await fetch(`${this.GITHUB_API}/repos/${todo.githubRepoName}/issues/${todo.githubIssueNumber}`, {
            headers: { 'User-Agent': 'Devion-App' },
        });
        if (!response.ok) {
            throw new common_1.BadRequestException('Failed to fetch GitHub issue');
        }
        const issue = await response.json();
        const labels = issue.labels.map((l) => l.name).join(', ');
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
    async fetchCommitsForIssue(userId, repoOwner, repoName, issueNumber) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { githubAccessToken: true },
        });
        if (!user?.githubAccessToken) {
            throw new common_1.BadRequestException('GitHub access token required for commit tracking');
        }
        const searchQuery = `repo:${repoOwner}/${repoName} ${issueNumber}`;
        try {
            const response = await axios_1.default.get(`${this.GITHUB_API}/search/commits?q=${encodeURIComponent(searchQuery)}&sort=committer-date&order=desc&per_page=50`, {
                headers: {
                    Authorization: `Bearer ${user.githubAccessToken}`,
                    Accept: 'application/vnd.github.cloak-preview+json',
                },
            });
            return response.data.items.map((commit) => ({
                sha: commit.sha,
                message: commit.commit.message,
                author: commit.commit.author?.name || 'Unknown',
                authorEmail: commit.commit.author?.email,
                authorAvatar: commit.author?.avatar_url,
                url: commit.html_url,
                htmlUrl: commit.html_url,
                committedAt: new Date(commit.commit.author?.date || new Date()),
            }));
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to fetch commits: ${message}`);
            return [];
        }
    }
    async fetchCommitDetails(userId, repoOwner, repoName, sha) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { githubAccessToken: true },
        });
        if (!user?.githubAccessToken) {
            throw new common_1.BadRequestException('GitHub access token required');
        }
        const response = await axios_1.default.get(`${this.GITHUB_API}/repos/${repoOwner}/${repoName}/commits/${sha}`, {
            headers: {
                Authorization: `Bearer ${user.githubAccessToken}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });
        return {
            sha: response.data.sha,
            message: response.data.commit.message,
            author: response.data.commit.author?.name || 'Unknown',
            authorEmail: response.data.commit.author?.email,
            authorAvatar: response.data.author?.avatar_url,
            url: response.data.html_url,
            htmlUrl: response.data.html_url,
            additions: response.data.stats?.additions || 0,
            deletions: response.data.stats?.deletions || 0,
            committedAt: new Date(response.data.commit.author?.date || new Date()),
        };
    }
    async syncCommitsForTodo(userId, todoId) {
        const todo = await this.prisma.todo.findFirst({
            where: { id: todoId, week: { userId } },
            select: {
                id: true,
                githubIssueNumber: true,
                githubRepoName: true,
            },
        });
        if (!todo || !todo.githubIssueNumber || !todo.githubRepoName) {
            throw new common_1.BadRequestException('Todo not linked to GitHub issue');
        }
        const [owner, repo] = todo.githubRepoName.split('/');
        if (!owner || !repo) {
            throw new common_1.BadRequestException('Invalid repository name format. Expected: owner/repo');
        }
        const commits = await this.fetchCommitsForIssue(userId, owner, repo, todo.githubIssueNumber);
        const detailedCommits = await Promise.all(commits.map((commit) => this.fetchCommitDetails(userId, owner, repo, commit.sha)));
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
        await this.prisma.todo.update({
            where: { id: todoId },
            data: { lastSyncedAt: new Date() },
        });
        return {
            synced: detailedCommits.length,
            commits: detailedCommits,
        };
    }
    async getCommitsForTodo(userId, todoId) {
        const todo = await this.prisma.todo.findFirst({
            where: { id: todoId, week: { userId } },
            select: { id: true },
        });
        if (!todo) {
            throw new common_1.NotFoundException('Todo not found');
        }
        return this.prisma.gitHubCommit.findMany({
            where: { todoId: todo.id },
            orderBy: { committedAt: 'desc' },
        });
    }
    async createIssue(userId, repoOwner, repoName, issueData) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user?.githubAccessToken) {
            throw new common_1.UnauthorizedException('GitHub token not set');
        }
        try {
            const response = await axios_1.default.post(`${this.GITHUB_API}/repos/${repoOwner}/${repoName}/issues`, {
                title: issueData.title,
                body: issueData.body || '',
                labels: issueData.labels || [],
                assignees: issueData.assignees || [],
            }, {
                headers: {
                    Authorization: `Bearer ${user.githubAccessToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            });
            return {
                number: response.data.number,
                url: response.data.html_url,
                title: response.data.title,
                state: response.data.state,
                createdAt: response.data.created_at,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Failed to create GitHub issue:', message);
            throw new common_1.BadRequestException('Failed to create GitHub issue');
        }
    }
    async getRecentCommits(userId, limit = 20) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user?.githubUsername || !user?.githubAccessToken) {
            throw new common_1.UnauthorizedException('GitHub not configured');
        }
        try {
            const reposResponse = await axios_1.default.get(`${this.GITHUB_API}/users/${user.githubUsername}/repos`, {
                headers: {
                    Authorization: `Bearer ${user.githubAccessToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
                params: {
                    sort: 'updated',
                    per_page: 10,
                },
            });
            const commits = [];
            for (const repo of reposResponse.data.slice(0, 10)) {
                try {
                    const commitsResponse = await axios_1.default.get(`${this.GITHUB_API}/repos/${user.githubUsername}/${repo.name}/commits`, {
                        headers: {
                            Authorization: `Bearer ${user.githubAccessToken}`,
                            Accept: 'application/vnd.github.v3+json',
                        },
                        params: {
                            per_page: 10,
                        },
                    });
                    commits.push(...commitsResponse.data.map((commit) => ({
                        sha: commit.sha,
                        message: commit.commit.message,
                        author: commit.commit.author.name,
                        authorAvatar: commit.author?.avatar_url,
                        date: commit.commit.author.date,
                        url: commit.html_url,
                        repo: repo.name,
                        repoUrl: repo.html_url,
                    })));
                }
                catch (error) {
                    this.logger.error(`Failed to fetch commits for ${repo.name}:`, error instanceof Error ? error.message : 'Unknown error');
                }
            }
            return commits
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, limit);
        }
        catch (error) {
            this.logger.error('Failed to fetch recent commits:', error instanceof Error ? error.message : 'Unknown error');
            throw new common_1.BadRequestException('Failed to fetch recent commits');
        }
    }
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }
    getWeekEnd(weekStart) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 6);
        d.setHours(23, 59, 59, 999);
        return d;
    }
    async getContributions(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user?.githubUsername) {
            throw new common_1.NotFoundException('GitHub username not set');
        }
        try {
            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'Devion-App',
            };
            if (user.githubAccessToken) {
                headers['Authorization'] = `Bearer ${user.githubAccessToken}`;
                const endDate = new Date();
                const startDate = new Date();
                startDate.setFullYear(startDate.getFullYear() - 1);
                const query = `
          query($username: String!, $from: DateTime!, $to: DateTime!) {
            user(login: $username) {
              contributionsCollection(from: $from, to: $to) {
                totalCommitContributions
                totalIssueContributions
                totalPullRequestContributions
                totalPullRequestReviewContributions
                contributionCalendar {
                  totalContributions
                  weeks {
                    contributionDays {
                      date
                      contributionCount
                      contributionLevel
                    }
                  }
                }
              }
            }
          }
        `;
                const response = await axios_1.default.post('https://api.github.com/graphql', {
                    query,
                    variables: {
                        username: user.githubUsername,
                        from: startDate.toISOString(),
                        to: endDate.toISOString(),
                    },
                }, { headers });
                if (response.data.errors) {
                    this.logger.error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
                    throw new Error('GraphQL query failed');
                }
                const collection = response.data.data?.user?.contributionsCollection;
                if (!collection) {
                    throw new Error('No contribution data found');
                }
                const calendar = collection.contributionCalendar;
                const contributions = [];
                for (const week of calendar.weeks) {
                    for (const day of week.contributionDays) {
                        contributions.push({
                            date: day.date,
                            count: day.contributionCount,
                            level: this.mapContributionLevel(day.contributionLevel),
                        });
                    }
                }
                const contributionMap = {};
                for (const c of contributions) {
                    if (c.count > 0) {
                        contributionMap[c.date] = c.count;
                    }
                }
                const longestStreak = this.calculateStreak(contributionMap);
                const currentStreak = this.calculateCurrentStreak(contributionMap);
                let repositoryBreakdown = [];
                try {
                    repositoryBreakdown = await Promise.race([
                        this.getRepositoryBreakdown(user.githubUsername, user.githubAccessToken),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000)),
                    ]);
                }
                catch (error) {
                    this.logger.warn(`Repository breakdown skipped: ${error instanceof Error ? error.message : String(error)}`);
                    repositoryBreakdown = [];
                }
                return {
                    contributions,
                    stats: {
                        totalContributions: calendar.totalContributions,
                        activeDays: contributions.filter((c) => c.count > 0).length,
                        longestStreak,
                        currentStreak,
                        commits: collection.totalCommitContributions,
                        issues: collection.totalIssueContributions,
                        pullRequests: collection.totalPullRequestContributions,
                        reviews: collection.totalPullRequestReviewContributions,
                    },
                    repositoryBreakdown,
                };
            }
            return this.getContributionsFallback(user.githubUsername);
        }
        catch (error) {
            this.logger.error(`Failed to fetch contributions: ${error instanceof Error ? error.message : String(error)}`);
            return this.getContributionsFallback(user.githubUsername);
        }
    }
    mapContributionLevel(level) {
        switch (level) {
            case 'NONE':
                return 0;
            case 'FIRST_QUARTILE':
                return 1;
            case 'SECOND_QUARTILE':
                return 2;
            case 'THIRD_QUARTILE':
                return 3;
            case 'FOURTH_QUARTILE':
                return 4;
            default:
                return 0;
        }
    }
    async getContributionsFallback(username) {
        try {
            const headers = {
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'Devion-App',
            };
            const reposResponse = await axios_1.default.get(`${this.GITHUB_API}/users/${username}/repos`, {
                headers,
                params: {
                    per_page: 30,
                    sort: 'pushed',
                },
            });
            const endDate = new Date();
            const startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);
            const contributionMap = {};
            for (const repo of reposResponse.data.slice(0, 20)) {
                try {
                    const commitsResponse = await axios_1.default.get(`${this.GITHUB_API}/repos/${username}/${repo.name}/commits`, {
                        headers,
                        params: {
                            author: username,
                            since: startDate.toISOString(),
                            until: endDate.toISOString(),
                            per_page: 100,
                        },
                    });
                    for (const commit of commitsResponse.data) {
                        const date = commit.commit.author.date.split('T')[0];
                        contributionMap[date] = (contributionMap[date] || 0) + 1;
                    }
                }
                catch {
                }
            }
            const contributions = Object.entries(contributionMap).map(([date, count]) => ({
                date,
                count,
                level: count === 0
                    ? 0
                    : count <= 2
                        ? 1
                        : count <= 5
                            ? 2
                            : count <= 10
                                ? 3
                                : 4,
            }));
            const totalContributions = Object.values(contributionMap).reduce((sum, count) => sum + count, 0);
            const activeDays = Object.keys(contributionMap).length;
            const longestStreak = this.calculateStreak(contributionMap);
            const currentStreak = this.calculateCurrentStreak(contributionMap);
            return {
                contributions,
                stats: {
                    totalContributions,
                    activeDays,
                    longestStreak,
                    currentStreak,
                },
                isFallback: true,
            };
        }
        catch (error) {
            this.logger.error(`Fallback contribution fetch failed: ${error}`);
            return {
                contributions: [],
                stats: {
                    totalContributions: 0,
                    activeDays: 0,
                    longestStreak: 0,
                    currentStreak: 0,
                },
                isFallback: true,
            };
        }
    }
    calculateStreak(contributionMap) {
        const dates = Object.keys(contributionMap).sort();
        let maxStreak = 0;
        let currentStreak = 0;
        let prevDate = null;
        for (const dateStr of dates) {
            const date = new Date(dateStr);
            if (prevDate) {
                const diff = (date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
                if (diff === 1) {
                    currentStreak++;
                }
                else {
                    maxStreak = Math.max(maxStreak, currentStreak);
                    currentStreak = 1;
                }
            }
            else {
                currentStreak = 1;
            }
            prevDate = date;
        }
        return Math.max(maxStreak, currentStreak);
    }
    calculateCurrentStreak(contributionMap) {
        const today = new Date();
        let streak = 0;
        const checkDate = new Date(today);
        while (true) {
            const dateStr = checkDate.toISOString().split('T')[0];
            if (contributionMap[dateStr]) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            }
            else {
                break;
            }
        }
        return streak;
    }
    async getRepositoryBreakdown(username, accessToken) {
        try {
            const headers = {
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'Devion-App',
            };
            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
            }
            const endDate = new Date();
            const startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);
            const reposResponse = await axios_1.default.get(`${this.GITHUB_API}/users/${username}/repos`, {
                headers,
                params: {
                    per_page: 30,
                    sort: 'pushed',
                },
                timeout: 5000,
            });
            const topRepos = reposResponse.data.slice(0, 10);
            const repoPromises = topRepos.map(async (repo) => {
                try {
                    const commitsResponse = await axios_1.default.get(`${this.GITHUB_API}/repos/${username}/${repo.name}/commits`, {
                        headers,
                        params: {
                            author: username,
                            since: startDate.toISOString(),
                            until: endDate.toISOString(),
                            per_page: 100,
                        },
                        timeout: 5000,
                    });
                    if (commitsResponse.data.length > 0) {
                        return {
                            name: repo.name,
                            commits: commitsResponse.data.length,
                            additions: 0,
                            deletions: 0,
                            language: repo.language,
                        };
                    }
                    return null;
                }
                catch {
                    return null;
                }
            });
            const results = await Promise.all(repoPromises);
            const repoBreakdown = results.filter((r) => r !== null);
            return repoBreakdown.sort((a, b) => b.commits - a.commits);
        }
        catch (error) {
            this.logger.error(`Failed to get repository breakdown: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }
    async getWorkflowRuns(userId, repoName) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user?.githubUsername) {
            throw new common_1.NotFoundException('GitHub username not set');
        }
        if (!user.githubAccessToken) {
            throw new common_1.UnauthorizedException('GitHub token required to access workflow runs');
        }
        const headers = {
            Authorization: `Bearer ${user.githubAccessToken}`,
            Accept: 'application/vnd.github.v3+json',
        };
        try {
            const workflows = [];
            if (repoName) {
                const response = await axios_1.default.get(`${this.GITHUB_API}/repos/${user.githubUsername}/${repoName}/actions/runs`, {
                    headers,
                    params: { per_page: 20 },
                });
                workflows.push(...response.data.workflow_runs.map((run) => ({
                    ...this.formatWorkflowRun(run),
                    repo: repoName,
                })));
            }
            else {
                const reposResponse = await axios_1.default.get(`${this.GITHUB_API}/user/repos`, {
                    headers,
                    params: {
                        per_page: 10,
                        sort: 'pushed',
                    },
                });
                for (const repo of reposResponse.data) {
                    try {
                        const runsResponse = await axios_1.default.get(`${this.GITHUB_API}/repos/${repo.full_name}/actions/runs`, {
                            headers,
                            params: { per_page: 5 },
                        });
                        workflows.push(...runsResponse.data.workflow_runs.map((run) => ({
                            ...this.formatWorkflowRun(run),
                            repo: repo.name,
                            repoFullName: repo.full_name,
                        })));
                    }
                    catch {
                    }
                }
            }
            workflows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return workflows.slice(0, 30);
        }
        catch (error) {
            this.logger.error(`Failed to fetch workflow runs: ${error instanceof Error ? error.message : String(error)}`);
            throw new common_1.BadRequestException('Failed to fetch GitHub Actions');
        }
    }
    formatWorkflowRun(run) {
        return {
            id: run.id,
            name: run.name,
            status: run.status,
            conclusion: run.conclusion,
            branch: run.head_branch,
            event: run.event,
            url: run.html_url,
            createdAt: run.created_at,
            updatedAt: run.updated_at,
            runNumber: run.run_number,
            actor: {
                login: run.actor?.login,
                avatar: run.actor?.avatar_url,
            },
            headCommit: {
                message: run.head_commit?.message,
                author: run.head_commit?.author?.name,
            },
        };
    }
    async getWorkflows(userId, repoName) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user?.githubUsername) {
            throw new common_1.NotFoundException('GitHub username not set');
        }
        if (!user.githubAccessToken) {
            throw new common_1.UnauthorizedException('GitHub token required');
        }
        try {
            const response = await axios_1.default.get(`${this.GITHUB_API}/repos/${user.githubUsername}/${repoName}/actions/workflows`, {
                headers: {
                    Authorization: `Bearer ${user.githubAccessToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            });
            return response.data.workflows.map((workflow) => ({
                id: workflow.id,
                name: workflow.name,
                path: workflow.path,
                state: workflow.state,
                url: workflow.html_url,
                badgeUrl: workflow.badge_url,
            }));
        }
        catch (error) {
            this.logger.error(`Failed to fetch workflows: ${error instanceof Error ? error.message : String(error)}`);
            throw new common_1.BadRequestException('Failed to fetch workflows');
        }
    }
    async triggerWorkflow(userId, repoName, workflowId, branch = 'main') {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user?.githubUsername) {
            throw new common_1.NotFoundException('GitHub username not set');
        }
        if (!user.githubAccessToken) {
            throw new common_1.UnauthorizedException('GitHub token required');
        }
        try {
            await axios_1.default.post(`${this.GITHUB_API}/repos/${user.githubUsername}/${repoName}/actions/workflows/${workflowId}/dispatches`, { ref: branch }, {
                headers: {
                    Authorization: `Bearer ${user.githubAccessToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            });
            return { message: 'Workflow triggered successfully' };
        }
        catch (error) {
            this.logger.error(`Failed to trigger workflow: ${error}`);
            throw new common_1.BadRequestException('Failed to trigger workflow');
        }
    }
};
exports.GithubService = GithubService;
exports.GithubService = GithubService = GithubService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], GithubService);
//# sourceMappingURL=github.service.js.map