import { User, UserId } from './types';

const auth = {
  async login(credentials: { username: string; password: string }): Promise<User> {
    // Simulate API call
    return {
      id: '123' as UserId,
      name: 'Test User',
      email: credentials.username,
    };
  },

  async logout(): Promise<void> {
    // Simulate logout
  },
};

export async function authenticateUser(username: string, password: string): Promise<User> {
  return await auth.login({ username, password });
}

export default auth;
