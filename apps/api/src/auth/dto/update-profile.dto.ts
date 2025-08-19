import { IsString, IsOptional, IsEnum } from 'class-validator';
import { UserStatus } from '../schemas/user.schema';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  profilePicture?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}