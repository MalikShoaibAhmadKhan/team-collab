import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChannelDocument = HydratedDocument<Channel>;

export enum ChannelType {
  PUBLIC = 'public',
  PRIVATE = 'private'
}

@Schema({ timestamps: true })
export class Channel {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: String, enum: ChannelType, default: ChannelType.PUBLIC })
  type: ChannelType;

  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true })
  workspaceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  members: Types.ObjectId[];

  @Prop({ default: true })
  isActive: boolean;
}

export const ChannelSchema = SchemaFactory.createForClass(Channel);