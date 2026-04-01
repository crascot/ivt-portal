import { AdminRequest } from '@entities/adminRequest';
import api from '@utils/api';

export const adminApi = {
  async getPending(): Promise<AdminRequest[]> {
    const { data } = await api.get<AdminRequest[]>('/admin/pending');
    return data;
  },

  async approve(id: number): Promise<void> {
    await api.put(`/admin/approve/${id}`);
  },

  async reject(id: number): Promise<void> {
    await api.put(`/admin/reject/${id}`);
  },
};
