import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { SocketService } from '../../services/socket.service';
import { AuthService } from '../../services/auth.service';
import { Message } from '../../models/message.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-full">
      <!-- Chat Header -->
      <div class="bg-white border-b border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-gray-900"># {{ channelName }}</h1>
            <p class="text-sm text-gray-500">{{ messages.length }} messages</p>
          </div>
          <div class="flex items-center space-x-4">
            <!-- Online users indicator -->
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-green-400 rounded-full"></div>
              <span class="text-sm text-gray-500">{{ onlineUsers }} online</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Messages Area -->
      <div class="flex-1 overflow-y-auto p-6 space-y-4" #messagesContainer>
        <div *ngIf="!channelId" class="flex items-center justify-center h-full">
          <div class="text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No channel selected</h3>
            <p class="mt-1 text-sm text-gray-500">Select a channel from the sidebar to start chatting.</p>
          </div>
        </div>
        <div *ngFor="let message of messages; trackBy: trackByMessageId" class="flex space-x-3">
          <!-- User Avatar -->
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
              <span class="text-xs font-medium text-white">
                {{ getUserInitials(message.senderId) }}
              </span>
            </div>
          </div>
          
          <!-- Message Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-gray-900">
                {{ getUserName(message.senderId) }}
              </span>
              <span class="text-xs text-gray-500">
                {{ formatTime(message.createdAt) }}
              </span>
              <span *ngIf="message.isEdited" class="text-xs text-gray-400">(edited)</span>
            </div>
            
            <div class="mt-1">
              <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ message.content }}</p>
              
              <!-- File attachment -->
              <div *ngIf="message.fileUrl" class="mt-2">
                <div class="flex items-center space-x-2 p-2 bg-gray-50 rounded border">
                  <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3 5a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V5zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                  </svg>
                  <span class="text-sm text-gray-600">{{ message.fileName }}</span>
                  <span class="text-xs text-gray-400">({{ formatFileSize(message.fileSize) }})</span>
                </div>
              </div>
              
              <!-- Reactions -->
              <div *ngIf="message.reactions && message.reactions.length > 0" class="flex flex-wrap gap-1 mt-2">
                <button
                  *ngFor="let reaction of message.reactions"
                  (click)="toggleReaction(message._id, reaction.emoji)"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 hover:bg-gray-200 transition-colors"
                  [class.bg-blue-100]="userHasReacted(reaction, currentUser?._id)"
                >
                  <span>{{ reaction.emoji }}</span>
                  <span class="ml-1 text-gray-600">{{ reaction.users.length }}</span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Message Actions -->
          <div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <div class="flex space-x-1">
              <button
                (click)="addReaction(message._id, '👍')"
                class="p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Add reaction"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L9 7m5 3v4M9 7H7l-2-2v10l2-2h2m0-8a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V7z"></path>
                </svg>
              </button>
              <button
                *ngIf="canEditMessage(message)"
                (click)="startEditMessage(message)"
                class="p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Edit message"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Typing Indicator -->
        <div *ngIf="typingUsers.length > 0" class="flex items-center space-x-2 text-sm text-gray-500">
          <div class="flex space-x-1">
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          </div>
          <span>{{ getTypingText() }}</span>
        </div>
      </div>

      <!-- Message Input -->
      <div class="bg-white border-t border-gray-200 p-4">
        <div class="flex space-x-4">
          <div class="flex-1">
            <div class="relative">
              <input
                type="text"
                [(ngModel)]="newMessage"
                (keydown)="onKeyDown($event)"
                (input)="onTyping()"
                placeholder="Type a message..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                [disabled]="!channelId"
              />
              <div class="absolute right-2 top-2 flex space-x-1">
                <button
                  type="button"
                  class="p-1 text-gray-400 hover:text-gray-600 rounded"
                  title="Add emoji"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </button>
                <button
                  type="button"
                  class="p-1 text-gray-400 hover:text-gray-600 rounded"
                  title="Attach file"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <button
            (click)="sendMessage()"
            [disabled]="!newMessage.trim() || !channelId"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  `
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = true;
  private typingTimer: any;
  
  messages: Message[] = [];
  newMessage = '';
  channelId = '';
  channelName = '';
  workspaceId = '';
  currentUser: User | null = null;
  typingUsers: string[] = [];
  onlineUsers = 1;

  constructor(
    private chatService: ChatService,
    private socketService: SocketService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });

    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['channel'] && params['workspace']) {
          this.channelId = params['channel'];
          this.workspaceId = params['workspace'];
          this.loadMessages();
          this.joinChannel();
        }
      });

    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    if (this.channelId) {
      this.socketService.leaveChannel(this.channelId);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private setupSocketListeners(): void {
    this.socketService.onNewMessage()
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (message.channelId === this.channelId) {
          this.messages.push(message);
          this.shouldScrollToBottom = true;
        }
      });

    this.socketService.onUserTyping()
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ userId, channelId, isTyping }) => {
        if (channelId === this.channelId && userId !== this.currentUser?._id) {
          if (isTyping) {
            if (!this.typingUsers.includes(userId)) {
              this.typingUsers.push(userId);
            }
          } else {
            this.typingUsers = this.typingUsers.filter(id => id !== userId);
          }
        }
      });

    this.socketService.onReactionAdded()
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ messageId, reactions }) => {
        const message = this.messages.find(m => m._id === messageId);
        if (message) {
          message.reactions = reactions;
        }
      });
  }

  private loadMessages(): void {
    if (!this.channelId) {
      this.messages = [];
      return;
    }

    this.chatService.getChannelMessages(this.channelId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (messages) => {
          this.messages = messages.reverse(); // API returns newest first, we want oldest first
          this.shouldScrollToBottom = true;
        },
        error: (error) => {
          console.error('Error loading messages:', error);
          this.messages = [];
        }
      });
  }

  private joinChannel(): void {
    if (this.channelId) {
      this.socketService.joinChannel(this.channelId);
    }
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.channelId) return;

    const messageData = {
      content: this.newMessage.trim(),
      channelId: this.channelId,
      type: 'text' as const
    };

    this.socketService.sendMessage(messageData);
    this.newMessage = '';
    this.socketService.stopTyping(this.channelId);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onTyping(): void {
    if (!this.channelId) return;

    this.socketService.startTyping(this.channelId);
    
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {
      this.socketService.stopTyping(this.channelId);
    }, 1000);
  }

  addReaction(messageId: string, emoji: string): void {
    this.socketService.addReaction(messageId, emoji);
  }

  toggleReaction(messageId: string, emoji: string): void {
    this.socketService.addReaction(messageId, emoji);
  }

  canEditMessage(message: Message): boolean {
    return typeof message.senderId === 'object' 
      ? message.senderId._id === this.currentUser?._id
      : message.senderId === this.currentUser?._id;
  }

  startEditMessage(message: Message): void {
    // TODO: Implement edit message functionality
    console.log('Edit message:', message);
  }

  getUserName(senderId: string | User): string {
    if (typeof senderId === 'object') {
      return senderId.username;
    }
    return 'Unknown User';
  }

  getUserInitials(senderId: string | User): string {
    const username = this.getUserName(senderId);
    return username.charAt(0).toUpperCase();
  }

  userHasReacted(reaction: any, userId?: string): boolean {
    return userId ? reaction.users.includes(userId) : false;
  }

  getTypingText(): string {
    if (this.typingUsers.length === 1) {
      return 'Someone is typing...';
    } else if (this.typingUsers.length > 1) {
      return `${this.typingUsers.length} people are typing...`;
    }
    return '';
  }

  formatTime(date: Date | string): string {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString();
    }
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  trackByMessageId(index: number, message: Message): string {
    return message._id;
  }
}