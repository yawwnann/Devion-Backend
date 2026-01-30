import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TodosService {
  constructor(private prisma: PrismaService) {}

  // Get or create current week
  async getCurrentWeek(userId: string) {
    const now = new Date();
    const weekStart = this.getWeekStart(now);
    const weekEnd = this.getWeekEnd(weekStart);

    let week = await this.prisma.todoWeek.findUnique({
      where: {
        userId_weekStart: {
          userId,
          weekStart,
        },
      },
      include: {
        todos: {
          orderBy: [{ day: 'asc' }, { order: 'asc' }],
        },
      },
    });

    if (!week) {
      week = await this.prisma.todoWeek.create({
        data: {
          userId,
          weekStart,
          weekEnd,
        },
        include: {
          todos: true,
        },
      });
    }

    return week;
  }

  // Create new todo
  async createTodo(
    userId: string,
    data: { title: string; day: string; dueDate?: string; priority?: string; status?: string },
  ) {
    const week = await this.getCurrentWeek(userId);

    const maxOrder = await this.prisma.todo.findFirst({
      where: { weekId: week.id, day: data.day },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const status = data.status || 'TODO';
    const isCompleted = status === 'DONE';

    return this.prisma.todo.create({
      data: {
        title: data.title,
        day: data.day,
        weekId: week.id,
        order: (maxOrder?.order ?? -1) + 1,
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
        priority: data.priority || 'MEDIUM',
        // @ts-ignore
        status,
        isCompleted,
      },
    });
  }

  // Update todo
  async updateTodo(
    userId: string,
    todoId: string,
    data: { 
      title?: string; 
      isCompleted?: boolean; 
      dueDate?: string; 
      priority?: string; 
      status?: string; 
      githubIssueNumber?: number; 
      githubRepoName?: string; 
    },
  ) {
    // Verify ownership
    const todo = await this.prisma.todo.findFirst({
      where: {
        id: todoId,
        week: { userId },
      },
      // @ts-ignore
      select: { id: true, status: true, isCompleted: true },
    });

    if (!todo) {
      throw new Error('Todo not found');
    }

    const updates: any = { ...data };
    
    // Sync status and isCompleted
    if (data.status && data.status === 'DONE') {
      updates.isCompleted = true;
    } else if (data.status && data.status !== 'DONE') {
      updates.isCompleted = false;
    }

    // Bi-directional sync: if isCompleted is toggled, update status
    if (data.isCompleted !== undefined) {
      if (data.isCompleted) {
        updates.status = 'DONE';
      } else if (!data.status || data.status === 'DONE') {
        // Only revert to TODO if status wasn't explicitly set to something else
        // (This logic might need refinement depending on desired behavior, but simple for now)
        updates.status = 'TODO';
      }
    }

    if (data.dueDate) {
      updates.dueDate = new Date(data.dueDate);
    }

    return this.prisma.todo.update({
      where: { id: todoId },
      data: updates,
    });
  }

  // Delete todo
  async deleteTodo(userId: string, todoId: string) {
    const todo = await this.prisma.todo.findFirst({
      where: {
        id: todoId,
        week: { userId },
      },
    });

    if (!todo) {
      throw new Error('Todo not found');
    }

    return this.prisma.todo.delete({
      where: { id: todoId },
    });
  }

  // Reorder todos (Generic)
  async reorderTodos(
    userId: string,
    todoIds: string[],
  ): Promise<{ success: boolean }> {
    // Verify all todos belong to user
    const todos = await this.prisma.todo.findMany({
      where: {
        week: { userId },
        id: { in: todoIds },
      },
      select: { id: true },
    });

    if (todos.length !== todoIds.length) {
      throw new Error('Invalid todo IDs');
    }

    // Update order for each todo
    await this.prisma.$transaction(
      todoIds.map((todoId, index) =>
        this.prisma.todo.update({
          where: { id: todoId },
          data: { order: index },
        }),
      ),
    );

    return { success: true };
  }

  // Create new week (for next week)
  async createNewWeek(userId: string) {
    const currentWeek = await this.getCurrentWeek(userId);
    const nextWeekStart = new Date(currentWeek.weekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    const nextWeekEnd = this.getWeekEnd(nextWeekStart);

    const existingWeek = await this.prisma.todoWeek.findUnique({
      where: {
        userId_weekStart: {
          userId,
          weekStart: nextWeekStart,
        },
      },
      include: {
        todos: true,
      },
    });

    if (existingWeek) {
      return existingWeek;
    }

    return this.prisma.todoWeek.create({
      data: {
        userId,
        weekStart: nextWeekStart,
        weekEnd: nextWeekEnd,
      },
      include: {
        todos: true,
      },
    });
  }

  // Helper: Get Monday of the week
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  // Helper: Get Sunday of the week
  private getWeekEnd(weekStart: Date): Date {
    const sunday = new Date(weekStart);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return sunday;
  }
}
