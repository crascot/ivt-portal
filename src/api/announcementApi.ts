import api from '@utils/api';
import { AnnouncementDto } from '@entities/announcementRequest';

export const announcementApi = {
  async getForGroupUser(
    groupId: number,
    userId: number
  ): Promise<AnnouncementDto[]> {
    const { data } = await api.get<AnnouncementDto[]>(
      `/group/${groupId}/user/${userId}`
    );
    return data;
  },

  async getHistoryForGroupUser(
    groupId: number,
    userId: number
  ): Promise<AnnouncementDto[]> {
    const { data } = await api.get<AnnouncementDto[]>(
      `/group/${groupId}/user/${userId}/history`
    );
    return data;
  },

  async getLessonRemindersForTeacher(
    teacherId: number,
    userId: number
  ): Promise<AnnouncementDto[]> {
    const { data } = await api.get<AnnouncementDto[]>(
      `/teacher/${teacherId}/user/${userId}/lesson-reminders`
    );
    return data;
  },

  async getLessonReminderHistoryForTeacher(
    teacherId: number,
    userId: number
  ): Promise<AnnouncementDto[]> {
    const { data } = await api.get<AnnouncementDto[]>(
      `/teacher/${teacherId}/user/${userId}/lesson-reminders/history`
    );
    return data;
  },

  async markAsSeen(announcementId: number, userId: number): Promise<void> {
    await api.post(`/${announcementId}/seen/user/${userId}`);
  },
};
