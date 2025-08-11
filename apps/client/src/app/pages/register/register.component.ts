import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Import FormsModule

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], // Add FormsModule and RouterModule
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  authService = inject(AuthService);
  router = inject(Router);

  // Object to hold form data
  registerData = {
    email: '',
    password: '',
  };

  // Method to run on form submission
  onSubmit(): void {
    this.authService.register(this.registerData).subscribe({
      next: (response) => {
        console.log('Registration successful!', response);
        this.router.navigate(['/login']); // Redirect to login on success
      },
      error: (err) => {
        console.error('Registration failed', err);
      },
    });
  }
}