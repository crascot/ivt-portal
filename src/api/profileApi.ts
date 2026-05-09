import {
  UpdatedProfileDto,
  UpdateProfileRequest,
} from '@entities/profileRequest';
import api from '@utils/api';

export const profileApi = {
  async updateMe(payload: UpdateProfileRequest): Promise<UpdatedProfileDto> {
    const { data } = await api.patch<UpdatedProfileDto>('/profile/me', payload);
    return data;
  },

  async uploadAvatar(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    await api.post('/profile/avatar', formData);
  },

  async getAvatarBlob(): Promise<Blob> {
    const { data } = await api.get<Blob>('/profile/avatar', {
      responseType: 'blob',
    });
    return data;
  },
};
