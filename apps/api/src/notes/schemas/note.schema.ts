import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NoteDocument = HydratedDocument<Note>;

@Schema({ timestamps: true })
export class Note {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true })
  workspaceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Channel' })
  channelId: Types.ObjectId;

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  collaborators: Types.ObjectId[];

  @Prop({ default: false })
  isPinned: boolean;

  @Prop([String])
  tags: string[];

  @Prop([{
    userId: { type: Types.ObjectId, ref: 'User' },
    action: String,
    timestamp: { type: Date, default: Date.now },
    changes: String
  }])
  revisionHistory: Array<{
    userId: Types.ObjectId;
    action: string;
    timestamp: Date;
    changes: string;
  }>;

  @Prop({ default: true })
  isActive: boolean;
}

export const NoteSchema = SchemaFactory.createForClass(Note);