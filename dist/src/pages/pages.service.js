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
exports.PagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../prisma");
const page_status_enum_1 = require("./enums/page-status.enum");
let PagesService = class PagesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        if (dto.parentId) {
            await this.verifyOwnership(dto.parentId, userId);
        }
        return this.prisma.page.create({
            data: {
                ...dto,
                userId,
                status: dto.status || page_status_enum_1.PageStatus.DRAFT,
            },
            include: { subpages: true },
        });
    }
    async findAll(userId) {
        return this.prisma.page.findMany({
            where: { userId, isArchived: false, parentId: null },
            orderBy: { updatedAt: 'desc' },
            include: {
                subpages: {
                    where: { isArchived: false },
                    orderBy: { updatedAt: 'desc' },
                },
            },
        });
    }
    async findAllByStatus(userId, status) {
        return this.prisma.page.findMany({
            where: { userId, status, isArchived: false, parentId: null },
            orderBy: { updatedAt: 'desc' },
            include: {
                subpages: {
                    where: { isArchived: false },
                    orderBy: { updatedAt: 'desc' },
                },
            },
        });
    }
    async findPublished() {
        const result = await this.prisma.page.findMany({
            where: {
                status: page_status_enum_1.PageStatus.PUBLISHED,
                isArchived: false,
                parentId: null,
            },
            orderBy: { publishedAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        });
        console.log(`[PagesService] findPublished: found ${result.length} published pages`);
        return result;
    }
    async findPublicPage(id) {
        const page = await this.prisma.page.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
                blocks: {
                    where: { parentBlockId: null },
                    orderBy: { order: 'asc' },
                    include: {
                        children: {
                            orderBy: { order: 'asc' },
                        },
                    },
                },
            },
        });
        if (!page)
            throw new common_1.NotFoundException('Page not found');
        if (page.status !== page_status_enum_1.PageStatus.PUBLISHED) {
            throw new common_1.ForbiddenException('This page is not published');
        }
        return page;
    }
    async findFavorites(userId) {
        return this.prisma.page.findMany({
            where: { userId, isFavorite: true, isArchived: false },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async findArchived(userId) {
        return this.prisma.page.findMany({
            where: { userId, isArchived: true },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async findOne(id, userId) {
        const page = await this.prisma.page.findUnique({
            where: { id },
            include: {
                subpages: {
                    where: { isArchived: false },
                    orderBy: { updatedAt: 'desc' },
                },
                blocks: {
                    where: { parentBlockId: null },
                    orderBy: { order: 'asc' },
                    include: {
                        children: {
                            orderBy: { order: 'asc' },
                        },
                    },
                },
            },
        });
        if (!page)
            throw new common_1.NotFoundException('Page not found');
        if (page.userId !== userId)
            throw new common_1.ForbiddenException();
        return page;
    }
    async update(id, userId, dto) {
        await this.verifyOwnership(id, userId);
        const data = { ...dto };
        if (dto.status === page_status_enum_1.PageStatus.PUBLISHED) {
            const currentPage = await this.prisma.page.findUnique({
                where: { id },
                select: { status: true, publishedAt: true },
            });
            if (currentPage && currentPage.status !== page_status_enum_1.PageStatus.PUBLISHED) {
                data.publishedAt = new Date();
            }
        }
        return this.prisma.page.update({
            where: { id },
            data,
        });
    }
    async remove(id, userId) {
        await this.verifyOwnership(id, userId);
        return this.prisma.page.delete({ where: { id } });
    }
    async verifyOwnership(pageId, userId) {
        const page = await this.prisma.page.findUnique({
            where: { id: pageId },
            select: { userId: true },
        });
        if (!page)
            throw new common_1.NotFoundException('Page not found');
        if (page.userId !== userId)
            throw new common_1.ForbiddenException();
    }
};
exports.PagesService = PagesService;
exports.PagesService = PagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], PagesService);
//# sourceMappingURL=pages.service.js.map