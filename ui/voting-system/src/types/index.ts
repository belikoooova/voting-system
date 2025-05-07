export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface Voting {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'upcoming';
  startDate: string;
  endDate: string;
  type: 'single' | 'multiple';
  options: string[];
  results?: Record<string, number>;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vote {
  id: string;
  votingId: string;
  userId: string;
  options: string[];
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
} 