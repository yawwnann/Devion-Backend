import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationType } from './entities/notification.entity';

@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Broadcast notification to all users (for testing)
   */
  @Post('broadcast')
  @UseGuards(JwtAuthGuard)
  async broadcast(
    @Body() dto: BroadcastNotificationDto,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`Broadcasting notification: ${dto.title}`);

    const result = await this.notificationsService.broadcastToAllUsers(
      dto.type || NotificationType.SYSTEM,
      dto.title,
      dto.message,
      dto.data,
      user.id, // Exclude current user
    );

    return {
      success: true,
      message: `Notification sent to ${result.count} users`,
      count: result.count,
    };
  }

  /**
   * Send test notification to current user
   */
  @Post('test')
  @UseGuards(JwtAuthGuard)
  async sendTest(@Body() dto: any, @CurrentUser() user: any) {
    const notificationType = dto?.type || 'system';
    const title = dto?.title || '🧪 Test Notification';
    const message = dto?.message || 'This is a test notification from the API!';
    const data = dto?.data || {
      test: true,
      timestamp: new Date().toISOString(),
      actionUrl: '/dashboard',
    };

    const result = await this.notificationsService.sendNotification(
      user.id,
      notificationType,
      title,
      message,
      data,
    );

    return {
      success: true,
      message: 'Test notification sent',
      notificationId: result.id,
    };
  }
}
