import { PrismaService } from '../prisma';
import { CreateEventDto } from './dto';
export interface ProductivityStats {
    currentStreak: number;
    longestStreak: number;
    lastCompletedAt: Date | null;
    todayCompleted: number;
    todayTotal: number;
    weekCompleted: number;
    weekTotal: number;
    completionRate: number;
    totalCompleted: number;
    totalTodos: number;
    dailyActivity: Array<{
        date: string;
        completed: number;
        total: number;
    }>;
}
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    track(userId: string, dto: CreateEventDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        eventType: string;
        eventData: import("@prisma/client/runtime/client").JsonValue;
    }>;
    getEventsByType(userId: string, eventType: string, days?: number): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        eventType: string;
        eventData: import("@prisma/client/runtime/client").JsonValue;
    }[]>;
    getStats(userId: string, days?: number): Promise<{
        eventType: string;
        count: number;
    }[]>;
    getDailyActivity(userId: string, days?: number): Promise<{
        date: string;
        count: number;
    }[]>;
    getProductivity(userId: string): Promise<ProductivityStats>;
    private calculateStreaks;
    private getStartOfWeek;
    private getDailyTodoActivity;
}
