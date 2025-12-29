"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectCategoriesModule = void 0;
const common_1 = require("@nestjs/common");
const project_categories_service_1 = require("./project-categories.service");
const project_categories_controller_1 = require("./project-categories.controller");
const prisma_1 = require("../prisma");
let ProjectCategoriesModule = class ProjectCategoriesModule {
};
exports.ProjectCategoriesModule = ProjectCategoriesModule;
exports.ProjectCategoriesModule = ProjectCategoriesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_1.PrismaModule],
        controllers: [project_categories_controller_1.ProjectCategoriesController],
        providers: [project_categories_service_1.ProjectCategoriesService],
    })
], ProjectCategoriesModule);
//# sourceMappingURL=project-categories.module.js.map