export interface User {
  _id: string;
  email: string;
  username: string;
  bio?: string;
  profilePicture?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
  isGoogleUser?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  bio?: string;
  profilePicture?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}