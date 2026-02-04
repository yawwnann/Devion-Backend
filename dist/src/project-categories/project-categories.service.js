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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectCategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../prisma");
let ProjectCategoriesService = class ProjectCategoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        try {
            return await this.prisma.projectCategory.create({
                data: { ...dto, userId },
            });
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('Category name already exists');
            }
            throw error;
        }
    }
    async findAll(userId) {
        return this.prisma.projectCategory.findMany({
            where: { userId },
            orderBy: { name: 'asc' },
        });
    }
    async update(id, userId, dto) {
        const category = await this.prisma.projectCategory.findUnique({
            where: { id },
        });
        if (!category || category.userId !== userId) {
            throw new common_1.NotFoundException('Category not found');
        }
        return this.prisma.projectCategory.update({
            where: { id },
            data: dto,
        });
    }
    async remove(id, userId) {
        const category = await this.prisma.projectCategory.findUnique({
            where: { id },
        });
        if (!category || category.userId !== userId) {
            throw new common_1.NotFoundException('Category not found');
        }
        const projectsUsingCategory = await this.prisma.project.count({
            where: { categoryId: id },
        });
        if (projectsUsingCategory > 0) {
            throw new common_1.ConflictException(`Cannot delete category. ${projectsUsingCategory} project(s) are using it.`);
        }
        return this.prisma.projectCategory.delete({ where: { id } });
    }
};
exports.ProjectCategoriesService = ProjectCategoriesService;
exports.ProjectCategoriesService = ProjectCategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], ProjectCategoriesService);
//# sourceMappingURL=project-categories.service.js.map