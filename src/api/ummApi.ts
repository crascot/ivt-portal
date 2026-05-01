import {
  UmmCreatePayload,
  UmmMaterialDto,
  UmmMaterialShortDto,
  UmmUpdatePayload,
} from '@entities/ummRequest';
import api from '@utils/api';

const triggerDownload = (data: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

type ListParams = {
  disciplineId?: number | null;
  authorId?: number | null;
  search?: string;
};

export const ummApi = {
  async list(params: ListParams = {}): Promise<UmmMaterialShortDto[]> {
    const { data } = await api.get<UmmMaterialShortDto[]>('/umm', {
      params: {
        disciplineId: params.disciplineId ?? undefined,
        authorId: params.authorId ?? undefined,
        search: params.search?.trim() ? params.search.trim() : undefined,
      },
    });
    return data;
  },

  async getById(id: number): Promise<UmmMaterialDto> {
    const { data } = await api.get<UmmMaterialDto>(`/umm/${id}`);
    return data;
  },

  async create(payload: UmmCreatePayload): Promise<UmmMaterialDto> {
    const formData = new FormData();
    formData.append('title', payload.title);
    if (payload.description)
      formData.append('description', payload.description);
    formData.append('disciplineId', String(payload.disciplineId));
    formData.append('authorId', String(payload.authorId));
    payload.urls.forEach((url) => {
      if (url.trim()) formData.append('urls', url.trim());
    });
    payload.files.forEach((file) => formData.append('files', file));

    const { data } = await api.post<UmmMaterialDto>('/umm', formData);
    return data;
  },

  async update(id: number, payload: UmmUpdatePayload): Promise<UmmMaterialDto> {
    const formData = new FormData();
    if (payload.title != null) formData.append('title', payload.title);
    if (payload.description !== undefined)
      formData.append('description', payload.description ?? '');
    if (payload.disciplineId != null)
      formData.append('disciplineId', String(payload.disciplineId));
    payload.urls?.forEach((url) => {
      if (url.trim()) formData.append('urls', url.trim());
    });
    payload.files?.forEach((file) => formData.append('files', file));

    const { data } = await api.patch<UmmMaterialDto>(`/umm/${id}`, formData);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/umm/${id}`);
  },

  async removeUrl(id: number, url: string): Promise<void> {
    await api.delete(`/umm/${id}/urls`, { params: { url } });
  },

  async deleteAttachment(attachmentId: number): Promise<void> {
    await api.delete(`/umm/attachments/${attachmentId}`);
  },

  async downloadAttachment(
    attachmentId: number,
    fileName: string
  ): Promise<void> {
    const { data } = await api.get<Blob>(
      `/umm/attachments/${attachmentId}/download`,
      { responseType: 'blob' }
    );
    triggerDownload(data, fileName);
  },
};
