// In apps/client/src/app/pages/login/login.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], // Add FormsModule and RouterModule
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);

  // Object to hold form data
  loginData = {
    email: '',
    password: '',
  };

  // Method to run on form submission
  onSubmit(): void {
    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        console.log('Login successful!', response);
        // Store the token
        localStorage.setItem('access_token', response.access_token);
        this.router.navigate(['/home']); // Redirect to home on success
      },
      error: (err) => {
        console.error('Login failed', err);
        // Here you would typically show an error message to the user
      },
    });
  }
}