import { IsOptional, IsString } from 'class-validator';

export class SetGithubTokenDto {
  @IsString()
  @IsOptional()
  token?: string;
}
