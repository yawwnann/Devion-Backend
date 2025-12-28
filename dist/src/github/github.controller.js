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
    getRepos(user) {
        return this.githubService.getRepos(user.id);
    }
    syncRepos(user) {
        return this.githubService.syncRepos(user.id);
    }
    getRepoStats(user, repoId, days) {
        return this.githubService.getRepoStats(user.id, repoId, days ? parseInt(days) : 30);
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
exports.GithubController = GithubController = __decorate([
    (0, common_1.Controller)('github'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [github_service_1.GithubService])
], GithubController);
//# sourceMappingURL=github.controller.js.map