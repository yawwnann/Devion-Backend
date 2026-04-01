import { IsString, IsOptional, IsBoolean, IsEnum, IsDateString } from 'class-validator';
import { PageStatus } from '../enums/page-status.enum';

export class UpdatePageDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  cover?: string;

  @IsEnum(PageStatus)
  @IsOptional()
  status?: PageStatus;

  @IsDateString()
  @IsOptional()
  publishedAt?: string;

  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @IsBoolean()
  @IsOptional()
  isFavorite?: boolean;
}
