import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WorkspaceDocument = HydratedDocument<Workspace>;

export enum MemberRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest'
}

export interface WorkspaceMember {
  userId: Types.ObjectId;
  role: MemberRole;
  joinedAt: Date;
}

@Schema({ timestamps: true })
export class Workspace {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop([{
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: MemberRole, default: MemberRole.MEMBER },
    joinedAt: { type: Date, default: Date.now }
  }])
  members: WorkspaceMember[];

  @Prop({ default: true })
  isActive: boolean;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);