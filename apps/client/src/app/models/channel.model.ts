import { User } from './user.model';

export interface Channel {
  _id: string;
  name: string;
  description: string;
  type: 'public' | 'private';
  workspaceId: string;
  createdBy: string | User;
  members: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChannelRequest {
  name: string;
  description?: string;
  type?: 'public' | 'private';
}