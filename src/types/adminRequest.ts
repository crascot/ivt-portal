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

export type PendingUsersType = {
  id: number;
  fullName: string;
  email: string;
  roles: { id: number; name: RoleEnum }[];
  status: string;
};

export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELETED';

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

export type ManagedUser = {
  id: number;
  fullName: string;
  email: string;
  status: UserStatus;
  enabled: boolean;
  confirmed: boolean;
  roles: RoleEnum[];
  primaryRole: RoleEnum | null;
  studentProfileId: number | null;
  groupId: number | null;
  groupName: string | null;
  groupLeader: boolean;
  teacherProfileId: number | null;
  teacherPosition: string | null;
  teacherPhoneNumber: string | null;
  teacherWhatsApp: string | null;
};

export type ManagedUserFilters = {
  search?: string;
  role?: RoleEnum | '';
  status?: UserStatus | '';
};

export type UpdateManagedUserDto = {
  groupId?: number;
  groupLeader?: boolean;
  teacherPosition?: string | null;
};
