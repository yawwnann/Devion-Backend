import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateEventDto } from './dto';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async track(userId: string, dto: CreateEventDto) {
    return this.prisma.analyticsEvent.create({
      data: {
        userId,
        eventType: dto.eventType,
        eventData: dto.eventData || {},
      },
    });
  }

  async getEventsByType(userId: string, eventType: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.prisma.analyticsEvent.findMany({
      where: { userId, eventType, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats(userId: string, days = 30) {
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

  async getDailyActivity(userId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const events = await this.prisma.analyticsEvent.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { createdAt: true },
    });

    // Group by date
    const dailyMap = new Map<string, number>();
    for (const event of events) {
      const date = event.createdAt.toISOString().split('T')[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    }

    return Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
