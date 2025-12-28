import { IsString, IsNotEmpty } from 'class-validator';

export class SetGithubUsernameDto {
  @IsString()
  @IsNotEmpty()
  username: string;
}
