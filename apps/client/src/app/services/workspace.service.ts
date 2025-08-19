import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Workspace, CreateWorkspaceRequest, AddMemberRequest } from '../models/workspace.model';
import { Channel, CreateChannelRequest } from '../models/channel.model';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  constructor(private apiService: ApiService) {}

  getWorkspaces(): Observable<Workspace[]> {
    return this.apiService.get<Workspace[]>('workspaces');
  }

  getWorkspace(id: string): Observable<Workspace> {
    return this.apiService.get<Workspace>(`workspaces/${id}`);
  }

  createWorkspace(data: CreateWorkspaceRequest): Observable<Workspace> {
    return this.apiService.post<Workspace>('workspaces', data);
  }

  addMember(workspaceId: string, data: AddMemberRequest): Observable<Workspace> {
    return this.apiService.put<Workspace>(`workspaces/${workspaceId}/members`, data);
  }

  getChannels(workspaceId: string): Observable<Channel[]> {
    return this.apiService.get<Channel[]>(`workspaces/${workspaceId}/channels`);
  }

  createChannel(workspaceId: string, data: CreateChannelRequest): Observable<Channel> {
    return this.apiService.post<Channel>(`workspaces/${workspaceId}/channels`, data);
  }

  getChannel(channelId: string): Observable<Channel> {
    return this.apiService.get<Channel>(`workspaces/channels/${channelId}`);
  }

  joinChannel(channelId: string): Observable<Channel> {
    return this.apiService.put<Channel>(`workspaces/channels/${channelId}/join`, {});
  }
}