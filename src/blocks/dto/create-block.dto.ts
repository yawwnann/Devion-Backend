import {
  IsString,
  IsOptional,
  IsUUID,
  IsObject,
  IsInt,
  Min,
} from 'class-validator';

export class CreateBlockDto {
  @IsUUID()
  pageId: string;

  @IsString()
  type: string; // text, heading, todo, code, image, embed, chart, etc.

  @IsObject()
  @IsOptional()
  content?: Record<string, any>;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @IsUUID()
  @IsOptional()
  parentBlockId?: string;
}
