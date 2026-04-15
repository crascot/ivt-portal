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

export type Group = {
  id: number;
  name: string;
  courseNumber: number;
  specialty: string;
};

export type GroupFormValues = {
  name: string;
  courseNumber: number;
  specialty: string;
};

export type CreateGroupDto = {
  name: string;
  courseNumber: number;
  specialty: string;
};

export type UpdateGroupDto = {
  name?: string;
  courseNumber?: number;
  specialty?: string;
  starostaId?: number | null;
};

export type UserShort = {
  id: number;
  fullName: string;
  email: string;
};

export type StudentShort = {
  id: number;
  user: UserShort;
};

export type ResponseGroup = {
  id: number;
  name: string;
  courseNumber: number;
  specialty: string;
  starostaId: number | null;
  starostaName: string | null;
};

export type GroupStudentsResponse = {
  group: ResponseGroup;
  students: StudentShort[];
};

export type Discipline = {
  id: number;
  name: string;
  description: string;
};

export type DisciplineFormValues = {
  name: string;
  description: string;
};

export type CreateDisciplineDto = {
  name: string;
  description: string;
};

export type UpdateDisciplineDto = {
  name: string;
  description: string;
};
