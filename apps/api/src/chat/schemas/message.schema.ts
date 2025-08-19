import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  IMAGE = 'image',
  SYSTEM = 'system'
}

export interface MessageReaction {
  emoji: string;
  users: Types.ObjectId[];
}

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true })
  content: string;

  @Prop({ type: String, enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Channel', required: true })
  channelId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true })
  workspaceId: Types.ObjectId;

  @Prop([{
    emoji: String,
    users: [{ type: Types.ObjectId, ref: 'User' }]
  }])
  reactions: MessageReaction[];

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  replyTo: Types.ObjectId;

  @Prop({ default: false })
  isEdited: boolean;

  @Prop()
  editedAt: Date;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  fileUrl: string;

  @Prop()
  fileName: string;

  @Prop()
  fileSize: number;
}

export const MessageSchema = SchemaFactory.createForClass(Message);