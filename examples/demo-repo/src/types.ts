// Example TypeScript types
export type UserId = string;

export interface User {
  id: UserId;
  name: string;
  email: string;
}

export interface AuthService {
  login(credentials: { username: string; password: string }): Promise<User>;
  logout(): Promise<void>;
}
