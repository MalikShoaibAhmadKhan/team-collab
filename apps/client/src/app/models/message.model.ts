import { User } from './user.model';

export interface Message {
  _id: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'system';
  senderId: string | User;
  channelId: string;
  workspaceId: string;
  reactions: MessageReaction[];
  replyTo?: string | Message;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageReaction {
  emoji: string;
  users: string[];
}

export interface CreateMessageRequest {
  content: string;
  type?: 'text' | 'file' | 'image' | 'system';
  channelId: string;
  replyTo?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}