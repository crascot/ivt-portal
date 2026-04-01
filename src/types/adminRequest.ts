import { RoleEnum } from './role-enum';

export type AdminRequest = {
  id: number;
  fullName: string;
  email: string;
  password: string;
  groupName: string;
  status: UserStatus;
  role: RoleEnum;
  enabled: boolean;
};

enum UserStatus {
  PENDING,
  APPROVED,
  REJECTED,
}
