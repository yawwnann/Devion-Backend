import { IsOptional, IsString } from 'class-validator';

export class UpdatePreferenceDto {
  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  language?: string;
}
