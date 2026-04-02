import { IsString, IsOptional, IsArray } from 'class-validator';

export class MarkReadDto {
  @IsString()
  userId: string;

  @IsArray()
  @IsOptional()
  notificationIds?: string[];
}
