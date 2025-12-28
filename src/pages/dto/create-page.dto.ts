import { IsString, IsOptional, IsUUID } from 'class-validator';

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

  @IsUUID()
  @IsOptional()
  parentId?: string;
}
