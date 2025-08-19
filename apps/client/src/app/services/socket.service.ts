import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Message } from '../models/message.model';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectedSubject.asObservable();

  constructor() {}

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(environment.socketUrl, {
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket:', environment.socketUrl);
      this.connectedSubject.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      this.connectedSubject.next(false);
    });

    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectedSubject.next(false);
    }
  }

  // Message events
  sendMessage(message: any): void {
    this.socket?.emit('sendMessage', message);
  }

  onNewMessage(): Observable<Message> {
    return new Observable(observer => {
      this.socket?.on('newMessage', (message: Message) => {
        observer.next(message);
      });
    });
  }

  // Channel events
  joinChannel(channelId: string): void {
    this.socket?.emit('joinChannel', { channelId });
  }

  leaveChannel(channelId: string): void {
    this.socket?.emit('leaveChannel', { channelId });
  }

  onJoinedChannel(): Observable<{ channelId: string }> {
    return new Observable(observer => {
      this.socket?.on('joinedChannel', (data) => {
        observer.next(data);
      });
    });
  }

  onLeftChannel(): Observable<{ channelId: string }> {
    return new Observable(observer => {
      this.socket?.on('leftChannel', (data) => {
        observer.next(data);
      });
    });
  }

  // Typing events
  startTyping(channelId: string): void {
    this.socket?.emit('typing', { channelId, isTyping: true });
  }

  stopTyping(channelId: string): void {
    this.socket?.emit('typing', { channelId, isTyping: false });
  }

  onUserTyping(): Observable<{ userId: string; channelId: string; isTyping: boolean }> {
    return new Observable(observer => {
      this.socket?.on('userTyping', (data) => {
        observer.next(data);
      });
    });
  }

  // Reaction events
  addReaction(messageId: string, emoji: string): void {
    this.socket?.emit('addReaction', { messageId, emoji });
  }

  onReactionAdded(): Observable<{ messageId: string; reactions: any[] }> {
    return new Observable(observer => {
      this.socket?.on('reactionAdded', (data) => {
        observer.next(data);
      });
    });
  }

  // User status events
  onUserStatusChanged(): Observable<{ userId: string; status: string; lastSeen: Date }> {
    return new Observable(observer => {
      this.socket?.on('userStatusChanged', (data) => {
        observer.next(data);
      });
    });
  }

  // Generic event listener
  on(event: string): Observable<any> {
    return new Observable(observer => {
      this.socket?.on(event, (data) => {
        observer.next(data);
      });
    });
  }

  // Generic event emitter
  emit(event: string, data: any): void {
    this.socket?.emit(event, data);
  }
}