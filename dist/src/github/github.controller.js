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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubController = void 0;
const common_1 = require("@nestjs/common");
const github_service_1 = require("./github.service");
const dto_1 = require("./dto");
const jwt_guard_1 = require("../auth/guards/jwt.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let GithubController = class GithubController {
    githubService;
    constructor(githubService) {
        this.githubService = githubService;
    }
    setUsername(user, dto) {
        return this.githubService.setUsername(user.id, dto.username);
    }
    setToken(user, dto) {
        return this.githubService.setToken(user.id, dto.token || null);
    }
    getTokenStatus(user) {
        return this.githubService.getTokenStatus(user.id);
    }
    getRepos(user) {
        return this.githubService.getRepos(user.id);
    }
    syncRepos(user) {
        return this.githubService.syncRepos(user.id);
    }
    getRepoStats(user, repoId, days) {
        return this.githubService.getRepoStats(user.id, repoId, days ? parseInt(days) : 30);
    }
    linkRepo(user, dto) {
        return this.githubService.linkRepoToProject(user.id, dto.projectId, dto.githubRepo);
    }
    syncIssues(user, dto) {
        return this.githubService.syncIssuesForProject(user.id, dto.projectId);
    }
    createIssue(user, dto) {
        return this.githubService.createGitHubIssue(user.id, dto.todoId, dto.githubRepo);
    }
    syncSingleTodo(user, dto) {
        return this.githubService.syncSingleTodo(user.id, dto.todoId);
    }
    createIssueInRepo(user, owner, repo, body) {
        return this.githubService.createIssue(user.id, owner, repo, body);
    }
    getRecentCommits(user, limit) {
        return this.githubService.getRecentCommits(user.id, limit ? parseInt(limit) : 20);
    }
    getPullRequests(user, state) {
        return this.githubService.getPullRequests(user.id, state);
    }
    getPRDetails(user, owner, repo, number) {
        return this.githubService.getPRDetails(owner, repo, parseInt(number), user.id);
    }
    getPRFiles(user, owner, repo, number) {
        return this.githubService.getPRFiles(owner, repo, parseInt(number), user.id);
    }
    submitReview(user, owner, repo, number, body) {
        return this.githubService.submitReview(owner, repo, parseInt(number), user.id, body.comment, body.event);
    }
};
exports.GithubController = GithubController;
__decorate([
    (0, common_1.Post)('username'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.SetGithubUsernameDto]),
    __metadata("design:returntype", void 0)
], GithubController.prototype, "setUsername", null);
__decorate([
    (0, common_1.Post)('token'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.SetGithubTokenDto]),
    __metadata("design:returntype", void 0)
], GithubController.prototype, "setToken", null);
__decorate([
    (0, common_1.Get)('token-status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GithubController.prototype, "getTokenStatus", null);
__decorate([
    (0, common_1.Get)('repos'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GithubController.prototype, "getRepos", null);
__decorate([
    (0, common_1.Post)('sync'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GithubController.prototype, "syncRepos", null);
__decorate([
    (0, common_1.Get)('repos/:repoId/stats'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('repoId')),
    __param(2, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], GithubController.prototype, "getRepoStats", null);
__decorate([
    (0, common_1.Post)('link-repo'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.LinkRepoDto]),
    __metadata("design:returntype", void 0)
], GithubController.prototype, "linkRepo", null);
__decorate([
    (0, common_1.Post)('sync-issues'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.SyncIssuesDto]),
    __metadata("design:returntype", void 0)
], GithubController.prototype, "syncIssues", null);
__decorate([
    (0, common_1.Post)('create-issue'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateIssueDto]),
    __metadata("design:returntype", void 0)
], GithubController.prototype, "createIssue", null);
__decorate([
    (0, common_1.Patch)('sync-todo'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.SyncSingleTodoDto]),
    __metadata("design:returntype", void 0)
], GithubController.prototype, "syncSingleTodo", null);
__decorate([
    (0, common_1.Post)('repos/:owner/:repo/issues'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('owner')),
    __param(2, (0, common_1.Param)('repo')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", void 0)
], GithubController.prototype, "createIssueInRepo", null);
__decorate([
    (0, common_1.Get)('recent-commits'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GithubController.prototype, "getRecentCommits", null);
__decorate([
    (0, common_1.Get)('pull-requests'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('state')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GithubController.prototype, "getPullRequests", null);
__decorate([
    (0, common_1.Get)('pull-requests/:owner/:repo/:number'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('owner')),
    __param(2, (0, common_1.Param)('repo')),
    __param(3, (0, common_1.Param)('number')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], GithubController.prototype, "getPRDetails", null);
__decorate([
    (0, common_1.Get)('pull-requests/:owner/:repo/:number/files'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('owner')),
    __param(2, (0, common_1.Param)('repo')),
    __param(3, (0, common_1.Param)('number')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], GithubController.prototype, "getPRFiles", null);
__decorate([
    (0, common_1.Post)('pull-requests/:owner/:repo/:number/reviews'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('owner')),
    __param(2, (0, common_1.Param)('repo')),
    __param(3, (0, common_1.Param)('number')),
    __param(4, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, Object]),
    __metadata("design:returntype", void 0)
], GithubController.prototype, "submitReview", null);
exports.GithubController = GithubController = __decorate([
    (0, common_1.Controller)('github'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [github_service_1.GithubService])
], GithubController);
//# sourceMappingURL=github.controller.js.map