import { Route } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { HomeComponent } from './pages/home/home.component';
import { authGuard } from './auth/auth-guard'; // <-- Import the guard

export const appRoutes: Route[] = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'home', 
    component: HomeComponent,
    canActivate: [authGuard] // <-- Apply the guard to this route
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];