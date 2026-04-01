import { PrismaService } from '../../prisma/prisma.service';
import { ToolResult } from '../chatbot.types';

export async function getTodos(
  prisma: PrismaService,
  params: { status?: string; priority?: string; day?: string; limit?: number },
  userId: string,
): Promise<ToolResult> {
  try {
    const { status = 'pending', priority = 'all', day = 'all', limit = 50 } = params;

    const where: Record<string, unknown> = {
      userId, // Filter by logged-in user
    };

    // Handle status filter
    if (status !== 'all' && status !== 'pending') {
      where.status = status;
    } else if (status === 'pending') {
      where.status = { in: ['TODO', 'IN_PROGRESS', 'SCHEDULED'] };
    }

    // Handle priority filter
    if (priority !== 'all') {
      where.priority = priority;
    }

    // Handle day filter
    if (day !== 'all') {
      where.day = day;
    }

    const todos = await prisma.todo.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    });

    return {
      success: true,
      data: todos.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        day: t.day,
        isCompleted: t.isCompleted,
        dueDate: t.dueDate,
        githubIssueNumber: t.githubIssueNumber,
        githubRepoName: t.githubRepoName,
      })),
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to get todos',
    };
  }
}
