export interface Workspace {
  _id: string;
  name: string;
  description: string;
  createdBy: string | User;
  members: WorkspaceMember[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  userId: string | User;
  role: 'admin' | 'member' | 'guest';
  joinedAt: Date;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

export interface AddMemberRequest {
  email: string;
  role?: 'admin' | 'member' | 'guest';
}

import { User } from './user.model';