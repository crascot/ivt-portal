import {
  TeacherDetailDto,
  TeacherDirectoryItemDto,
} from '@entities/teacherRequest';
import api from '@utils/api';

export const teacherDirectoryApi = {
  async getTeachers(): Promise<TeacherDirectoryItemDto[]> {
    const { data } = await api.get<TeacherDirectoryItemDto[]>('/teachers');
    return data;
  },

  async getTeacher(teacherId: number): Promise<TeacherDetailDto> {
    const { data } = await api.get<TeacherDetailDto>(`/teachers/${teacherId}`);
    return data;
  },

  async getTeacherAvatarBlob(teacherId: number): Promise<Blob> {
    const { data } = await api.get<Blob>(`/teachers/${teacherId}/avatar`, {
      responseType: 'blob',
    });
    return data;
  },
};
