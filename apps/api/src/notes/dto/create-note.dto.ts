import { IsString, IsOptional, IsMongoId, IsArray, IsBoolean } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsMongoId()
  workspaceId: string;

  @IsOptional()
  @IsMongoId()
  channelId?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  collaborators?: string[];

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}