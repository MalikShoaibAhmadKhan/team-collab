import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { WorkspaceService } from '../services/workspace.service';
import { SocketService } from '../services/socket.service';
import { User } from '../models/user.model';
import { Workspace } from '../models/workspace.model';
import { Channel } from '../models/channel.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="h-screen flex bg-gray-100">
      <!-- Sidebar -->
      <div class="w-64 bg-gray-800 text-white flex flex-col">
        <!-- User Profile -->
        <div class="p-4 border-b border-gray-700">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
              <span class="text-sm font-medium">{{ getUserInitials() }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{{ currentUser?.username }}</p>
              <p class="text-xs text-gray-400 truncate">{{ currentUser?.email }}</p>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-green-400 rounded-full" *ngIf="socketConnected"></div>
              <button
                (click)="logout()"
                class="text-gray-400 hover:text-white"
                title="Logout"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Workspaces -->
        <div class="flex-1 overflow-y-auto">
          <div class="p-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-medium text-gray-300">Workspaces</h3>
              <button
                (click)="showCreateWorkspace = true"
                class="text-gray-400 hover:text-white"
                title="Create Workspace"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
              </button>
            </div>
            
            <div class="space-y-1">
              <div
                *ngFor="let workspace of workspaces"
                class="flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-700"
                [class.bg-gray-700]="selectedWorkspace?._id === workspace._id"
                (click)="selectWorkspace(workspace)"
              >
                <div class="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center">
                  <span class="text-xs font-medium">{{ workspace.name.charAt(0).toUpperCase() }}</span>
                </div>
                <span class="text-sm truncate">{{ workspace.name }}</span>
              </div>
            </div>
          </div>

          <!-- Channels -->
          <div class="p-4" *ngIf="selectedWorkspace">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-medium text-gray-300">Channels</h3>
              <button
                (click)="showCreateChannel = true"
                class="text-gray-400 hover:text-white"
                title="Create Channel"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
              </button>
            </div>
            
            <div class="space-y-1">
              <div
                *ngFor="let channel of channels"
                class="flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-700"
                [class.bg-gray-700]="selectedChannel?._id === channel._id"
                (click)="selectChannel(channel)"
              >
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                </svg>
                <span class="text-sm truncate">{{ channel.name }}</span>
                <svg *ngIf="channel.type === 'private'" class="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div class="p-4 border-t border-gray-700">
          <nav class="space-y-1">
            <a
              routerLink="/dashboard/chat"
              routerLinkActive="bg-gray-700 text-white"
              class="flex items-center space-x-2 p-2 rounded text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
              <span>Chat</span>
            </a>
            <a
              routerLink="/dashboard/tasks"
              routerLinkActive="bg-gray-700 text-white"
              class="flex items-center space-x-2 p-2 rounded text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
              <span>Tasks</span>
            </a>
            <a
              routerLink="/dashboard/notes"
              routerLinkActive="bg-gray-700 text-white"
              class="flex items-center space-x-2 p-2 rounded text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              <span>Notes</span>
            </a>
          </nav>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <router-outlet></router-outlet>
      </div>
    </div>

    <!-- Create Workspace Modal -->
    <div *ngIf="showCreateWorkspace" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Create New Workspace</h3>
          <form (ngSubmit)="createWorkspace()">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                [(ngModel)]="newWorkspace.name"
                name="workspaceName"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter workspace name"
                required
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                [(ngModel)]="newWorkspace.description"
                name="workspaceDescription"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter workspace description"
              ></textarea>
            </div>
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                (click)="showCreateWorkspace = false"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Create Channel Modal -->
    <div *ngIf="showCreateChannel" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Create New Channel</h3>
          <form (ngSubmit)="createChannel()">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                [(ngModel)]="newChannel.name"
                name="channelName"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter channel name"
                required
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                [(ngModel)]="newChannel.description"
                name="channelDescription"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter channel description"
              ></textarea>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                [(ngModel)]="newChannel.type"
                name="channelType"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                (click)="showCreateChannel = false"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentUser: User | null = null;
  workspaces: Workspace[] = [];
  channels: Channel[] = [];
  selectedWorkspace: Workspace | null = null;
  selectedChannel: Channel | null = null;
  socketConnected = false;

  showCreateWorkspace = false;
  showCreateChannel = false;
  
  newWorkspace = { name: '', description: '' };
  newChannel = { name: '', description: '', type: 'public' as 'public' | 'private' };

  constructor(
    private authService: AuthService,
    private workspaceService: WorkspaceService,
    private socketService: SocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });

    this.socketService.connected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        this.socketConnected = connected;
      });

    this.loadWorkspaces();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getUserInitials(): string {
    if (!this.currentUser?.username) return '';
    return this.currentUser.username.charAt(0).toUpperCase();
  }

  loadWorkspaces(): void {
    this.workspaceService.getWorkspaces()
      .pipe(takeUntil(this.destroy$))
      .subscribe(workspaces => {
        this.workspaces = workspaces;
        if (workspaces.length > 0 && !this.selectedWorkspace) {
          this.selectWorkspace(workspaces[0]);
        }
      });
  }

  selectWorkspace(workspace: Workspace): void {
    this.selectedWorkspace = workspace;
    this.selectedChannel = null;
    this.loadChannels();
  }

  loadChannels(): void {
    if (!this.selectedWorkspace) return;
    
    this.workspaceService.getChannels(this.selectedWorkspace._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(channels => {
        this.channels = channels;
        if (channels.length > 0 && !this.selectedChannel) {
          this.selectChannel(channels[0]);
        }
      });
  }

  selectChannel(channel: Channel): void {
    this.selectedChannel = channel;
    // Navigate to current route with selected channel parameters
    const currentUrl = this.router.url.split('?')[0];
    this.router.navigate([currentUrl], { 
      queryParams: { 
        workspace: this.selectedWorkspace?._id,
        channel: channel._id 
      }
    });
  }

  createWorkspace(): void {
    if (!this.newWorkspace.name.trim()) return;

    this.workspaceService.createWorkspace(this.newWorkspace)
      .pipe(takeUntil(this.destroy$))
      .subscribe(workspace => {
        this.workspaces.push(workspace);
        this.selectWorkspace(workspace);
        this.showCreateWorkspace = false;
        this.newWorkspace = { name: '', description: '' };
      });
  }

  createChannel(): void {
    if (!this.newChannel.name.trim() || !this.selectedWorkspace) return;

    this.workspaceService.createChannel(this.selectedWorkspace._id, this.newChannel)
      .pipe(takeUntil(this.destroy$))
      .subscribe(channel => {
        this.channels.push(channel);
        this.selectChannel(channel);
        this.showCreateChannel = false;
        this.newChannel = { name: '', description: '', type: 'public' };
      });
  }

  logout(): void {
    this.socketService.disconnect();
    this.authService.logout();
  }
}