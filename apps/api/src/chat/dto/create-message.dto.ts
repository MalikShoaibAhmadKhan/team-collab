import { IsString, IsOptional, IsEnum, IsMongoId } from 'class-validator';
import { MessageType } from '../schemas/message.schema';

export class CreateMessageDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @IsMongoId()
  channelId: string;

  @IsOptional()
  @IsMongoId()
  replyTo?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  fileSize?: number;
}