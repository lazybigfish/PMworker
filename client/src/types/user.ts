export interface User {
  id: number;
  username: string;
  real_name?: string;
  avatar_url?: string;
  email?: string;
  role?: string;
}

export interface Permission {
  code: string;
  name: string;
}
