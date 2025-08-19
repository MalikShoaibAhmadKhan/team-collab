import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Note, CreateNoteRequest, UpdateNoteRequest } from '../models/note.model';

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  constructor(private apiService: ApiService) {}

  createNote(data: CreateNoteRequest): Observable<Note> {
    return this.apiService.post<Note>('notes', data);
  }

  getWorkspaceNotes(workspaceId: string): Observable<Note[]> {
    return this.apiService.get<Note[]>(`notes/workspaces/${workspaceId}`);
  }

  getChannelNotes(channelId: string): Observable<Note[]> {
    return this.apiService.get<Note[]>(`notes/channels/${channelId}`);
  }

  getNote(id: string): Observable<Note> {
    return this.apiService.get<Note>(`notes/${id}`);
  }

  updateNote(id: string, data: UpdateNoteRequest): Observable<Note> {
    return this.apiService.put<Note>(`notes/${id}`, data);
  }

  deleteNote(id: string): Observable<void> {
    return this.apiService.delete<void>(`notes/${id}`);
  }

  addCollaborator(noteId: string, collaboratorId: string): Observable<Note> {
    return this.apiService.put<Note>(`notes/${noteId}/collaborators/${collaboratorId}`, {});
  }

  removeCollaborator(noteId: string, collaboratorId: string): Observable<Note> {
    return this.apiService.delete<Note>(`notes/${noteId}/collaborators/${collaboratorId}`);
  }

  searchNotes(workspaceId: string, query: string): Observable<Note[]> {
    return this.apiService.get<Note[]>(`notes/workspaces/${workspaceId}/search`, { q: query });
  }
}