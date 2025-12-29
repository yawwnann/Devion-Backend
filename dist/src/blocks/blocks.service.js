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
exports.BlocksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../prisma");
let BlocksService = class BlocksService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        await this.verifyPageOwnership(dto.pageId, userId);
        if (dto.order === undefined) {
            const maxOrder = await this.prisma.block.aggregate({
                where: { pageId: dto.pageId, parentBlockId: dto.parentBlockId ?? null },
                _max: { order: true },
            });
            dto.order = (maxOrder._max.order ?? -1) + 1;
        }
        return this.prisma.block.create({
            data: dto,
            include: { children: true },
        });
    }
    async findByPage(pageId, userId) {
        const page = await this.prisma.page.findUnique({
            where: { id: pageId, userId },
            include: {
                blocks: {
                    where: { parentBlockId: null },
                    orderBy: { order: 'asc' },
                    include: {
                        children: {
                            orderBy: { order: 'asc' },
                            include: {
                                children: { orderBy: { order: 'asc' } },
                            },
                        },
                    },
                },
            },
        });
        if (!page)
            throw new common_1.NotFoundException('Page not found or access denied');
        return page.blocks;
    }
    async findOne(id, userId) {
        const block = await this.prisma.block.findUnique({
            where: { id },
            include: {
                page: { select: { userId: true } },
                children: { orderBy: { order: 'asc' } },
            },
        });
        if (!block)
            throw new common_1.NotFoundException('Block not found');
        if (block.page.userId !== userId)
            throw new common_1.ForbiddenException();
        return block;
    }
    async update(id, userId, dto) {
        const block = await this.findOne(id, userId);
        return this.prisma.block.update({
            where: { id: block.id },
            data: dto,
            include: { children: true },
        });
    }
    async remove(id, userId) {
        const block = await this.findOne(id, userId);
        return this.prisma.block.delete({ where: { id: block.id } });
    }
    async reorder(pageId, userId, blockIds) {
        await this.verifyPageOwnership(pageId, userId);
        const updates = blockIds.map((id, index) => this.prisma.block.update({
            where: { id },
            data: { order: index },
        }));
        await this.prisma.$transaction(updates);
        return { success: true };
    }
    async verifyPageOwnership(pageId, userId) {
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
exports.BlocksService = BlocksService;
exports.BlocksService = BlocksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], BlocksService);
//# sourceMappingURL=blocks.service.js.map