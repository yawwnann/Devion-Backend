import { IsEnum, IsString, IsOptional } from 'class-validator';

export class SubmitReviewDto {
  @IsString()
  @IsOptional()
  body?: string;

  @IsEnum(['APPROVE', 'REQUEST_CHANGES', 'COMMENT'])
  @IsString()
  event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
}
