export type UserType = 'user' | 'mop';

export interface User {
  id: string;
  name: string;
  type: UserType;
  identifier: string;
  email?: string;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

