import { IsString, IsOptional, IsObject, IsBoolean } from 'class-validator';

export class NotificationEntity {
  @IsString()
  id: string;

  @IsString()
  userId: string;

  @IsString()
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsBoolean()
  isRead: boolean;

  readAt?: Date;

  createdAt: Date;
}

export enum NotificationType {
  GITHUB = 'github',
  PROJECT = 'project',
  TODO = 'todo',
  SECURITY = 'security',
  CALENDAR = 'calendar',
  SYSTEM = 'system',
}

export interface NotificationData {
  // GitHub
  repoName?: string;
  prNumber?: number;
  issueNumber?: number;
  commitSha?: string;
  workflowName?: string;

  // Project/Todo
  projectId?: string;
  todoId?: string;
  projectName?: string;
  todoTitle?: string;
  dueDate?: string;

  // Security
  device?: string;
  location?: string;
  ipAddress?: string;

  // Calendar
  eventId?: string;
  eventTitle?: string;
  eventStartTime?: string;

  // General
  url?: string;
  actionUrl?: string;
  [key: string]: any;
}
