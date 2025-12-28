import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  eventType: string; // page_view, block_created, block_updated, etc.

  @IsObject()
  @IsOptional()
  eventData?: Record<string, any>;
}
