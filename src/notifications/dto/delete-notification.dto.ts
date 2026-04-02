import { IsString, IsOptional, IsArray } from 'class-validator';

export class DeleteNotificationDto {
  @IsString()
  notificationId: string;
}

export class BatchDeleteDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notificationIds?: string[];
}
