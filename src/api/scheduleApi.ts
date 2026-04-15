import {
  AddScheduleDto,
  DisciplineShort,
  GroupShort,
  ScheduleDto,
  StudentProfile,
  TeacherProfile,
  TeacherScheduleDto,
  TeacherShort,
  UpcomingScheduleDto,
} from '@entities/scheduleRequest';
import api from '@utils/api';

export const scheduleApi = {
  async getStudentProfile(): Promise<StudentProfile> {
    const { data } = await api.get<StudentProfile>('/student/me');
    return data;
  },

  async getTeacherProfile(): Promise<TeacherProfile> {
    const { data } = await api.get<TeacherProfile>('/teacher/me');
    return data;
  },

  async getStudentSchedule(
    groupId: number,
    limit = 50
  ): Promise<UpcomingScheduleDto[]> {
    const { data } = await api.get<UpcomingScheduleDto[]>(
      `/schedule/${groupId}/student`,
      { params: { limit } }
    );
    return data;
  },

  async getTeacherSchedule(teacherId: number): Promise<TeacherScheduleDto[]> {
    const { data } = await api.get<TeacherScheduleDto[]>(
      `/schedule/${teacherId}/schedules`
    );
    return data;
  },

  async getGroupSchedule(groupId: number): Promise<ScheduleDto[]> {
    const { data } = await api.get<ScheduleDto[]>(`/schedule/group/${groupId}`);
    return data;
  },

  async getAdminGroupSchedule(groupId: number): Promise<ScheduleDto[]> {
    const { data } = await api.get<ScheduleDto[]>(
      `/admin/group/${groupId}/schedules`
    );
    return data;
  },

  async getGroups(): Promise<GroupShort[]> {
    const { data } = await api.get<GroupShort[]>('/admin/group');
    return data;
  },

  async getDisciplines(): Promise<DisciplineShort[]> {
    const { data } = await api.get<DisciplineShort[]>('/schedule/disciplines');
    return data;
  },

  async getTeachers(): Promise<TeacherShort[]> {
    const { data } = await api.get<TeacherShort[]>('/schedule/teachers');
    return data;
  },

  async createSchedule(payload: AddScheduleDto): Promise<void> {
    await api.post('/schedule/add', payload);
  },

  async updateSchedule(id: number, payload: AddScheduleDto): Promise<void> {
    await api.put(`/schedule/${id}`, payload);
  },

  async deleteSchedule(id: number): Promise<void> {
    await api.delete(`/schedule/${id}`);
  },
};
