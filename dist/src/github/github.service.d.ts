import { PrismaService } from '../prisma';
import type { GitHubIssueSearchItem, GitHubReview } from './github.types';
interface FormattedWorkflowRun {
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
        login: string | undefined;
        avatar: string | undefined;
    };
    headCommit: {
        message: string | undefined;
        author: string | undefined;
    };
}
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
    getPullRequests(userId: string, state?: 'open' | 'closed' | 'all'): Promise<(GitHubIssueSearchItem | {
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
    getPRDetails(owner: string, repo: string, prNumber: number, userId: string): Promise<{
        reviews: GitHubReview[];
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
    getPRFiles(owner: string, repo: string, prNumber: number, userId: string): Promise<{
        sha: string;
        filename: string;
        status: string;
        additions: number;
        deletions: number;
        changes: number;
        patch?: string;
    }[]>;
    submitReview(owner: string, repo: string, prNumber: number, userId: string, body: string, event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT'): Promise<GitHubReview>;
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
    syncIssuesForProject(userId: string, projectId: string): Promise<{
        synced: number;
        todos: any[];
    }>;
    createGitHubIssue(userId: string, todoId: string, githubRepo: string): Promise<{
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
    syncSingleTodo(userId: string, todoId: string): Promise<{
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
    fetchCommitsForIssue(userId: string, repoOwner: string, repoName: string, issueNumber: number): Promise<{
        sha: string;
        message: string;
        author: string;
        authorEmail: string;
        authorAvatar: string | undefined;
        url: string;
        htmlUrl: string;
        committedAt: Date;
    }[]>;
    fetchCommitDetails(userId: string, repoOwner: string, repoName: string, sha: string): Promise<{
        sha: string;
        message: string;
        author: string;
        authorEmail: string;
        authorAvatar: string | undefined;
        url: string;
        htmlUrl: string;
        additions: number;
        deletions: number;
        committedAt: Date;
    }>;
    syncCommitsForTodo(userId: string, todoId: string): Promise<{
        synced: number;
        commits: {
            sha: string;
            message: string;
            author: string;
            authorEmail: string;
            authorAvatar: string | undefined;
            url: string;
            htmlUrl: string;
            additions: number;
            deletions: number;
            committedAt: Date;
        }[];
    }>;
    getCommitsForTodo(userId: string, todoId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        url: string;
        additions: number;
        deletions: number;
        sha: string;
        message: string;
        author: string;
        authorEmail: string | null;
        authorAvatar: string | null;
        htmlUrl: string;
        committedAt: Date;
        todoId: string;
    }[]>;
    createIssue(userId: string, repoOwner: string, repoName: string, issueData: {
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
    getRecentCommits(userId: string, limit?: number): Promise<{
        sha: string;
        message: string;
        author: string;
        authorAvatar?: string;
        date: string;
        url: string;
        repo: string;
        repoUrl: string;
    }[]>;
    private getWeekStart;
    private getWeekEnd;
    getContributions(userId: string): Promise<{
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
    private mapContributionLevel;
    private getContributionsFallback;
    private calculateStreak;
    private calculateCurrentStreak;
    private getRepositoryBreakdown;
    getWorkflowRuns(userId: string, repoName?: string): Promise<(FormattedWorkflowRun & {
        repo: string;
        repoFullName?: string;
    })[]>;
    private formatWorkflowRun;
    getWorkflows(userId: string, repoName: string): Promise<{
        id: number;
        name: string;
        path: string;
        state: string;
        url: string;
        badgeUrl: string;
    }[]>;
    triggerWorkflow(userId: string, repoName: string, workflowId: string, branch?: string): Promise<{
        message: string;
    }>;
}
export {};
