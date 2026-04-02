import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationScheduler implements OnModuleInit {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    this.logger.log('NotificationScheduler initialized');
  }

  /**
   * Every hour: Check for upcoming events and send reminders
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyNotifications() {
    this.logger.log('Running hourly notification check...');

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    try {
      // Check for calendar events starting in 15-60 minutes
      const upcomingEvents = await this.prisma.calendarEvent.findMany({
        where: {
          startDate: {
            gte: now,
            lte: oneHourFromNow,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      for (const event of upcomingEvents) {
        const minutesUntilStart = Math.floor(
          (event.startDate.getTime() - now.getTime()) / 60000,
        );

        // Only send if event starts in 15-60 minutes
        if (minutesUntilStart >= 15 && minutesUntilStart <= 60) {
          // Check if we already notified for this event in the last hour
          const recentNotification = await this.prisma.notification.findFirst({
            where: {
              userId: event.userId,
              type: 'calendar',
              data: {
                path: ['eventId'],
                equals: event.id,
              },
              createdAt: {
                gte: new Date(Date.now() - 3600000),
              },
            },
          });

          if (!recentNotification) {
            await this.notificationsService.eventStartingSoon(
              event.userId,
              event.title,
              event.id,
              event.startDate.toISOString(),
              minutesUntilStart,
            );
            this.logger.log(
              `Sent event reminder for "${event.title}" to user ${event.userId}`,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error in hourly notifications: ${error.message}`);
    }
  }

  /**
   * Every day at 9 AM: Send daily digest with todos and project deadlines
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleDailyDigest() {
    this.logger.log('Running daily digest...');

    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      for (const user of users) {
        // Get todos due today
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todosDueToday = await this.prisma.todo.findMany({
          where: {
            week: {
              userId: user.id,
            },
            dueDate: {
              gte: todayStart,
              lte: today,
            },
            isCompleted: false,
          },
        });

        // Get projects due in next 3 days
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const projectsDueSoon = await this.prisma.project.findMany({
          where: {
            userId: user.id,
            dueDate: {
              gte: new Date(),
              lte: threeDaysFromNow,
            },
            status: {
              not: 'DONE',
            },
          },
        });

        // Send notifications for todos due today
        for (const todo of todosDueToday.slice(0, 5)) {
          await this.notificationsService.todoDueToday(
            user.id,
            todo.title,
            todo.id,
          );
        }

        // Send notifications for projects due soon
        for (const project of projectsDueSoon) {
          if (!project.dueDate) continue;

          const daysLeft = Math.ceil(
            (project.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          );
          if (daysLeft > 0) {
            await this.notificationsService.projectDeadlineApproaching(
              user.id,
              project.name,
              project.id,
              project.dueDate.toISOString(),
              daysLeft,
            );
          }
        }

        if (todosDueToday.length > 0 || projectsDueSoon.length > 0) {
          this.logger.log(
            `Sent daily digest to user ${user.id}: ${todosDueToday.length} todos, ${projectsDueSoon.length} projects`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Error in daily digest: ${error.message}`);
    }
  }

  /**
   * Every midnight: Check for overdue todos
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleOverdueTodos() {
    this.logger.log('Checking for overdue todos...');

    try {
      const now = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);

      // Find todos that were due yesterday or earlier and are not completed
      const overdueTodos = await this.prisma.todo.findMany({
        where: {
          week: {
            userId: {
              not: undefined,
            },
          },
          dueDate: {
            lte: yesterday,
          },
          isCompleted: false,
        },
        include: {
          week: {
            select: {
              userId: true,
            },
          },
        },
      });

      // Group by user to avoid duplicate notifications
      const userTodos = new Map<string, typeof overdueTodos>();

      for (const todo of overdueTodos) {
        const userId = todo.week.userId;
        if (!userId) continue;

        if (!userTodos.has(userId)) {
          userTodos.set(userId, []);
        }
        const todos = userTodos.get(userId);
        if (todos) {
          todos.push(todo);
        }
      }

      // Send notification for each user's overdue todos
      for (const [userId, todos] of userTodos.entries()) {
        // Only notify for first overdue todo to avoid spam
        const firstOverdue = todos[0];
        if (!firstOverdue.dueDate) continue;

        await this.notificationsService.todoOverdue(
          userId,
          firstOverdue.title,
          firstOverdue.id,
          firstOverdue.dueDate.toISOString(),
        );

        this.logger.log(
          `Sent overdue notification to user ${userId} for ${todos.length} todos`,
        );
      }
    } catch (error) {
      this.logger.error(`Error checking overdue todos: ${error.message}`);
    }
  }

  /**
   * Every 6 hours: Check GitHub PR reviews
   */
  @Cron('0 */6 * * *')
  async handleGitHubPRReviews() {
    this.logger.log('Checking GitHub PR reviews...');

    try {
      const users = await this.prisma.user.findMany({
        where: {
          githubAccessToken: {
            not: null,
          },
          githubUsername: {
            not: null,
          },
        },
        select: {
          id: true,
          githubUsername: true,
        },
      });

      // This would require importing GithubService
      // For now, we'll skip the actual implementation
      // You can inject GithubService and call checkAndNotifyPRReviews

      this.logger.log(`Found ${users.length} users with GitHub connected`);
    } catch (error) {
      this.logger.error(`Error checking GitHub PR reviews: ${error.message}`);
    }
  }

  /**
   * Clean up old notifications (once a month)
   */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async cleanupOldNotifications() {
    this.logger.log('Cleaning up old notifications...');

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
          isRead: true,
        },
      });

      this.logger.log(`Deleted ${result.count} old read notifications`);
    } catch (error) {
      this.logger.error(`Error cleaning up notifications: ${error.message}`);
    }
  }
}
