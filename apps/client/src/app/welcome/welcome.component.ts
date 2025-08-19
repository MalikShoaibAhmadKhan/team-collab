import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div class="container mx-auto px-4 py-16">
        <div class="text-center">
          <h1 class="text-6xl font-bold text-white mb-6">
            Team Collaboration
          </h1>
          <p class="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            A modern real-time workspace where teams can collaborate via messaging, tasks, meetings, and notes. 
            Like Slack + Trello + Notion combined.
          </p>
          
          <div class="flex justify-center space-x-6">
            <a
              routerLink="/auth/login"
              class="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-indigo-600 bg-white hover:bg-gray-50 transition-colors shadow-lg"
            >
              Sign In
            </a>
            <a
              routerLink="/auth/register"
              class="inline-flex items-center px-8 py-4 border-2 border-white text-lg font-medium rounded-lg text-white hover:bg-white hover:text-indigo-600 transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
        
        <div class="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">Real-Time Chat</h3>
            <p class="text-white/80">Instant messaging with channels, reactions, and file sharing</p>
          </div>
          
          <div class="text-center">
            <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">Task Management</h3>
            <p class="text-white/80">Kanban boards with drag & drop, assignments, and due dates</p>
          </div>
          
          <div class="text-center">
            <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">Collaborative Notes</h3>
            <p class="text-white/80">Shared notes with real-time editing and version history</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class WelcomeComponent {}