export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  fullName: string;
  email: string;
  password: string;
  groupname?: string;
  role?: string;
};

export interface AuthResponse {
  token: string;
}
