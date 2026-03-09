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

export enum RoleEnum {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN',
  GROUP_LEADER = 'GROUP_LEADER',
}

export interface AuthResponse {
  token: string;
}
