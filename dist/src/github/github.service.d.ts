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
        day: string;
        title: string;
        order: number;
        lastSyncedAt: Date | null;
        status: string;
        dueDate: Date | null;
        isCompleted: boolean;
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
        day: string;
        title: string;
        order: number;
        lastSyncedAt: Date | null;
        status: string;
        dueDate: Date | null;
        isCompleted: boolean;
        priority: string;
        githubIssueNumber: number | null;
        githubIssueUrl: string | null;
        githubRepoName: string | null;
        githubLabels: string | null;
        weekId: string;
    }>;
    fetchCommitsForIssue(userId: string, repoOwner: string, repoName: string, issueNumber: number): Promise<any>;
    fetchCommitDetails(userId: string, repoOwner: string, repoName: string, sha: string): Promise<{
        sha: any;
        message: any;
        author: any;
        authorEmail: any;
        authorAvatar: any;
        url: any;
        htmlUrl: any;
        additions: any;
        deletions: any;
        committedAt: Date;
    }>;
    syncCommitsForTodo(userId: string, todoId: string): Promise<{
        synced: number;
        commits: any[];
    }>;
    getCommitsForTodo(userId: string, todoId: string): Promise<{
        url: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sha: string;
        message: string;
        author: string;
        authorEmail: string | null;
        authorAvatar: string | null;
        htmlUrl: string;
        additions: number;
        deletions: number;
        committedAt: Date;
        todoId: string;
    }[]>;
    createIssue(userId: string, repoOwner: string, repoName: string, issueData: {
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
            totalContributions: any;
            activeDays: number;
            longestStreak: number;
            currentStreak: number;
            commits: any;
            issues: any;
            pullRequests: any;
            reviews: any;
        };
    }>;
    private mapContributionLevel;
    private getContributionsFallback;
    private calculateStreak;
    private calculateCurrentStreak;
    getWorkflowRuns(userId: string, repoName?: string): Promise<any[]>;
    private formatWorkflowRun;
    getWorkflows(userId: string, repoName: string): Promise<any>;
    triggerWorkflow(userId: string, repoName: string, workflowId: string, branch?: string): Promise<{
        message: string;
    }>;
}
