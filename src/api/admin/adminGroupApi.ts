import { CreateGroupDto, Group, UpdateGroupDto } from '@entities/adminRequest';
import api from '@utils/api';

export const adminGroupApi = {
  getAll: async (): Promise<Group[]> => {
    const response = await api.get<Group[]>('/admin/group');
    return response.data;
  },

  create: async (dto: CreateGroupDto): Promise<Group> => {
    const response = await api.post<Group>('/admin/addgroup', dto);
    return response.data;
  },

  update: async (id: number, dto: UpdateGroupDto): Promise<Group> => {
    const response = await api.put<Group>(`/admin/group/${id}`, dto);
    return response.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/admin/group/${id}`);
  },
};
