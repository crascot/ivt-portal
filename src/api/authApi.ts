import {
  LoginRequest,
  RegisterStudentRequest,
  RegisterTeacherRequest,
} from '@entities/authRequest';
import api from '@utils/api';

type AuthResponse = {
  token?: string;
};

type VoidResponse = {
  response: string;
};

export const authApi = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  async registerStudent(
    payload: RegisterStudentRequest
  ): Promise<VoidResponse> {
    const { data } = await api.post<VoidResponse>(
      '/auth/register/student',
      payload
    );
    return data;
  },

  async registerTeacher(
    payload: RegisterTeacherRequest
  ): Promise<VoidResponse> {
    const { data } = await api.post<VoidResponse>(
      '/auth/register/teacher',
      payload
    );
    return data;
  },
};
