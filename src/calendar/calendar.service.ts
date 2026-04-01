import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateEventDto, UpdateEventDto } from './dto';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createEventDto: CreateEventDto) {
    return this.prisma.calendarEvent.create({
      data: {
        title: createEventDto.title,
        description: createEventDto.description,
        startDate: new Date(createEventDto.startDate),
        endDate: new Date(createEventDto.endDate),
        allDay: createEventDto.allDay,
        color: createEventDto.color,
        eventType: createEventDto.eventType,
        user: {
          connect: { id: userId },
        },
        ...(createEventDto.projectId && {
          project: { connect: { id: createEventDto.projectId } },
        }),
        ...(createEventDto.todoId && {
          todo: { connect: { id: createEventDto.todoId } },
        }),
      },
      include: {
        project: true,
        todo: true,
      },
    });
  }

  async findAll(userId: string, startDate?: string, endDate?: string) {
    const where: any = { userId };

    if (startDate && endDate) {
      where.startDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    return this.prisma.calendarEvent.findMany({
      where,
      // Hanya select field yang diperlukan untuk performa lebih baik
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        allDay: true,
        color: true,
        eventType: true,
        projectId: true,
        todoId: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }

  async findOne(userId: string, id: string) {
    const event = await this.prisma.calendarEvent.findFirst({
      where: { id, userId },
      include: {
        project: true,
        todo: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Calendar event not found');
    }

    return event;
  }

  async update(userId: string, id: string, updateEventDto: UpdateEventDto) {
    await this.findOne(userId, id);

    const data: any = { ...updateEventDto };
    if (updateEventDto.startDate) {
      data.startDate = new Date(updateEventDto.startDate);
    }
    if (updateEventDto.endDate) {
      data.endDate = new Date(updateEventDto.endDate);
    }

    return this.prisma.calendarEvent.update({
      where: { id },
      data,
      include: {
        project: true,
        todo: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.calendarEvent.delete({
      where: { id },
    });
  }

  async syncFromProjects(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: {
        userId,
        OR: [{ dueDate: { not: null } }, { startDate: { not: null } }],
      },
    });

    for (const project of projects) {
      if (project.dueDate || project.startDate) {
        const existingEvent = await this.prisma.calendarEvent.findFirst({
          where: {
            userId,
            projectId: project.id,
            eventType: 'project',
          },
        });

        const startDate = project.startDate || project.dueDate;
        const endDate = project.dueDate || project.startDate;

        if (!startDate || !endDate) continue;

        const eventData = {
          title: project.name,
          description: project.information || '',
          startDate,
          endDate,
          allDay: true,
          color: this.getColorByStatus(project.status),
          eventType: 'project' as const,
          projectId: project.id,
          userId,
        };

        if (existingEvent) {
          await this.prisma.calendarEvent.update({
            where: { id: existingEvent.id },
            data: eventData,
          });
        } else {
          await this.prisma.calendarEvent.create({
            data: eventData,
          });
        }
      }
    }

    return { success: true, message: 'Projects synced to calendar' };
  }

  async syncFromTodos(userId: string) {
    const todos = await this.prisma.todo.findMany({
      where: {
        week: { userId },
        dueDate: { not: null },
      },
      include: {
        week: true,
      },
    });

    for (const todo of todos) {
      if (todo.dueDate) {
        const existingEvent = await this.prisma.calendarEvent.findFirst({
          where: {
            userId,
            todoId: todo.id,
            eventType: 'todo',
          },
        });

        const eventData = {
          title: todo.title,
          startDate: todo.dueDate,
          endDate: todo.dueDate,
          allDay: true,
          color: todo.isCompleted ? 'green' : 'orange',
          eventType: 'todo' as const,
          todoId: todo.id,
          userId,
        };

        if (existingEvent) {
          await this.prisma.calendarEvent.update({
            where: { id: existingEvent.id },
            data: eventData,
          });
        } else {
          await this.prisma.calendarEvent.create({
            data: eventData,
          });
        }
      }
    }

    return { success: true, message: 'Todos synced to calendar' };
  }

  private getColorByStatus(status: string): string {
    switch (status) {
      case 'TODO':
        return 'blue';
      case 'IN_PROGRESS':
        return 'yellow';
      case 'DONE':
        return 'green';
      default:
        return 'gray';
    }
  }
}
