import { User } from '../types/user';

// Mock user data
export const mockUser: User = {
  id: 'mock-user-id',
  name: 'John Doe',
  first_name: 'John',
  email: 'john@example.com',
  avatar: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock authentication functions
export const mockAuth = {
  getUser: async () => ({
    data: { user: mockUser },
    error: null,
  }),
  signUp: async () => ({
    data: { user: mockUser },
    error: null,
  }),
  signIn: async () => ({
    data: { user: mockUser },
    error: null,
  }),
  signOut: async () => ({
    error: null,
  }),
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    // Simulate immediate sign in
    callback('SIGNED_IN', { user: mockUser });
    return {
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    };
  },
};

// Mock Supabase client
export const mockSupabase = {
  auth: mockAuth,
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({
          data: mockUser,
          error: null,
        }),
      }),
    }),
    insert: () => ({
      select: () => ({
        single: async () => ({
          data: mockUser,
          error: null,
        }),
      }),
    }),
    update: () => ({
      eq: () => ({
        select: () => ({
          single: async () => ({
            data: mockUser,
            error: null,
          }),
        }),
      }),
    }),
    delete: () => ({
      eq: () => ({
        select: () => ({
          single: async () => ({
            data: mockUser,
            error: null,
          }),
        }),
      }),
    }),
  }),
}; 