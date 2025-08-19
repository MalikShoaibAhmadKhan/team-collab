import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { MemberRole } from '../schemas/workspace.schema';

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(MemberRole)
  role?: MemberRole;
}