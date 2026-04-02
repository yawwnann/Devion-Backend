import { Injectable, Logger } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { CreateNotificationDto } from './dto/create-notification.dto';
import {
  NotificationType,
  NotificationData,
} from './entities/notification.entity';
import { PrismaService } from '../prisma';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationsGateway: NotificationsGateway,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Send a notification to a specific user
   */
  async sendNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: NotificationData,
  ) {
    const notification: CreateNotificationDto = {
      userId,
      type,
      title,
      message,
      data,
    };

    this.logger.log(
      `Sending notification to user ${userId}: ${title} - ${message}`,
    );

    return this.notificationsGateway.sendToUser(userId, notification);
  }

  /**
   * GitHub Notifications
   */
  async sendGitHubNotification(
    userId: string,
    title: string,
    message: string,
    data?: NotificationData,
  ) {
    return this.sendNotification(
      userId,
      NotificationType.GITHUB,
      title,
      message,
      data,
    );
  }

  async prReviewRequested(
    userId: string,
    prNumber: number,
    prTitle: string,
    repoName: string,
    prUrl: string,
  ) {
    return this.sendGitHubNotification(
      userId,
      'PR Review Requested',
      `Your review is requested on PR #${prNumber}: ${prTitle}`,
      {
        prNumber,
        repoName,
        url: prUrl,
        actionUrl: `/github/prs/${repoName}/${prNumber}`,
      },
    );
  }

  async newCommit(
    userId: string,
    commitMessage: string,
    commitSha: string,
    repoName: string,
    commitUrl: string,
  ) {
    return this.sendGitHubNotification(
      userId,
      'New Commit',
      `New commit in ${repoName}: ${commitMessage.substring(0, 50)}`,
      {
        commitSha,
        repoName,
        url: commitUrl,
      },
    );
  }

  async issueAssigned(
    userId: string,
    issueNumber: number,
    issueTitle: string,
    repoName: string,
    issueUrl: string,
  ) {
    return this.sendGitHubNotification(
      userId,
      'Issue Assigned',
      `You were assigned to issue #${issueNumber}: ${issueTitle}`,
      {
        issueNumber,
        repoName,
        url: issueUrl,
        actionUrl: `/github/issues/${repoName}/${issueNumber}`,
      },
    );
  }

  async workflowFailed(
    userId: string,
    workflowName: string,
    repoName: string,
    workflowUrl: string,
  ) {
    return this.sendGitHubNotification(
      userId,
      'Workflow Failed',
      `Workflow "${workflowName}" failed in ${repoName}`,
      {
        workflowName,
        repoName,
        url: workflowUrl,
      },
    );
  }

  /**
   * Project Notifications
   */
  async sendProjectNotification(
    userId: string,
    title: string,
    message: string,
    data?: NotificationData,
  ) {
    return this.sendNotification(
      userId,
      NotificationType.PROJECT,
      title,
      message,
      data,
    );
  }

  async projectDeadlineApproaching(
    userId: string,
    projectName: string,
    projectId: string,
    dueDate: string,
    daysLeft: number,
  ) {
    return this.sendProjectNotification(
      userId,
      'Project Deadline Approaching',
      `Project "${projectName}" is due in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
      {
        projectId,
        projectName,
        dueDate,
        actionUrl: `/projects/${projectId}`,
      },
    );
  }

  async projectStatusChanged(
    userId: string,
    projectName: string,
    projectId: string,
    oldStatus: string,
    newStatus: string,
  ) {
    return this.sendProjectNotification(
      userId,
      'Project Status Changed',
      `Project "${projectName}" status changed from ${oldStatus} to ${newStatus}`,
      {
        projectId,
        projectName,
        oldStatus,
        newStatus,
        actionUrl: `/projects/${projectId}`,
      },
    );
  }

  /**
   * Todo Notifications
   */
  async sendTodoNotification(
    userId: string,
    title: string,
    message: string,
    data?: NotificationData,
  ) {
    return this.sendNotification(
      userId,
      NotificationType.TODO,
      title,
      message,
      data,
    );
  }

  async todoDueToday(userId: string, todoTitle: string, todoId: string) {
    return this.sendTodoNotification(
      userId,
      'Task Due Today',
      `Task "${todoTitle}" is due today`,
      {
        todoId,
        todoTitle,
        actionUrl: `/todos`,
      },
    );
  }

  async todoOverdue(
    userId: string,
    todoTitle: string,
    todoId: string,
    dueDate: string,
  ) {
    return this.sendTodoNotification(
      userId,
      'Task Overdue',
      `Task "${todoTitle}" is overdue!`,
      {
        todoId,
        todoTitle,
        dueDate,
        actionUrl: `/todos`,
      },
    );
  }

  /**
   * Security Notifications
   */
  async sendSecurityNotification(
    userId: string,
    title: string,
    message: string,
    data?: NotificationData,
  ) {
    return this.sendNotification(
      userId,
      NotificationType.SECURITY,
      title,
      message,
      data,
    );
  }

  async newLogin(
    userId: string,
    device: string,
    location: string,
    ipAddress: string,
  ) {
    return this.sendSecurityNotification(
      userId,
      'New Login Detected',
      `New login from ${device} in ${location}`,
      {
        device,
        location,
        ipAddress,
      },
    );
  }

  async failedLoginAttempt(
    userId: string,
    device: string,
    location: string,
    ipAddress: string,
  ) {
    return this.sendSecurityNotification(
      userId,
      'Failed Login Attempt',
      `Failed login attempt from ${device} in ${location}`,
      {
        device,
        location,
        ipAddress,
      },
    );
  }

  async newDeviceLogin(
    userId: string,
    device: string,
    location: string,
    ipAddress: string,
  ) {
    return this.sendSecurityNotification(
      userId,
      'Login from New Device',
      `Login detected from unrecognized device: ${device} in ${location}`,
      {
        device,
        location,
        ipAddress,
      },
    );
  }

  /**
   * Calendar Notifications
   */
  async sendCalendarNotification(
    userId: string,
    title: string,
    message: string,
    data?: NotificationData,
  ) {
    return this.sendNotification(
      userId,
      NotificationType.CALENDAR,
      title,
      message,
      data,
    );
  }

  async eventStartingSoon(
    userId: string,
    eventTitle: string,
    eventId: string,
    startTime: string,
    minutesUntilStart: number,
  ) {
    return this.sendCalendarNotification(
      userId,
      'Event Starting Soon',
      `Event "${eventTitle}" starts in ${minutesUntilStart} minutes`,
      {
        eventId,
        eventTitle,
        eventStartTime: startTime,
        actionUrl: `/calendar`,
      },
    );
  }

  async allDayEvent(userId: string, eventTitle: string, eventId: string) {
    return this.sendCalendarNotification(
      userId,
      'Event Today',
      `Event today: "${eventTitle}"`,
      {
        eventId,
        eventTitle,
        actionUrl: `/calendar`,
      },
    );
  }

  /**
   * Broadcast notification to all users
   */
  async broadcastToAllUsers(
    type: NotificationType,
    title: string,
    message: string,
    data?: NotificationData,
    excludeUserId?: string,
  ) {
    const users = await this.prisma.user.findMany({
      select: { id: true, email: true },
    });

    const targetUsers = users.filter((u) => u.id !== excludeUserId);
    let count = 0;

    for (const user of targetUsers) {
      try {
        await this.sendNotification(user.id, type, title, message, data);
        count++;
      } catch (error) {
        this.logger.error(
          `Failed to send broadcast to user ${user.id}: ${error.message}`,
        );
      }
    }

    this.logger.log(`Broadcast sent to ${count} users`);

    return { count, success: true };
  }

  /**
   * Delete a single notification
   */
  async deleteNotification(userId: string, notificationId: string) {
    await this.prisma.notification.delete({
      where: { id: notificationId, userId },
    });

    this.logger.log(
      `Notification ${notificationId} deleted for user ${userId}`,
    );

    return { success: true };
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: string) {
    await this.prisma.notification.deleteMany({
      where: { userId },
    });

    this.logger.log(`All notifications deleted for user ${userId}`);

    return { success: true, count: 0 };
  }
}
