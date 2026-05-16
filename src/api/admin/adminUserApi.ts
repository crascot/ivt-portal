import {
  ManagedUser,
  ManagedUserFilters,
  UpdateManagedUserDto,
} from '@entities/adminRequest';
import api from '@utils/api';

export const adminUserApi = {
  async getAll(filters: ManagedUserFilters = {}): Promise<ManagedUser[]> {
    const { data } = await api.get<ManagedUser[]>('/admin/users', {
      params: {
        search: filters.search?.trim() || undefined,
        role: filters.role || undefined,
        status: filters.status || undefined,
      },
    });
    return data;
  },

  async update(id: number, dto: UpdateManagedUserDto): Promise<ManagedUser> {
    const { data } = await api.patch<ManagedUser>(`/admin/users/${id}`, dto);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/admin/users/${id}`);
  },
};
