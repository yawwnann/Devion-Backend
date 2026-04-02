import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateEventDto } from './dto';

export interface ProductivityStats {
  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastCompletedAt: Date | null;

  // Today stats
  todayCompleted: number;
  todayTotal: number;

  // Weekly stats
  weekCompleted: number;
  weekTotal: number;
  completionRate: number;

  // Overall stats
  totalCompleted: number;
  totalTodos: number;

  // Daily activity (last 7 days)
  dailyActivity: Array<{
    date: string;
    completed: number;
    total: number;
  }>;
}

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

  /**
   * Get productivity stats including streaks, completion rates, and daily activity
   */
  async getProductivity(userId: string): Promise<ProductivityStats> {
    const now = new Date();

    // Get all todos for this user via TodoWeek relation
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

    // Calculate streaks
    const { currentStreak, longestStreak, lastCompletedAt } =
      this.calculateStreaks(allTodos);

    // Today's stats (start of day)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayTodos = allTodos.filter((t) => t.createdAt >= todayStart);
    const todayCompleted = todayTodos.filter((t) => t.isCompleted).length;
    const todayTotal = todayTodos.length;

    // Weekly stats (start of week - Monday)
    const weekStart = this.getStartOfWeek(now);
    const weekTodos = allTodos.filter((t) => t.createdAt >= weekStart);
    const weekCompleted = weekTodos.filter((t) => t.isCompleted).length;
    const weekTotal = weekTodos.length;
    const completionRate =
      weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

    // Overall stats
    const totalCompleted = allTodos.filter((t) => t.isCompleted).length;
    const totalTodos = allTodos.length;

    // Daily activity (last 7 days)
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

  /**
   * Calculate current and longest streaks from todos
   */
  private calculateStreaks(todos: any[]): {
    currentStreak: number;
    longestStreak: number;
    lastCompletedAt: Date | null;
  } {
    // Get all completed todos sorted by updatedAt (when they were completed)
    const completedTodos = todos
      .filter((t) => t.isCompleted)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    if (completedTodos.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastCompletedAt: null };
    }

    const lastCompletedAt = new Date(completedTodos[0].updatedAt);

    // Group completed dates by day
    const completedDates = new Set<string>();
    for (const todo of completedTodos) {
      const date = new Date(todo.updatedAt).toISOString().split('T')[0];
      completedDates.add(date);
    }

    // Calculate current streak
    let currentStreak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    // Check if completed today or yesterday to start streak
    const today = checkDate.toISOString().split('T')[0];
    const yesterday = new Date(checkDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (!completedDates.has(today) && !completedDates.has(yesterdayStr)) {
      // No completion today or yesterday, streak is broken
      currentStreak = 0;
    } else {
      // Start counting streak from today or yesterday
      if (!completedDates.has(today)) {
        checkDate = yesterday;
        currentStreak = 1;
      } else {
        currentStreak = 1;
      }

      // Count consecutive days backwards
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (completedDates.has(dateStr)) {
          checkDate.setDate(checkDate.getDate() - 1);
          if (checkDate < new Date(lastCompletedAt!)) {
            break;
          }
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedDates = Array.from(completedDates).sort();

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.floor(
          (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays === 0) {
          // Same day, don't increment
        } else {
          // Gap detected, reset streak
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak, lastCompletedAt };
  }

  /**
   * Get start of week (Monday) for a given date
   */
  private getStartOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    result.setDate(diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get daily todo activity for the last N days
   */
  private getDailyTodoActivity(
    todos: any[],
    days: number,
  ): Array<{ date: string; completed: number; total: number }> {
    const activity: Array<{ date: string; completed: number; total: number }> =
      [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTodos = todos.filter(
        (t) => t.createdAt >= dayStart && t.createdAt <= dayEnd,
      );
      const dayCompleted = dayTodos.filter((t) => t.isCompleted).length;

      activity.push({
        date: dateStr,
        completed: dayCompleted,
        total: dayTodos.length,
      });
    }

    return activity;
  }
}
