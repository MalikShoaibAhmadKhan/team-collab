import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NoteService } from '../../services/note.service';
import { AuthService } from '../../services/auth.service';
import { Note, CreateNoteRequest } from '../../models/note.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex h-full">
      <!-- Notes List -->
      <div class="w-1/3 border-r border-gray-200 bg-white">
        <div class="p-4 border-b border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-medium text-gray-900">Notes</h2>
            <button
              (click)="showCreateNote = true"
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              New Note
            </button>
          </div>
          
          <!-- Search -->
          <div class="relative">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="searchNotes()"
              placeholder="Search notes..."
              class="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
        
        <!-- Notes List -->
        <div class="overflow-y-auto h-full">
          <div class="p-4 space-y-3">
            <div
              *ngFor="let note of filteredNotes; trackBy: trackByNoteId"
              class="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              [class.bg-indigo-50]="selectedNote?._id === note._id"
              [class.border-indigo-200]="selectedNote?._id === note._id"
              (click)="selectNote(note)"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2 mb-1">
                    <h3 class="text-sm font-medium text-gray-900 truncate">{{ note.title }}</h3>
                    <svg *ngIf="note.isPinned" class="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  </div>
                  <p class="text-xs text-gray-600 line-clamp-2 mb-2">{{ getPreview(note.content) }}</p>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-500">{{ formatDate(note.updatedAt) }}</span>
                    <div class="flex flex-wrap gap-1">
                      <span
                        *ngFor="let tag of note.tags.slice(0, 2)"
                        class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {{ tag }}
                      </span>
                      <span *ngIf="note.tags.length > 2" class="text-xs text-gray-400">
                        +{{ note.tags.length - 2 }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Note Editor -->
      <div class="flex-1 flex flex-col">
        <div *ngIf="!selectedNote" class="flex-1 flex items-center justify-center bg-gray-50">
          <div class="text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No note selected</h3>
            <p class="mt-1 text-sm text-gray-500">Select a note from the list to view and edit it.</p>
          </div>
        </div>

        <div *ngIf="selectedNote" class="flex-1 flex flex-col">
          <!-- Note Header -->
          <div class="bg-white border-b border-gray-200 px-6 py-4">
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <input
                  type="text"
                  [(ngModel)]="selectedNote.title"
                  (blur)="saveNote()"
                  class="text-xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                  placeholder="Untitled Note"
                />
                <div class="flex items-center space-x-4 mt-2">
                  <span class="text-sm text-gray-500">
                    Last updated {{ formatDateTime(selectedNote.updatedAt) }}
                  </span>
                  <div class="flex items-center space-x-2">
                    <button
                      (click)="togglePin()"
                      class="text-gray-400 hover:text-yellow-500"
                      [class.text-yellow-500]="selectedNote.isPinned"
                      title="Pin note"
                    >
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    </button>
                    <button
                      (click)="showNoteDetails = true"
                      class="text-gray-400 hover:text-gray-600"
                      title="Note details"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Note Content -->
          <div class="flex-1 p-6">
            <textarea
              [(ngModel)]="selectedNote.content"
              (input)="onContentChange()"
              (blur)="saveNote()"
              class="w-full h-full resize-none border-none focus:outline-none focus:ring-0 text-gray-700 leading-relaxed"
              placeholder="Start writing your note..."
            ></textarea>
          </div>

          <!-- Tags -->
          <div class="bg-white border-t border-gray-200 px-6 py-3">
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-500">Tags:</span>
              <div class="flex flex-wrap gap-2">
                <span
                  *ngFor="let tag of selectedNote.tags"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {{ tag }}
                  <button
                    (click)="removeTag(tag)"
                    class="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </span>
                <input
                  type="text"
                  [(ngModel)]="newTag"
                  (keydown.enter)="addTag()"
                  (blur)="addTag()"
                  placeholder="Add tag..."
                  class="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Note Modal -->
    <div *ngIf="showCreateNote" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Create New Note</h3>
          <form (ngSubmit)="createNote()">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                [(ngModel)]="newNote.title"
                name="noteTitle"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter note title"
                required
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Content</label>
              <textarea
                [(ngModel)]="newNote.content"
                name="noteContent"
                rows="5"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Start writing your note..."
              ></textarea>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
              <input
                type="text"
                [(ngModel)]="newNoteTagsInput"
                name="noteTags"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. meeting, ideas, important"
              />
            </div>
            <div class="mb-4">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  [(ngModel)]="newNote.isPinned"
                  name="notePinned"
                  class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <span class="ml-2 text-sm text-gray-700">Pin this note</span>
              </label>
            </div>
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                (click)="showCreateNote = false"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Create Note
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Note Details Modal -->
    <div *ngIf="showNoteDetails && selectedNote" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-10 mx-auto p-5 border w-2/3 max-w-4xl shadow-lg rounded-md bg-white">
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-lg font-medium text-gray-900">Note Details</h3>
          <button
            (click)="showNoteDetails = false"
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
              <label class="block text-sm font-medium text-gray-700 mb-2">Created By</label>
              <p class="text-sm text-gray-600">{{ getCreatorName(selectedNote.createdBy) }}</p>
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Created</label>
              <p class="text-sm text-gray-600">{{ formatDateTime(selectedNote.createdAt) }}</p>
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Last Updated</label>
              <p class="text-sm text-gray-600">{{ formatDateTime(selectedNote.updatedAt) }}</p>
            </div>
            
            <div class="mb-4" *ngIf="selectedNote.tags.length > 0">
              <label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div class="flex flex-wrap gap-2">
                <span
                  *ngFor="let tag of selectedNote.tags"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Revision History</label>
              <div class="max-h-64 overflow-y-auto space-y-2">
                <div
                  *ngFor="let revision of selectedNote.revisionHistory"
                  class="flex items-start space-x-2 text-sm"
                >
                  <div class="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p class="text-gray-600">{{ revision.changes }}</p>
                    <p class="text-xs text-gray-400">{{ formatDateTime(revision.timestamp) }}</p>
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
export class NotesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private saveTimeout: any;
  
  notes: Note[] = [];
  filteredNotes: Note[] = [];
  selectedNote: Note | null = null;
  searchQuery = '';
  workspaceId = '';
  currentUser: User | null = null;
  
  showCreateNote = false;
  showNoteDetails = false;
  newTag = '';
  
  newNote: CreateNoteRequest = {
    title: '',
    content: '',
    workspaceId: '',
    tags: []
  };
  
  newNoteTagsInput = '';

  constructor(
    private noteService: NoteService,
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
        if (params['workspace']) {
          this.workspaceId = params['workspace'];
          this.newNote.workspaceId = this.workspaceId;
          this.loadNotes();
        }
      });
  }

  ngOnDestroy(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadNotes(): void {
    if (!this.workspaceId) {
      this.notes = [];
      this.filteredNotes = [];
      return;
    }

    this.noteService.getWorkspaceNotes(this.workspaceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notes) => {
          this.notes = notes.sort((a, b) => {
            // Sort by pinned first, then by updated date
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          });
          this.filteredNotes = [...this.notes];
          
          if (this.notes.length > 0 && !this.selectedNote) {
            this.selectNote(this.notes[0]);
          }
        },
        error: (error) => {
          console.error('Error loading notes:', error);
          this.notes = [];
          this.filteredNotes = [];
        }
      });
  }

  selectNote(note: Note): void {
    this.selectedNote = { ...note };
  }

  createNote(): void {
    if (!this.newNote.title.trim()) return;

    // Parse tags
    this.newNote.tags = this.newNoteTagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    this.noteService.createNote(this.newNote)
      .pipe(takeUntil(this.destroy$))
      .subscribe(note => {
        this.notes.unshift(note);
        this.filteredNotes = [...this.notes];
        this.selectNote(note);
        this.showCreateNote = false;
        this.resetNewNote();
      });
  }

  saveNote(): void {
    if (!this.selectedNote) return;

    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Debounce save
    this.saveTimeout = setTimeout(() => {
      this.noteService.updateNote(this.selectedNote!._id, {
        title: this.selectedNote!.title,
        content: this.selectedNote!.content,
        tags: this.selectedNote!.tags,
        isPinned: this.selectedNote!.isPinned
      }).pipe(takeUntil(this.destroy$))
      .subscribe(updatedNote => {
        // Update the note in the list
        const index = this.notes.findIndex(n => n._id === updatedNote._id);
        if (index !== -1) {
          this.notes[index] = updatedNote;
          this.filteredNotes = [...this.notes];
        }
        this.selectedNote = updatedNote;
      });
    }, 1000);
  }

  onContentChange(): void {
    // Auto-save trigger
    this.saveNote();
  }

  togglePin(): void {
    if (!this.selectedNote) return;
    
    this.selectedNote.isPinned = !this.selectedNote.isPinned;
    this.saveNote();
  }

  addTag(): void {
    if (!this.newTag.trim() || !this.selectedNote) return;
    
    const tag = this.newTag.trim().toLowerCase();
    if (!this.selectedNote.tags.includes(tag)) {
      this.selectedNote.tags.push(tag);
      this.saveNote();
    }
    this.newTag = '';
  }

  removeTag(tag: string): void {
    if (!this.selectedNote) return;
    
    this.selectedNote.tags = this.selectedNote.tags.filter(t => t !== tag);
    this.saveNote();
  }

  searchNotes(): void {
    if (!this.searchQuery.trim()) {
      this.filteredNotes = [...this.notes];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredNotes = this.notes.filter(note =>
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  private resetNewNote(): void {
    this.newNote = {
      title: '',
      content: '',
      workspaceId: this.workspaceId,
      tags: []
    };
    this.newNoteTagsInput = '';
  }

  getPreview(content: string): string {
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  }

  getCreatorName(createdBy: string | User): string {
    if (typeof createdBy === 'object') {
      return createdBy.username;
    }
    return 'Unknown User';
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString();
  }

  trackByNoteId(index: number, note: Note): string {
    return note._id;
  }
}