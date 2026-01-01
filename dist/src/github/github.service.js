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
var GithubService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubService = void 0;
const common_1 = require("@nestjs/common");
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
    async getRepos(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { githubUsername: true },
        });
        if (!user?.githubUsername) {
            throw new common_1.NotFoundException('GitHub username not set');
        }
        const lastRepo = await this.prisma.gitHubRepo.findFirst({
            where: { userId },
            orderBy: { lastSyncedAt: 'desc' },
        });
        const needsSync = !lastRepo ||
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
};
exports.GithubService = GithubService;
exports.GithubService = GithubService = GithubService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], GithubService);
//# sourceMappingURL=github.service.js.map