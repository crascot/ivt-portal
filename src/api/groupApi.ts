import { GroupRequest } from '@entities/groupRequest';
import api from '@utils/api';

export const groupApi = {
  getAll: async (): Promise<GroupRequest[]> => {
    const response = await api.get<GroupRequest[]>('/auth/getgroup');
    return response.data;
  },
};
