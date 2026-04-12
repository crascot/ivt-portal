import {
  CreateDisciplineDto,
  Discipline,
  UpdateDisciplineDto,
} from '@entities/adminRequest';
import api from '@utils/api';

export const adminDisciplineApi = {
  getAll: async (): Promise<Discipline[]> => {
    const response = await api.get<Discipline[]>('/admin/discipline');
    return response.data;
  },

  create: async (dto: CreateDisciplineDto): Promise<Discipline> => {
    const response = await api.post<Discipline>('/admin/adddiscipline', dto);
    return response.data;
  },

  update: async (id: number, dto: UpdateDisciplineDto): Promise<Discipline> => {
    const response = await api.put<Discipline>(`/admin/discipline/${id}`, dto);
    return response.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/admin/discipline/${id}`);
  },
};
