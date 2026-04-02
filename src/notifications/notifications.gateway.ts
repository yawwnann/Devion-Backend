import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import {
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma';
import {
  CreateNotificationDto,
  BatchMarkReadDto,
} from './dto/create-notification.dto';
import { NotificationType } from './entities/notification.entity';

interface AuthenticatedSocket extends Socket {
  userId: string;
  userEmail: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/notifications',
})
@Injectable()
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);
  @WebSocketServer()
  server: Server;

  // Track connected users per socket ID
  private connectedUsers: Map<string, string> = new Map(); // socketId -> userId

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Handle WebSocket connection
   * Authenticate user via JWT token from handshake
   */
  async handleConnection(socket: AuthenticatedSocket) {
    try {
      const token = this.extractTokenFromHandshake(socket);

      if (!token) {
        this.logger.warn(
          `Connection rejected: No token provided - ${socket.id}`,
        );
        socket.emit('error', { message: 'Authentication required' });
        socket.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      // Attach user info to socket
      socket.userId = payload.sub;
      socket.userEmail = payload.email;

      // Join user-specific room
      const roomName = `user:${socket.userId}`;
      await socket.join(roomName);

      // Track connection
      this.connectedUsers.set(socket.id, socket.userId);

      this.logger.log(
        `User connected: ${socket.userEmail} (${socket.userId}) - Socket ID: ${socket.id}`,
      );

      // Send welcome event
      socket.emit('connected', {
        userId: socket.userId,
        room: roomName,
        timestamp: new Date().toISOString(),
      });

      // Get unread notification count
      const unreadCount = await this.prisma.notification.count({
        where: {
          userId: socket.userId,
          isRead: false,
        },
      });

      socket.emit('unread_count', { count: unreadCount });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      socket.emit('error', { message: 'Invalid authentication token' });
      socket.disconnect();
    }
  }

  /**
   * Handle WebSocket disconnection
   */
  async handleDisconnect(socket: AuthenticatedSocket) {
    const userId = this.connectedUsers.get(socket.id);

    if (userId) {
      this.connectedUsers.delete(socket.id);
      this.logger.log(
        `User disconnected: ${socket.userEmail} (${userId}) - Socket ID: ${socket.id}`,
      );
    }
  }

  /**
   * Send a notification to a specific user
   */
  async sendToUser(userId: string, notification: CreateNotificationDto) {
    // Save to database
    const savedNotification = await this.prisma.notification.create({
      data: {
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Emit to user's room
    const roomName = `user:${userId}`;
    this.server.to(roomName).emit('notification', {
      id: savedNotification.id,
      type: savedNotification.type,
      title: savedNotification.title,
      message: savedNotification.message,
      data: savedNotification.data,
      isRead: savedNotification.isRead,
      createdAt: savedNotification.createdAt,
    });

    // Update unread count
    const unreadCount = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    this.server.to(roomName).emit('unread_count', { count: unreadCount });

    this.logger.log(
      `Notification sent to user ${userId}: ${notification.title}`,
    );

    return savedNotification;
  }

  /**
   * Send notification to multiple users
   */
  async sendToUsers(userIds: string[], notification: CreateNotificationDto) {
    const results = await Promise.all(
      userIds.map((userId) => this.sendToUser(userId, notification)),
    );
    return results;
  }

  /**
   * Broadcast notification to all connected users
   */
  async broadcast(notification: CreateNotificationDto, excludeUserId?: string) {
    const users = await this.prisma.user.findMany({
      select: { id: true },
    });

    const userIds = users.map((u) => u.id).filter((id) => id !== excludeUserId);

    return this.sendToUsers(userIds, notification);
  }

  /**
   * Handle mark as read
   */
  @SubscribeMessage('mark_read')
  async handleMarkAsRead(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { notificationId: string },
  ) {
    try {
      await this.prisma.notification.update({
        where: { id: data.notificationId, userId: socket.userId },
        data: { isRead: true, readAt: new Date() },
      });

      const unreadCount = await this.prisma.notification.count({
        where: {
          userId: socket.userId,
          isRead: false,
        },
      });

      socket.emit('unread_count', { count: unreadCount });

      return { success: true, count: unreadCount };
    } catch (error) {
      this.logger.error(`Error marking notification as read: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle mark all as read
   */
  @SubscribeMessage('mark_all_read')
  async handleMarkAllAsRead(@ConnectedSocket() socket: AuthenticatedSocket) {
    try {
      await this.prisma.notification.updateMany({
        where: {
          userId: socket.userId,
          isRead: false,
        },
        data: { isRead: true, readAt: new Date() },
      });

      socket.emit('unread_count', { count: 0 });

      return { success: true, count: 0 };
    } catch (error) {
      this.logger.error(
        `Error marking all notifications as read: ${error.message}`,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's notifications
   */
  @SubscribeMessage('get_notifications')
  async handleGetNotifications(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data?: { limit?: number; unreadOnly?: boolean },
  ) {
    try {
      const limit = data?.limit || 50;
      const unreadOnly = data?.unreadOnly || false;

      const notifications = await this.prisma.notification.findMany({
        where: {
          userId: socket.userId,
          ...(unreadOnly && { isRead: false }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return { success: true, notifications };
    } catch (error) {
      this.logger.error(`Error getting notifications: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle delete single notification
   */
  @SubscribeMessage('delete_notification')
  async handleDeleteNotification(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { notificationId: string },
  ) {
    try {
      await this.prisma.notification.delete({
        where: { id: data.notificationId, userId: socket.userId },
      });

      const unreadCount = await this.prisma.notification.count({
        where: {
          userId: socket.userId,
          isRead: false,
        },
      });

      socket.emit('unread_count', { count: unreadCount });

      return { success: true, count: unreadCount };
    } catch (error) {
      this.logger.error(`Error deleting notification: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle delete all notifications
   */
  @SubscribeMessage('delete_all_notifications')
  async handleDeleteAllNotifications(
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    try {
      await this.prisma.notification.deleteMany({
        where: { userId: socket.userId },
      });

      socket.emit('unread_count', { count: 0 });

      return { success: true, count: 0 };
    } catch (error) {
      this.logger.error(`Error deleting all notifications: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user is online (connected via WebSocket)
   */
  isUserOnline(userId: string): boolean {
    for (const [, connectedUserId] of this.connectedUsers) {
      if (connectedUserId === userId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get count of online users
   */
  getOnlineUserCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Extract JWT token from handshake
   */
  private extractTokenFromHandshake(socket: Socket): string | null {
    // Try different ways to get the token
    const auth = socket.handshake.auth;
    const token =
      auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      socket.handshake.query?.token;

    return token || null;
  }
}
