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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const auth_service_1 = require("./auth.service");
const google_guard_1 = require("./guards/google.guard");
const jwt_guard_1 = require("./guards/jwt.guard");
const current_user_decorator_1 = require("./decorators/current-user.decorator");
const skip_token_refresh_decorator_1 = require("./decorators/skip-token-refresh.decorator");
const login_history_1 = require("../login-history");
const dto_1 = require("./dto");
let AuthController = class AuthController {
    authService;
    configService;
    loginHistoryService;
    constructor(authService, configService, loginHistoryService) {
        this.authService = authService;
        this.configService = configService;
        this.loginHistoryService = loginHistoryService;
    }
    async register(dto) {
        return this.authService.register(dto.email, dto.password, dto.name);
    }
    async login(dto, req) {
        return this.authService.login(dto.email, dto.password, req);
    }
    async refresh(refreshToken) {
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('Refresh token required');
        }
        return this.authService.refreshTokens(refreshToken);
    }
    googleAuth() {
        console.log('🔵 [BACKEND] Google auth endpoint hit');
    }
    getGoogleAuthUrl() {
        const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
        const callbackUrl = this.configService.get('GOOGLE_CALLBACK_URL', 'http://localhost:3000/api/auth/google/callback');
        const params = new URLSearchParams({
            client_id: this.configService.get('GOOGLE_CLIENT_ID') || '',
            redirect_uri: callbackUrl,
            response_type: 'code',
            scope: 'email profile',
            access_type: 'offline',
            prompt: 'select_account',
        });
        return {
            url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
        };
    }
    async googleCallback(req, res, state) {
        console.log('🟢 [BACKEND] Google callback hit');
        console.log('🟢 [BACKEND] User from Google:', req.user);
        console.log('🟢 [BACKEND] State:', state);
        let isLinking = false;
        let linkingUserId = null;
        if (state) {
            try {
                const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
                if (decoded.action === 'link' && decoded.userId) {
                    isLinking = true;
                    linkingUserId = decoded.userId;
                    console.log('🟢 [BACKEND] Account linking for user:', linkingUserId);
                }
            }
            catch (e) {
                console.log('🟡 [BACKEND] Failed to decode state, treating as normal login');
            }
        }
        if (isLinking && linkingUserId) {
            try {
                const existingUser = await this.authService.linkGoogleToExistingUser(linkingUserId, req.user);
                console.log('🟢 [BACKEND] Account linked successfully');
                const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
                res.redirect(`${frontendUrl}/settings?linked=success`);
                return;
            }
            catch (error) {
                console.error('🔴 [BACKEND] Failed to link account:', error);
                const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
                res.redirect(`${frontendUrl}/settings?linked=error`);
                return;
            }
        }
        const user = await this.authService.validateGoogleUser(req.user, req);
        console.log('🟢 [BACKEND] User validated:', user.email);
        const tokens = this.authService.generateTokens(user.id, user.email);
        console.log('🟢 [BACKEND] Tokens generated');
        const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
        const redirectUrl = `${frontendUrl}/auth/callback?token=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;
        console.log('🟢 [BACKEND] Redirecting to:', redirectUrl);
        res.redirect(redirectUrl);
    }
    getMe(user) {
        const { googleId, password, ...safeUser } = user;
        return {
            ...safeUser,
            hasPassword: !!password,
            hasGoogleLinked: !!googleId,
        };
    }
    updateProfile(user, dto) {
        return this.authService.updateProfile(user.id, dto);
    }
    changePassword(user, dto) {
        return this.authService.changePassword(user.id, dto.currentPassword, dto.newPassword);
    }
    getStatistics(user) {
        return this.authService.getStatistics(user.id);
    }
    uploadAvatar(user, file) {
        return this.authService.uploadImage(user.id, file, 'avatar');
    }
    uploadCover(user, file) {
        return this.authService.uploadImage(user.id, file, 'cover');
    }
    getLoginHistory(user, limit) {
        return this.loginHistoryService.getUserLoginHistory(user.id, limit ? parseInt(limit, 10) : 10);
    }
    unlinkGoogle(user) {
        return this.authService.unlinkGoogleAccount(user.id);
    }
    getGoogleLinkUrl(user) {
        const callbackUrl = this.configService.get('GOOGLE_CALLBACK_URL', 'http://localhost:3000/api/auth/google/callback');
        const state = Buffer.from(JSON.stringify({
            userId: user.id,
            action: 'link',
        })).toString('base64');
        const params = new URLSearchParams({
            client_id: this.configService.get('GOOGLE_CLIENT_ID') || '',
            redirect_uri: callbackUrl,
            response_type: 'code',
            scope: 'email profile',
            access_type: 'offline',
            prompt: 'select_account',
            state,
        });
        return {
            url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, throttler_1.SkipThrottle)(),
    (0, skip_token_refresh_decorator_1.SkipTokenRefresh)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, throttler_1.SkipThrottle)(),
    (0, skip_token_refresh_decorator_1.SkipTokenRefresh)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, throttler_1.SkipThrottle)(),
    (0, skip_token_refresh_decorator_1.SkipTokenRefresh)(),
    __param(0, (0, common_1.Body)('refreshToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Get)('google'),
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.UseGuards)(google_guard_1.GoogleAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "googleAuth", null);
__decorate([
    (0, common_1.Get)('google/url'),
    (0, throttler_1.SkipThrottle)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getGoogleAuthUrl", null);
__decorate([
    (0, common_1.Get)('google/callback'),
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.UseGuards)(google_guard_1.GoogleAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('state')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleCallback", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getMe", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.UpdateProfileDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('change-password'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ChangePasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Post)('upload-avatar'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Post)('upload-cover'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "uploadCover", null);
__decorate([
    (0, common_1.Get)('login-history'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getLoginHistory", null);
__decorate([
    (0, common_1.Post)('unlink-google'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "unlinkGoogle", null);
__decorate([
    (0, common_1.Get)('google/link'),
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getGoogleLinkUrl", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        config_1.ConfigService,
        login_history_1.LoginHistoryService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map