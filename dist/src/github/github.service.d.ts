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
    setToken(userId: string, token: string | null): Promise<{
        message: string;
    }>;
    getTokenStatus(userId: string): Promise<{
        hasToken: boolean;
    }>;
    getRepos(userId: string): Promise<{
        url: string;
        id: string;
        name: string;
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
    getLanguageStats(userId: string): Promise<{
        language: string;
        count: number;
    }[]>;
    getPullRequests(userId: string, state?: 'open' | 'closed' | 'all'): Promise<any[]>;
    getPRDetails(owner: string, repo: string, prNumber: number, userId: string): Promise<{
        reviews: any;
        id: number;
        number: number;
        title: string;
        body: string | null;
        state: "open" | "closed";
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
        labels: {
            name: string;
            color: string;
        }[];
        created_at: string;
        updated_at: string;
        merged_at: string | null;
        draft: boolean;
        additions: number;
        deletions: number;
        changed_files: number;
        requested_reviewers: {
            login: string;
        }[];
    }>;
    getPRFiles(owner: string, repo: string, prNumber: number, userId: string): Promise<any>;
    submitReview(owner: string, repo: string, prNumber: number, userId: string, body: string, event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT'): Promise<any>;
    getOverallStats(userId: string): Promise<{
        totalRepos: number;
        totalStars: number;
        totalForks: number;
        topLanguages: {
            language: string;
            count: number;
        }[];
    }>;
    linkRepoToProject(userId: string, projectId: string, githubRepo: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        order: string | null;
        lastSyncedAt: Date | null;
        status: string;
        information: string | null;
        orderNum: number;
        githubRepo: string | null;
        githubUrl: string | null;
        categoryId: string | null;
        paymentId: string | null;
    }>;
    syncIssuesForProject(userId: string, projectId: string): Promise<{
        synced: number;
        todos: any[];
    }>;
    createGitHubIssue(userId: string, todoId: string, githubRepo: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        day: string;
        title: string;
        order: number;
        lastSyncedAt: Date | null;
        isCompleted: boolean;
        githubIssueNumber: number | null;
        githubIssueUrl: string | null;
        githubRepoName: string | null;
        githubLabels: string | null;
        weekId: string;
    }>;
    syncSingleTodo(userId: string, todoId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        day: string;
        title: string;
        order: number;
        lastSyncedAt: Date | null;
        isCompleted: boolean;
        githubIssueNumber: number | null;
        githubIssueUrl: string | null;
        githubRepoName: string | null;
        githubLabels: string | null;
        weekId: string;
    }>;
    private getWeekStart;
    private getWeekEnd;
}
