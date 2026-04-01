import { PrismaService } from '../../prisma/prisma.service';
import { ToolResult } from '../chatbot.types';

export async function getProjects(
  prisma: PrismaService,
  params: { status?: string; limit?: number },
  userId: string,
): Promise<ToolResult> {
  try {
    const { status = 'all', limit = 50 } = params;

    const where: Record<string, unknown> = {
      userId, // Filter by logged-in user
    };

    if (status !== 'all') {
      where.status = status;
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return {
      success: true,
      data: projects.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        information: p.information,
        dueDate: p.dueDate,
        startDate: p.startDate,
        githubRepo: p.githubRepo,
        githubUrl: p.githubUrl,
        createdAt: p.createdAt,
      })),
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to get projects',
    };
  }
}
