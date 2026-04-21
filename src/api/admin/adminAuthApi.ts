import { AdminRequest, PendingUsersType } from '@entities/adminRequest';
import api from '@utils/api';

export const adminAuthApi = {
  async getPending(): Promise<PendingUsersType[]> {
    const { data } = await api.get<PendingUsersType[]>('/admin/pending');
    return data;
  },

  async approve(id: number): Promise<void> {
    await api.put(`/admin/approve/${id}`);
  },

  async reject(id: number): Promise<void> {
    await api.put(`/admin/reject/${id}`);
  },

  async me(): Promise<AdminRequest> {
    const { data } = await api.get('/admin/me');
    return data;
  },

  // Сначало закончи с расписанием

  // async getGroupInfo(id: number): Promise<any> {
  //   const { data } = await api.put(`/group/${id}/schedules`);
  //   return data;
  // },
};
