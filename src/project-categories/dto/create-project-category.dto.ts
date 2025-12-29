import { IsString, IsOptional } from 'class-validator';

export class CreateProjectCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  color?: string;
}
