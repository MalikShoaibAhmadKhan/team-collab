import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { Task, KanbanBoard, CreateTaskRequest } from '../../models/task.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-gray-900">Tasks</h1>
            <p class="text-sm text-gray-500">Manage your team's tasks</p>
          </div>
          <button
            (click)="showCreateTask = true"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            New Task
          </button>
        </div>
      </div>

      <!-- Kanban Board -->
      <div class="flex-1 overflow-x-auto p-6">
        <div *ngIf="!channelId" class="flex items-center justify-center h-full">
          <div class="text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No channel selected</h3>
            <p class="mt-1 text-sm text-gray-500">Select a channel from the sidebar to manage tasks.</p>
          </div>
        </div>
        <div class="flex space-x-6 h-full min-w-max">
          <!-- Todo Column -->
          <div class="flex-shrink-0 w-80">
            <div class="bg-gray-50 rounded-lg h-full flex flex-col">
              <div class="p-4 border-b border-gray-200">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-medium text-gray-900">To Do</h3>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {{ kanbanBoard.todo.length }}
                  </span>
                </div>
              </div>
              <div class="flex-1 p-4 space-y-3 overflow-y-auto">
                <div
                  *ngFor="let task of kanbanBoard.todo; trackBy: trackByTaskId"
                  class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                  (click)="selectTask(task)"
                >
                  <div class="flex items-start justify-between">
                    <h4 class="text-sm font-medium text-gray-900 mb-2">{{ task.title }}</h4>
                    <div class="flex items-center space-x-1">
                      <span
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        [ngClass]="getPriorityClass(task.priority)"
                      >
                        {{ task.priority }}
                      </span>
                    </div>
                  </div>
                  <p class="text-xs text-gray-600 mb-3 line-clamp-2">{{ task.description }}</p>
                  
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                      <div *ngIf="task.assignedTo" class="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                        <span class="text-xs font-medium text-white">
                          {{ getAssigneeInitials(task.assignedTo) }}
                        </span>
                      </div>
                      <div *ngIf="task.dueDate" class="flex items-center text-xs text-gray-500">
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        {{ formatDate(task.dueDate) }}
                      </div>
                    </div>
                    <div class="flex flex-wrap gap-1">
                      <span
                        *ngFor="let tag of task.tags.slice(0, 2)"
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {{ tag }}
                      </span>
                      <span *ngIf="task.tags.length > 2" class="text-xs text-gray-500">
                        +{{ task.tags.length - 2 }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- In Progress Column -->
          <div class="flex-shrink-0 w-80">
            <div class="bg-yellow-50 rounded-lg h-full flex flex-col">
              <div class="p-4 border-b border-yellow-200">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-medium text-gray-900">In Progress</h3>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {{ kanbanBoard.inProgress.length }}
                  </span>
                </div>
              </div>
              <div class="flex-1 p-4 space-y-3 overflow-y-auto">
                <div
                  *ngFor="let task of kanbanBoard.inProgress; trackBy: trackByTaskId"
                  class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                  (click)="selectTask(task)"
                >
                  <div class="flex items-start justify-between">
                    <h4 class="text-sm font-medium text-gray-900 mb-2">{{ task.title }}</h4>
                    <div class="flex items-center space-x-1">
                      <span
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        [ngClass]="getPriorityClass(task.priority)"
                      >
                        {{ task.priority }}
                      </span>
                    </div>
                  </div>
                  <p class="text-xs text-gray-600 mb-3 line-clamp-2">{{ task.description }}</p>
                  
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                      <div *ngIf="task.assignedTo" class="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                        <span class="text-xs font-medium text-white">
                          {{ getAssigneeInitials(task.assignedTo) }}
                        </span>
                      </div>
                      <div *ngIf="task.dueDate" class="flex items-center text-xs text-gray-500">
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"></path>
                        </svg>
                        {{ formatDate(task.dueDate) }}
                      </div>
                    </div>
                    <div class="flex flex-wrap gap-1">
                      <span
                        *ngFor="let tag of task.tags.slice(0, 2)"
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {{ tag }}
                      </span>
                      <span *ngIf="task.tags.length > 2" class="text-xs text-gray-500">
                        +{{ task.tags.length - 2 }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Done Column -->
          <div class="flex-shrink-0 w-80">
            <div class="bg-green-50 rounded-lg h-full flex flex-col">
              <div class="p-4 border-b border-green-200">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-medium text-gray-900">Done</h3>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {{ kanbanBoard.done.length }}
                  </span>
                </div>
              </div>
              <div class="flex-1 p-4 space-y-3 overflow-y-auto">
                <div
                  *ngFor="let task of kanbanBoard.done; trackBy: trackByTaskId"
                  class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow opacity-75"
                  (click)="selectTask(task)"
                >
                  <div class="flex items-start justify-between">
                    <h4 class="text-sm font-medium text-gray-900 mb-2 line-through">{{ task.title }}</h4>
                    <div class="flex items-center space-x-1">
                      <span
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        [ngClass]="getPriorityClass(task.priority)"
                      >
                        {{ task.priority }}
                      </span>
                    </div>
                  </div>
                  <p class="text-xs text-gray-600 mb-3 line-clamp-2">{{ task.description }}</p>
                  
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                      <div *ngIf="task.assignedTo" class="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                        <span class="text-xs font-medium text-white">
                          {{ getAssigneeInitials(task.assignedTo) }}
                        </span>
                      </div>
                      <div *ngIf="task.dueDate" class="flex items-center text-xs text-gray-500">
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"></path>
                        </svg>
                        {{ formatDate(task.dueDate) }}
                      </div>
                    </div>
                    <div class="flex flex-wrap gap-1">
                      <span
                        *ngFor="let tag of task.tags.slice(0, 2)"
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {{ tag }}
                      </span>
                      <span *ngIf="task.tags.length > 2" class="text-xs text-gray-500">
                        +{{ task.tags.length - 2 }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Task Modal -->
    <div *ngIf="showCreateTask" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Create New Task</h3>
          <form (ngSubmit)="createTask()">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                [(ngModel)]="newTask.title"
                name="taskTitle"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter task title"
                required
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                [(ngModel)]="newTask.description"
                name="taskDescription"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter task description"
              ></textarea>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                [(ngModel)]="newTask.priority"
                name="taskPriority"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
              <input
                type="date"
                [(ngModel)]="newTask.dueDate"
                name="taskDueDate"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
              <input
                type="text"
                [(ngModel)]="tagsInput"
                name="taskTags"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. frontend, urgent, bug"
              />
            </div>
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                (click)="showCreateTask = false"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Task Detail Modal -->
    <div *ngIf="selectedTask" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-10 mx-auto p-5 border w-2/3 max-w-4xl shadow-lg rounded-md bg-white">
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-lg font-medium text-gray-900">{{ selectedTask.title }}</h3>
          <button
            (click)="selectedTask = null"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="grid grid-cols-2 gap-6">
          <div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <p class="text-sm text-gray-600">{{ selectedTask.description || 'No description' }}</p>
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                [(ngModel)]="selectedTask.status"
                (change)="updateTaskStatus(selectedTask)"
                class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <span
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                [ngClass]="getPriorityClass(selectedTask.priority)"
              >
                {{ selectedTask.priority }}
              </span>
            </div>
            
            <div class="mb-4" *ngIf="selectedTask.dueDate">
              <label class="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
              <p class="text-sm text-gray-600">{{ formatDate(selectedTask.dueDate) }}</p>
            </div>
            
            <div class="mb-4" *ngIf="selectedTask.tags.length > 0">
              <label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div class="flex flex-wrap gap-2">
                <span
                  *ngFor="let tag of selectedTask.tags"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Activity Log</label>
              <div class="max-h-64 overflow-y-auto space-y-2">
                <div
                  *ngFor="let activity of selectedTask.activityLog"
                  class="flex items-start space-x-2 text-sm"
                >
                  <div class="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p class="text-gray-600">{{ activity.details }}</p>
                    <p class="text-xs text-gray-400">{{ formatDateTime(activity.timestamp) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TasksComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  kanbanBoard: KanbanBoard = {
    todo: [],
    inProgress: [],
    done: []
  };
  
  channelId = '';
  currentUser: User | null = null;
  selectedTask: Task | null = null;
  showCreateTask = false;
  
  newTask: CreateTaskRequest = {
    title: '',
    description: '',
    priority: 'medium',
    channelId: '',
    dueDate: '',
    tags: []
  };
  
  tagsInput = '';

  constructor(
    private taskService: TaskService,
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
        if (params['channel']) {
          this.channelId = params['channel'];
          this.newTask.channelId = this.channelId;
          this.loadTasks();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTasks(): void {
    if (!this.channelId) {
      // Show empty board if no channel selected
      this.kanbanBoard = { todo: [], inProgress: [], done: [] };
      return;
    }

    this.taskService.getChannelTasks(this.channelId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (board) => {
          this.kanbanBoard = board;
        },
        error: (error) => {
          console.error('Error loading tasks:', error);
          this.kanbanBoard = { todo: [], inProgress: [], done: [] };
        }
      });
  }

  createTask(): void {
    if (!this.newTask.title.trim()) return;

    // Parse tags
    this.newTask.tags = this.tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    this.taskService.createTask(this.newTask)
      .pipe(takeUntil(this.destroy$))
      .subscribe(task => {
        this.kanbanBoard.todo.push(task);
        this.showCreateTask = false;
        this.resetNewTask();
      });
  }

  selectTask(task: Task): void {
    this.selectedTask = task;
  }

  updateTaskStatus(task: Task): void {
    this.taskService.moveTask(task._id, task.status, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe(updatedTask => {
        // Remove from current column
        this.removeTaskFromBoard(task._id);
        
        // Add to new column
        switch (updatedTask.status) {
          case 'todo':
            this.kanbanBoard.todo.push(updatedTask);
            break;
          case 'in_progress':
            this.kanbanBoard.inProgress.push(updatedTask);
            break;
          case 'done':
            this.kanbanBoard.done.push(updatedTask);
            break;
        }
        
        this.selectedTask = updatedTask;
      });
  }

  private removeTaskFromBoard(taskId: string): void {
    this.kanbanBoard.todo = this.kanbanBoard.todo.filter(t => t._id !== taskId);
    this.kanbanBoard.inProgress = this.kanbanBoard.inProgress.filter(t => t._id !== taskId);
    this.kanbanBoard.done = this.kanbanBoard.done.filter(t => t._id !== taskId);
  }

  private resetNewTask(): void {
    this.newTask = {
      title: '',
      description: '',
      priority: 'medium',
      channelId: this.channelId,
      dueDate: '',
      tags: []
    };
    this.tagsInput = '';
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getAssigneeInitials(assignedTo: string | User): string {
    if (typeof assignedTo === 'object') {
      return assignedTo.username.charAt(0).toUpperCase();
    }
    return '?';
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString();
  }

  trackByTaskId(index: number, task: Task): string {
    return task._id;
  }
}