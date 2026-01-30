import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsEnum,
} from 'class-validator';

export enum EventType {
  PROJECT = 'project',
  TODO = 'todo',
  GITHUB_ISSUE = 'github_issue',
  CUSTOM = 'custom',
}

export class CreateEventDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @IsOptional()
  @IsString()
  color?: string;

  @IsEnum(EventType)
  eventType: EventType;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  todoId?: string;

  @IsOptional()
  githubIssueNumber?: number;

  @IsOptional()
  @IsString()
  githubRepoName?: string;
}
