export type LoginRequest = {
  email: string;
  password: string;
};

type RegisterBaseRequest = {
  fullName: string;
  email: string;
  password: string;
};

export type RegisterStudentRequest = RegisterBaseRequest & {
  groupId: number;
};

export type RegisterTeacherRequest = RegisterBaseRequest & {
  position: string;
};

export type GroupDto = {
  id: number;
  name: string;
};
