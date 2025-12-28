import { IsString, IsOptional, IsObject, IsInt, Min } from 'class-validator';

export class UpdateBlockDto {
  @IsString()
  @IsOptional()
  type?: string;

  @IsObject()
  @IsOptional()
  content?: Record<string, any>;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}
