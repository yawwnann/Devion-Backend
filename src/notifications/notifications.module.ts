import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationScheduler } from './notification.scheduler';
import { PrismaModule } from '../prisma';

@Module({
  imports: [JwtModule, PrismaModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsGateway,
    NotificationsService,
    NotificationScheduler,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
