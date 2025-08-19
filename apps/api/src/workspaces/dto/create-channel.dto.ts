import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ChannelType } from '../schemas/channel.schema';

export class CreateChannelDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ChannelType)
  type?: ChannelType;
}