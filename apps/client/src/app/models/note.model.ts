import { User } from './user.model';

export interface Note {
  _id: string;
  title: string;
  content: string;
  createdBy: string | User;
  workspaceId: string;
  channelId?: string;
  collaborators: string[];
  isPinned: boolean;
  tags: string[];
  revisionHistory: NoteRevision[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteRevision {
  userId: string | User;
  action: string;
  timestamp: Date;
  changes: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  workspaceId: string;
  channelId?: string;
  collaborators?: string[];
  isPinned?: boolean;
  tags?: string[];
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  collaborators?: string[];
  isPinned?: boolean;
  tags?: string[];
}