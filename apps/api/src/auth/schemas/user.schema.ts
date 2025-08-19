// In apps/api/src/auth/schemas/user.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  AWAY = 'away',
  BUSY = 'busy'
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, trim: true })
  email: string;

  @Prop({ required: false })
  password: string;

  @Prop({ required: true, trim: true })
  username: string;

  @Prop({ default: '' })
  bio: string;

  @Prop({ default: '' })
  profilePicture: string;

  @Prop({ type: String, enum: UserStatus, default: UserStatus.OFFLINE })
  status: UserStatus;

  @Prop({ default: Date.now })
  lastSeen: Date;

  @Prop({ default: false })
  isGoogleUser: boolean;

  @Prop()
  googleId: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);