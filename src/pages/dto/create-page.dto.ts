import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { PageStatus } from '../enums/page-status.enum';

export class CreatePageDto {
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

  @IsUUID()
  @IsOptional()
  parentId?: string;
}
