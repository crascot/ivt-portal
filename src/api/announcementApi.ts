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

  async markAsSeen(announcementId: number, userId: number): Promise<void> {
    await api.post(`/${announcementId}/seen/user/${userId}`);
  },
};
