export interface User {
  id: string;
  name: string;
  first_name: string;
  email: string;
  avatar?: string;
  friends: string[];
  online: boolean;
  createdAt: string;
  updatedAt: string;
} 