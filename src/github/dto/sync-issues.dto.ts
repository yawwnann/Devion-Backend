import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class SyncIssuesDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  githubRepo: string; // owner/repo format
}

export class CreateIssueDto {
  @IsString()
  @IsNotEmpty()
  todoId: string;

  @IsString()
  @IsNotEmpty()
  githubRepo: string;
}

export class SyncSingleTodoDto {
  @IsString()
  @IsNotEmpty()
  todoId: string;
}

export class LinkRepoDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  githubRepo: string; // owner/repo format
}
