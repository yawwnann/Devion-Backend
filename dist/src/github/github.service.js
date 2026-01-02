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
            catch (error) {
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
            select: { githubUsername: true },
        });
        if (!user?.githubUsername) {
            throw new common_1.NotFoundException('GitHub username not set');
        }
        const response = await fetch(`${this.GITHUB_API}/users/${user.githubUsername}/repos?per_page=100&sort=updated`, { headers: { 'User-Agent': 'Devion-App' } });
        if (!response.ok) {
            throw new common_1.BadRequestException('Failed to fetch GitHub repos');
        }
        const repos = await response.json();
        const now = new Date();
        const publicRepos = repos.filter((r) => !r.private);
        await this.prisma.$transaction(async (tx) => {
            await tx.gitHubRepo.deleteMany({
                where: { userId },
            });
            for (const repo of publicRepos) {
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
        return { synced: publicRepos.length };
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
        const prs = await Promise.all(response.data.items.slice(0, 20).map(async (pr) => {
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
            catch (error) {
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
            if (error.response?.status === 422) {
                const message = error.response?.data?.message || 'Validation failed';
                throw new common_1.BadRequestException(message);
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
            throw new common_1.BadRequestException('Failed to verify GitHub repository: ' + error.message);
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
        const issues = await response.json();
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
};
exports.GithubService = GithubService;
exports.GithubService = GithubService = GithubService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], GithubService);
//# sourceMappingURL=github.service.js.map