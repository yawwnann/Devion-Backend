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
    async getProductivity(userId) {
        const now = new Date();
        const allTodos = await this.prisma.todo.findMany({
            where: {
                week: {
                    userId,
                },
            },
            include: {
                week: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        const { currentStreak, longestStreak, lastCompletedAt } = this.calculateStreaks(allTodos);
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayTodos = allTodos.filter((t) => t.createdAt >= todayStart);
        const todayCompleted = todayTodos.filter((t) => t.isCompleted).length;
        const todayTotal = todayTodos.length;
        const weekStart = this.getStartOfWeek(now);
        const weekTodos = allTodos.filter((t) => t.createdAt >= weekStart);
        const weekCompleted = weekTodos.filter((t) => t.isCompleted).length;
        const weekTotal = weekTodos.length;
        const completionRate = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;
        const totalCompleted = allTodos.filter((t) => t.isCompleted).length;
        const totalTodos = allTodos.length;
        const dailyActivity = this.getDailyTodoActivity(allTodos, 7);
        return {
            currentStreak,
            longestStreak,
            lastCompletedAt,
            todayCompleted,
            todayTotal,
            weekCompleted,
            weekTotal,
            completionRate,
            totalCompleted,
            totalTodos,
            dailyActivity,
        };
    }
    calculateStreaks(todos) {
        const completedTodos = todos
            .filter((t) => t.isCompleted)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        if (completedTodos.length === 0) {
            return { currentStreak: 0, longestStreak: 0, lastCompletedAt: null };
        }
        const lastCompletedAt = new Date(completedTodos[0].updatedAt);
        const completedDates = new Set();
        for (const todo of completedTodos) {
            const date = new Date(todo.updatedAt).toISOString().split('T')[0];
            completedDates.add(date);
        }
        let currentStreak = 0;
        let checkDate = new Date();
        checkDate.setHours(0, 0, 0, 0);
        const today = checkDate.toISOString().split('T')[0];
        const yesterday = new Date(checkDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        if (!completedDates.has(today) && !completedDates.has(yesterdayStr)) {
            currentStreak = 0;
        }
        else {
            if (!completedDates.has(today)) {
                checkDate = yesterday;
                currentStreak = 1;
            }
            else {
                currentStreak = 1;
            }
            while (true) {
                const dateStr = checkDate.toISOString().split('T')[0];
                if (completedDates.has(dateStr)) {
                    checkDate.setDate(checkDate.getDate() - 1);
                    if (checkDate < new Date(lastCompletedAt)) {
                        break;
                    }
                }
                else {
                    break;
                }
            }
        }
        let longestStreak = 0;
        let tempStreak = 0;
        const sortedDates = Array.from(completedDates).sort();
        for (let i = 0; i < sortedDates.length; i++) {
            if (i === 0) {
                tempStreak = 1;
            }
            else {
                const prevDate = new Date(sortedDates[i - 1]);
                const currDate = new Date(sortedDates[i]);
                const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    tempStreak++;
                }
                else if (diffDays === 0) {
                }
                else {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                }
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak);
        return { currentStreak, longestStreak, lastCompletedAt };
    }
    getStartOfWeek(date) {
        const result = new Date(date);
        const day = result.getDay();
        const diff = result.getDate() - day + (day === 0 ? -6 : 1);
        result.setDate(diff);
        result.setHours(0, 0, 0, 0);
        return result;
    }
    getDailyTodoActivity(todos, days) {
        const activity = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            const dayTodos = todos.filter((t) => t.createdAt >= dayStart && t.createdAt <= dayEnd);
            const dayCompleted = dayTodos.filter((t) => t.isCompleted).length;
            activity.push({
                date: dateStr,
                completed: dayCompleted,
                total: dayTodos.length,
            });
        }
        return activity;
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map