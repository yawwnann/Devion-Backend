// GitHub API Response Types

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string;
  email: string | null;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
  html_url: string;
  stats?: {
    additions: number;
    deletions: number;
  };
}

export interface GitHubIssueSearchItem {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  html_url: string;
  repository_url: string;
  labels: Array<{ name: string; color: string }>;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface GitHubSearchResponse<T> {
  items: T[];
  total_count: number;
}

export interface GitHubPRDetail {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
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
  labels: Array<{ name: string; color: string }>;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  draft: boolean;
  additions: number;
  deletions: number;
  changed_files: number;
  requested_reviewers: Array<{ login: string }>;
}

export interface GitHubReview {
  id: number;
  user: {
    login: string;
    avatar_url: string;
  };
  body: string;
  state: string;
  submitted_at: string;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GitHubContributionDay {
  date: string;
  contributionCount: number;
  contributionLevel: string;
}

export interface GitHubContributionWeek {
  contributionDays: GitHubContributionDay[];
}

export interface GitHubContributionCalendar {
  totalContributions: number;
  weeks: GitHubContributionWeek[];
  contributionCalendar: {
    totalContributions: number;
    weeks: GitHubContributionWeek[];
    totalCommitContributions: number;
    totalIssueContributions: number;
    totalPullRequestContributions: number;
    totalPullRequestReviewContributions: number;
  };
}

export interface GitHubGraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

export interface GitHubUserContributions {
  user: {
    contributionsCollection: {
      totalCommitContributions: number;
      totalIssueContributions: number;
      totalPullRequestContributions: number;
      totalPullRequestReviewContributions: number;
      contributionCalendar: {
        totalContributions: number;
        weeks: GitHubContributionWeek[];
        totalCommitContributions: number;
        totalIssueContributions: number;
        totalPullRequestContributions: number;
        totalPullRequestReviewContributions: number;
      };
    };
  };
}

export interface GitHubWorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  head_branch: string;
  event: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  run_number: number;
  actor: {
    login: string;
    avatar_url: string;
  };
  head_commit: {
    message: string;
    author: {
      name: string;
    };
  };
}

export interface GitHubWorkflowRunsResponse {
  workflow_runs: GitHubWorkflowRun[];
  total_count: number;
}

export interface GitHubWorkflow {
  id: number;
  name: string;
  path: string;
  state: string;
  html_url: string;
  badge_url: string;
}

export interface GitHubWorkflowsResponse {
  workflows: GitHubWorkflow[];
  total_count: number;
}
