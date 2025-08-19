import { User } from './user.model';

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdBy: string | User;
  assignedTo?: string | User;
  channelId: string;
  workspaceId: string;
  dueDate?: Date;
  tags: string[];
  position: number;
  activityLog: TaskActivity[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskActivity {
  action: string;
  userId: string | User;
  timestamp: Date;
  details: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  channelId: string;
  dueDate?: string;
  tags?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  dueDate?: string;
  tags?: string[];
  position?: number;
}

export interface KanbanBoard {
  todo: Task[];
  inProgress: Task[];
  done: Task[];
}