import { PrismaService } from '../../prisma/prisma.service';
import { ToolResult } from '../chatbot.types';

export async function getCalendarEvents(
  prisma: PrismaService,
  params: { startDate?: string; endDate?: string; eventType?: string; limit?: number },
): Promise<ToolResult> {
  try {
    const { eventType = 'all', limit = 50 } = params;

    const where: Record<string, unknown> = {};

    // Handle date range
    if (params.startDate || params.endDate) {
      where.startDate = {};
      if (params.startDate) {
        (where.startDate as Record<string, string>).gte = params.startDate;
      }
      if (params.endDate) {
        (where.startDate as Record<string, string>).lte = params.endDate;
      }
    }

    // Handle event type filter
    if (eventType !== 'all') {
      where.eventType = eventType;
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { startDate: 'asc' },
      take: limit,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      success: true,
      data: events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        startDate: e.startDate,
        endDate: e.endDate,
        eventType: e.eventType,
        allDay: e.allDay,
        color: e.color,
        isToday: new Date(e.startDate).toDateString() === today.toDateString(),
        isPast: new Date(e.endDate) < today,
      })),
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to get calendar events',
    };
  }
}
