import type { User } from '@prisma/client';
import { GithubService } from './github.service';
import { SetGithubUsernameDto, SetGithubTokenDto, SyncIssuesDto, CreateIssueDto, LinkRepoDto, SyncSingleTodoDto } from './dto';
export declare class GithubController {
    private githubService;
    constructor(githubService: GithubService);
    setUsername(user: User, dto: SetGithubUsernameDto): Promise<{
        synced: number;
    }>;
    setToken(user: User, dto: SetGithubTokenDto): Promise<{
        message: string;
    }>;
    getTokenStatus(user: User): Promise<{
        hasToken: boolean;
    }>;
    getRepos(user: User): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        repoId: number;
        fullName: string;
        description: string | null;
        url: string;
        language: string | null;
        stars: number;
        forks: number;
        openIssues: number;
        isPrivate: boolean;
        userId: string;
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
    linkRepo(user: User, dto: LinkRepoDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        lastSyncedAt: Date | null;
        order: string | null;
        status: string;
        information: string | null;
        orderNum: number;
        dueDate: Date | null;
        startDate: Date | null;
        githubRepo: string | null;
        githubUrl: string | null;
        categoryId: string | null;
        paymentId: string | null;
    }>;
    syncIssues(user: User, dto: SyncIssuesDto): Promise<{
        synced: number;
        todos: any[];
    }>;
    createIssue(user: User, dto: CreateIssueDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        lastSyncedAt: Date | null;
        order: number;
        status: string;
        dueDate: Date | null;
        title: string;
        isCompleted: boolean;
        day: string;
        priority: string;
        githubIssueNumber: number | null;
        githubIssueUrl: string | null;
        githubRepoName: string | null;
        githubLabels: string | null;
        weekId: string;
    }>;
    syncSingleTodo(user: User, dto: SyncSingleTodoDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        lastSyncedAt: Date | null;
        order: number;
        status: string;
        dueDate: Date | null;
        title: string;
        isCompleted: boolean;
        day: string;
        priority: string;
        githubIssueNumber: number | null;
        githubIssueUrl: string | null;
        githubRepoName: string | null;
        githubLabels: string | null;
        weekId: string;
    }>;
    createIssueInRepo(user: User, owner: string, repo: string, body: {
        title: string;
        body?: string;
        labels?: string[];
        assignees?: string[];
    }): Promise<{
        number: any;
        url: any;
        title: any;
        state: any;
        createdAt: any;
    }>;
    getRecentCommits(user: User, limit?: string): Promise<{
        sha: string;
        message: string;
        author: string;
        authorAvatar?: string;
        date: string;
        url: string;
        repo: string;
        repoUrl: string;
    }[]>;
    getPullRequests(user: User, state?: 'open' | 'closed' | 'all'): Promise<any[]>;
    getPRDetails(user: User, owner: string, repo: string, number: string): Promise<{
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
    getPRFiles(user: User, owner: string, repo: string, number: string): Promise<any>;
    submitReview(user: User, owner: string, repo: string, number: string, body: {
        comment: string;
        event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
    }): Promise<any>;
}
