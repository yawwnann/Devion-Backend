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
exports.PaymentMethodsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../prisma");
let PaymentMethodsService = class PaymentMethodsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        try {
            return await this.prisma.paymentMethod.create({
                data: { ...dto, userId },
            });
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('Payment method name already exists');
            }
            throw error;
        }
    }
    async findAll(userId) {
        return this.prisma.paymentMethod.findMany({
            where: { userId },
            orderBy: { name: 'asc' },
        });
    }
    async update(id, userId, dto) {
        const method = await this.prisma.paymentMethod.findUnique({
            where: { id },
        });
        if (!method || method.userId !== userId) {
            throw new common_1.NotFoundException('Payment method not found');
        }
        return this.prisma.paymentMethod.update({
            where: { id },
            data: dto,
        });
    }
    async remove(id, userId) {
        const method = await this.prisma.paymentMethod.findUnique({
            where: { id },
        });
        if (!method || method.userId !== userId) {
            throw new common_1.NotFoundException('Payment method not found');
        }
        return this.prisma.paymentMethod.delete({ where: { id } });
    }
};
exports.PaymentMethodsService = PaymentMethodsService;
exports.PaymentMethodsService = PaymentMethodsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], PaymentMethodsService);
//# sourceMappingURL=payment-methods.service.js.map