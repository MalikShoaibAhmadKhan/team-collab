import { Route } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./welcome/welcome.component').then(m => m.WelcomeComponent)
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'chat',
        pathMatch: 'full'
      },
      {
        path: 'chat',
        loadComponent: () => import('./dashboard/chat/chat.component').then(m => m.ChatComponent)
      },
      {
        path: 'tasks',
        loadComponent: () => import('./dashboard/tasks/tasks.component').then(m => m.TasksComponent)
      },
      {
        path: 'notes',
        loadComponent: () => import('./dashboard/notes/notes.component').then(m => m.NotesComponent)
      }
    ]
  },
  // Legacy routes for backward compatibility
  { path: 'login', redirectTo: '/auth/login' },
  { path: 'register', redirectTo: '/auth/register' },
  { path: 'home', redirectTo: '/dashboard' },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];