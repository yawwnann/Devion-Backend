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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../prisma");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async track(userId, dto) {
        return this.prisma.analyticsEvent.create({
            data: {
                userId,
                eventType: dto.eventType,
                eventData: dto.eventData || {},
            },
        });
    }
    async getEventsByType(userId, eventType, days = 30) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        return this.prisma.analyticsEvent.findMany({
            where: { userId, eventType, createdAt: { gte: since } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getStats(userId, days = 30) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const events = await this.prisma.analyticsEvent.groupBy({
            by: ['eventType'],
            where: { userId, createdAt: { gte: since } },
            _count: { id: true },
        });
        return events.map((e) => ({
            eventType: e.eventType,
            count: e._count.id,
        }));
    }
    async getDailyActivity(userId, days = 30) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const events = await this.prisma.analyticsEvent.findMany({
            where: { userId, createdAt: { gte: since } },
            select: { createdAt: true },
        });
        const dailyMap = new Map();
        for (const event of events) {
            const date = event.createdAt.toISOString().split('T')[0];
            dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
        }
        return Array.from(dailyMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map