import type { User } from '@prisma/client';
import { GithubService } from './github.service';
import { SetGithubUsernameDto } from './dto';
export declare class GithubController {
    private githubService;
    constructor(githubService: GithubService);
    setUsername(user: User, dto: SetGithubUsernameDto): Promise<{
        synced: number;
    }>;
    getRepos(user: User): Promise<{
        url: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        repoId: number;
        fullName: string;
        description: string | null;
        language: string | null;
        stars: number;
        forks: number;
        openIssues: number;
        isPrivate: boolean;
        lastSyncedAt: Date;
    }[]>;
    syncRepos(user: User): Promise<{
        synced: number;
    }>;
    getRepoStats(user: User, repoId: string, days?: string): Promise<{
        id: string;
        createdAt: Date;
        repoId: string;
        stars: number;
        forks: number;
        commits: number;
        recordedAt: Date;
    }[]>;
}
