import type { User } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import { CreateEventDto } from './dto';
export declare class AnalyticsController {
    private analyticsService;
    constructor(analyticsService: AnalyticsService);
    track(user: User, dto: CreateEventDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        eventType: string;
        eventData: import("@prisma/client/runtime/client").JsonValue;
    }>;
    getEvents(user: User, eventType: string, days?: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        eventType: string;
        eventData: import("@prisma/client/runtime/client").JsonValue;
    }[]>;
    getStats(user: User, days?: string): Promise<{
        eventType: string;
        count: number;
    }[]>;
    getDailyActivity(user: User, days?: string): Promise<{
        date: string;
        count: number;
    }[]>;
}
