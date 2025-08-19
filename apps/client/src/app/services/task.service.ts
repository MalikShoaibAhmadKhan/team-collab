import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Task, CreateTaskRequest, UpdateTaskRequest, KanbanBoard } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  constructor(private apiService: ApiService) {}

  createTask(data: CreateTaskRequest): Observable<Task> {
    return this.apiService.post<Task>('tasks', data);
  }

  getChannelTasks(channelId: string): Observable<KanbanBoard> {
    return this.apiService.get<KanbanBoard>(`tasks/channels/${channelId}`);
  }

  getMyTasks(): Observable<Task[]> {
    return this.apiService.get<Task[]>('tasks/my-tasks');
  }

  getTask(id: string): Observable<Task> {
    return this.apiService.get<Task>(`tasks/${id}`);
  }

  updateTask(id: string, data: UpdateTaskRequest): Observable<Task> {
    return this.apiService.put<Task>(`tasks/${id}`, data);
  }

  moveTask(id: string, status: 'todo' | 'in_progress' | 'done', position: number): Observable<Task> {
    return this.apiService.put<Task>(`tasks/${id}/move`, { status, position });
  }

  deleteTask(id: string): Observable<void> {
    return this.apiService.delete<void>(`tasks/${id}`);
  }
}