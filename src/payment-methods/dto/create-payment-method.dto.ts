import { IsString, IsOptional } from 'class-validator';

export class CreatePaymentMethodDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  color?: string;
}
