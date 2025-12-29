"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const prisma_1 = require("./prisma");
const auth_1 = require("./auth");
const pages_1 = require("./pages");
const blocks_1 = require("./blocks");
const github_1 = require("./github");
const analytics_1 = require("./analytics");
const health_module_1 = require("./health/health.module");
const projects_module_1 = require("./projects/projects.module");
const project_categories_module_1 = require("./project-categories/project-categories.module");
const payment_methods_module_1 = require("./payment-methods/payment-methods.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    name: 'short',
                    ttl: 1000,
                    limit: 10,
                },
                {
                    name: 'long',
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            prisma_1.PrismaModule,
            auth_1.AuthModule,
            pages_1.PagesModule,
            blocks_1.BlocksModule,
            github_1.GithubModule,
            analytics_1.AnalyticsModule,
            health_module_1.HealthModule,
            projects_module_1.ProjectsModule,
            project_categories_module_1.ProjectCategoriesModule,
            payment_methods_module_1.PaymentMethodsModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map