import type { User } from '@prisma/client';
import { GithubService } from './github.service';
import { SetGithubUsernameDto, SetGithubTokenDto, SyncIssuesDto, CreateIssueDto, LinkRepoDto, SyncSingleTodoDto, SubmitReviewDto } from './dto';
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
        number: number;
        url: string;
        title: string;
        state: string;
        createdAt: string;
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
    getPullRequests(user: User, state?: 'open' | 'closed' | 'all'): Promise<(import("./github.types").GitHubIssueSearchItem | {
        additions: number;
        deletions: number;
        changed_files: number;
        id: number;
        number: number;
        title: string;
        body: string | null;
        state: string;
        html_url: string;
        repository_url: string;
        labels: Array<{
            name: string;
            color: string;
        }>;
        created_at: string;
        updated_at: string;
        closed_at: string | null;
    })[]>;
    getPRDetails(user: User, owner: string, repo: string, number: string): Promise<{
        reviews: import("./github.types").GitHubReview[];
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
    getPRFiles(user: User, owner: string, repo: string, number: string): Promise<{
        sha: string;
        filename: string;
        status: string;
        additions: number;
        deletions: number;
        changes: number;
        patch?: string;
    }[]>;
    submitReview(user: User, owner: string, repo: string, number: string, body: SubmitReviewDto): Promise<import("./github.types").GitHubReview>;
    getContributions(user: User): Promise<{
        contributions: {
            date: string;
            count: number;
            level: number;
        }[];
        stats: {
            totalContributions: number;
            activeDays: number;
            longestStreak: number;
            currentStreak: number;
        };
        isFallback: boolean;
    } | {
        contributions: {
            date: string;
            count: number;
            level: number;
        }[];
        stats: {
            totalContributions: number;
            activeDays: number;
            longestStreak: number;
            currentStreak: number;
            commits: number;
            issues: number;
            pullRequests: number;
            reviews: number;
        };
        repositoryBreakdown: {
            name: string;
            commits: number;
            additions: number;
            deletions: number;
            language: string | null;
        }[];
    }>;
    getWorkflowRuns(user: User, repoName?: string): Promise<({
        id: number;
        name: string;
        status: string;
        conclusion: string | null;
        branch: string;
        event: string;
        url: string;
        createdAt: string;
        updatedAt: string;
        runNumber: number;
        actor: {
            login: string;
            avatar: string;
        };
        headCommit: {
            message: string;
            author: string;
        };
    } & {
        repo: string;
        repoFullName?: string;
    })[]>;
    getWorkflows(user: User, repoName: string): Promise<{
        id: number;
        name: string;
        path: string;
        state: string;
        url: string;
        badgeUrl: string;
    }[]>;
    triggerWorkflow(user: User, repoName: string, workflowId: string, body: {
        branch?: string;
    }): Promise<{
        message: string;
    }>;
}
