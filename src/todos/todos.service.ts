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
  async createTodo(userId: string, data: { title: string; day: string }) {
    const week = await this.getCurrentWeek(userId);

    const maxOrder = await this.prisma.todo.findFirst({
      where: { weekId: week.id, day: data.day },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return this.prisma.todo.create({
      data: {
        title: data.title,
        day: data.day,
        weekId: week.id,
        order: (maxOrder?.order ?? -1) + 1,
      },
    });
  }

  // Update todo
  async updateTodo(
    userId: string,
    todoId: string,
    data: { title?: string; isCompleted?: boolean },
  ) {
    // Verify ownership
    const todo = await this.prisma.todo.findFirst({
      where: {
        id: todoId,
        week: { userId },
      },
    });

    if (!todo) {
      throw new Error('Todo not found');
    }

    return this.prisma.todo.update({
      where: { id: todoId },
      data,
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

  // Reorder todos within a day
  async reorderTodos(
    userId: string,
    day: string,
    todoIds: string[],
  ): Promise<void> {
    // Verify all todos belong to user
    const week = await this.getCurrentWeek(userId);
    const todos = await this.prisma.todo.findMany({
      where: {
        weekId: week.id,
        day,
        id: { in: todoIds },
      },
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
  }

  // Create new week (for next week)
  async createNewWeek(userId: string) {
    const currentWeek = await this.getCurrentWeek(userId);
    const nextWeekStart = new Date(currentWeek.weekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    const nextWeekEnd = this.getWeekEnd(nextWeekStart);

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
