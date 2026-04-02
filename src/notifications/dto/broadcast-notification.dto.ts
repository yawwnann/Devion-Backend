import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class BroadcastNotificationDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType = NotificationType.SYSTEM;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsString()
  excludeUserId?: string;
}
