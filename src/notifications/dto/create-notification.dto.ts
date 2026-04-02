import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';
import type { NotificationData } from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsString()
  userId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsObject()
  @IsOptional()
  data?: NotificationData;
}

export class MarkNotificationAsReadDto {
  @IsString()
  @IsOptional()
  notificationId?: string;

  @IsString()
  @IsOptional()
  type?: string;
}

export class BatchMarkReadDto {
  @IsString()
  userId: string;

  @IsOptional()
  notificationIds?: string[];
}
