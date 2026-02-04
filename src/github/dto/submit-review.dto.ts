import { IsEnum, IsString, IsNotEmpty } from 'class-validator';

export class SubmitReviewDto {
  @IsString()
  @IsNotEmpty()
  comment: string;

  @IsEnum(['APPROVE', 'REQUEST_CHANGES', 'COMMENT'])
  @IsNotEmpty()
  event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
}
