import {
  CreateGroupDto,
  Group,
  GroupStudentsResponse,
  UpdateGroupDto,
} from '@entities/adminRequest';
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

  getGroupStudents: async (groupId: number): Promise<GroupStudentsResponse> => {
    const response = await api.get<GroupStudentsResponse>(
      `/admin/group/${groupId}`
    );
    return response.data;
  },

  setStarosta: async (groupId: number, starostaId: number): Promise<void> => {
    await api.put(`/admin/group/${groupId}`, { starostaId });
  },

  removeStarosta: async (groupId: number): Promise<void> => {
    await api.put(`/admin/group/${groupId}`, { starostaId: 0 });
  },
};
