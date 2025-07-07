export interface User {
  id: string;
  first_name: string;
  email: string;
  avatar?: string;
  avatar_initial?: string;
  onboarding_complete?: boolean;
  has_notifications_active?: boolean;
  created_at?: string;
} 