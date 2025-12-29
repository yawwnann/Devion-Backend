import { PrismaService } from '../prisma';
export declare class GithubService {
    private prisma;
    private readonly logger;
    private readonly GITHUB_API;
    private readonly CACHE_DURATION;
    constructor(prisma: PrismaService);
    setUsername(userId: string, username: string): Promise<{
        synced: number;
    }>;
    getRepos(userId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        repoId: number;
        fullName: string;
        description: string | null;
        url: string;
        language: string | null;
        stars: number;
        forks: number;
        openIssues: number;
        isPrivate: boolean;
        lastSyncedAt: Date;
    }[]>;
    syncRepos(userId: string): Promise<{
        synced: number;
    }>;
    getRepoStats(userId: string, repoId: string, days?: number): Promise<{
        id: string;
        createdAt: Date;
        repoId: string;
        stars: number;
        forks: number;
        commits: number;
        recordedAt: Date;
    }[]>;
}
