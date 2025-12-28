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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../prisma");
let GithubService = class GithubService {
    prisma;
    GITHUB_API = 'https://api.github.com';
    CACHE_DURATION = 1000 * 60 * 30;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async setUsername(userId, username) {
        const response = await fetch(`${this.GITHUB_API}/users/${username}`);
        if (!response.ok) {
            throw new common_1.BadRequestException('GitHub user not found');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { githubUsername: username },
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
            await this.syncRepos(userId);
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
        const response = await fetch(`${this.GITHUB_API}/users/${user.githubUsername}/repos?per_page=100&sort=updated`);
        if (!response.ok) {
            throw new common_1.BadRequestException('Failed to fetch GitHub repos');
        }
        const repos = await response.json();
        const now = new Date();
        for (const repo of repos) {
            if (repo.private)
                continue;
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
            await this.prisma.gitHubRepoStat.create({
                data: {
                    repoId: (await this.prisma.gitHubRepo.findUnique({
                        where: { userId_repoId: { userId, repoId: repo.id } },
                    })).id,
                    stars: repo.stargazers_count,
                    forks: repo.forks_count,
                    commits: 0,
                    recordedAt: now,
                },
            });
        }
        return { synced: repos.filter((r) => !r.private).length };
    }
    async getRepoStats(userId, repoId, days = 30) {
        const repo = await this.prisma.gitHubRepo.findUnique({
            where: { id: repoId },
            select: { userId: true },
        });
        if (!repo)
            throw new common_1.NotFoundException('Repo not found');
        if (repo.userId !== userId)
            throw new common_1.NotFoundException('Repo not found');
        const since = new Date();
        since.setDate(since.getDate() - days);
        return this.prisma.gitHubRepoStat.findMany({
            where: { repoId, recordedAt: { gte: since } },
            orderBy: { recordedAt: 'asc' },
        });
    }
};
exports.GithubService = GithubService;
exports.GithubService = GithubService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], GithubService);
//# sourceMappingURL=github.service.js.map