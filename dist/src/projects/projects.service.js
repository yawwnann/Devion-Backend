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
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../prisma");
let ProjectsService = class ProjectsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        return this.prisma.project.create({
            data: {
                ...dto,
                userId,
            },
        });
    }
    async findAll(userId) {
        return this.prisma.project.findMany({
            where: { userId },
            include: {
                category: true,
                payment: true,
            },
            orderBy: { orderNum: 'asc' },
        });
    }
    async findOne(id, userId) {
        const project = await this.prisma.project.findUnique({
            where: { id },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        if (project.userId !== userId)
            throw new common_1.ForbiddenException();
        return project;
    }
    async update(id, userId, dto) {
        await this.findOne(id, userId);
        return this.prisma.project.update({
            where: { id },
            data: dto,
        });
    }
    async remove(id, userId) {
        await this.findOne(id, userId);
        return this.prisma.project.delete({
            where: { id },
        });
    }
    async getStats(userId) {
        const [total, todo, inProgress, done] = await Promise.all([
            this.prisma.project.count({ where: { userId } }),
            this.prisma.project.count({ where: { userId, status: 'TODO' } }),
            this.prisma.project.count({ where: { userId, status: 'IN_PROGRESS' } }),
            this.prisma.project.count({ where: { userId, status: 'DONE' } }),
        ]);
        return { total, todo, inProgress, done };
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map