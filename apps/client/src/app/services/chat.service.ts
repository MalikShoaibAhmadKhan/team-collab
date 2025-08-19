import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Message, CreateMessageRequest } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private apiService: ApiService) {}

  sendMessage(data: CreateMessageRequest): Observable<Message> {
    return this.apiService.post<Message>('chat/messages', data);
  }

  getChannelMessages(channelId: string, page = 1, limit = 50): Observable<Message[]> {
    return this.apiService.get<Message[]>(`chat/channels/${channelId}/messages`, { page, limit });
  }

  editMessage(messageId: string, content: string): Observable<Message> {
    return this.apiService.put<Message>(`chat/messages/${messageId}`, { content });
  }

  deleteMessage(messageId: string): Observable<void> {
    return this.apiService.delete<void>(`chat/messages/${messageId}`);
  }

  searchMessages(workspaceId: string, query: string): Observable<Message[]> {
    return this.apiService.get<Message[]>(`chat/workspaces/${workspaceId}/search`, { q: query });
  }
}