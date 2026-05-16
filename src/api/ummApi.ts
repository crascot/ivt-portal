import {
  DepartmentMethodicalCreatePayload,
  DepartmentMethodicalMaterialDto,
  DepartmentMethodicalMaterialShortDto,
  DepartmentMethodicalUpdatePayload,
  UmmCreatePayload,
  UmmDisciplineStatDto,
  UmmMaterialDto,
  UmmMaterialKind,
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
  materialKind?: UmmMaterialKind | null;
  section?: string | null;
};

type MethodicalListParams = {
  disciplineId?: number | null;
  search?: string;
};

const toMethodicalFormData = (
  payload: DepartmentMethodicalCreatePayload | DepartmentMethodicalUpdatePayload
) => {
  const formData = new FormData();
  if (payload.title != null) formData.append('title', payload.title);
  if (payload.description !== undefined) {
    formData.append('description', payload.description ?? '');
  }
  if (payload.disciplineId != null) {
    formData.append('disciplineId', String(payload.disciplineId));
  }
  payload.urls?.forEach((url) => {
    if (url.trim()) formData.append('urls', url.trim());
  });
  payload.files?.forEach((file) => formData.append('files', file));

  return formData;
};

export const ummApi = {
  async getDisciplineStats(): Promise<UmmDisciplineStatDto[]> {
    const { data } = await api.get<UmmDisciplineStatDto[]>(
      '/umm/meta/discipline-stats'
    );
    return data;
  },

  async getSectionsForDiscipline(disciplineId: number): Promise<string[]> {
    const { data } = await api.get<string[]>('/umm/meta/sections', {
      params: { disciplineId },
    });
    return data;
  },

  async getMethodicalCount(): Promise<number> {
    const { data } = await api.get<number>('/umm/methodical/count');
    return data;
  },

  async listMethodicals(
    params: MethodicalListParams = {}
  ): Promise<DepartmentMethodicalMaterialShortDto[]> {
    const { data } = await api.get<DepartmentMethodicalMaterialShortDto[]>(
      '/umm/methodical',
      {
        params: {
          disciplineId: params.disciplineId ?? undefined,
          search: params.search?.trim() ? params.search.trim() : undefined,
        },
      }
    );
    return data;
  },

  async getMethodicalById(
    id: number
  ): Promise<DepartmentMethodicalMaterialDto> {
    const { data } = await api.get<DepartmentMethodicalMaterialDto>(
      `/umm/methodical/${id}`
    );
    return data;
  },

  async createMethodical(
    payload: DepartmentMethodicalCreatePayload
  ): Promise<DepartmentMethodicalMaterialDto> {
    const { data } = await api.post<DepartmentMethodicalMaterialDto>(
      '/umm/methodical',
      toMethodicalFormData(payload)
    );
    return data;
  },

  async updateMethodical(
    id: number,
    payload: DepartmentMethodicalUpdatePayload
  ): Promise<DepartmentMethodicalMaterialDto> {
    const formData = toMethodicalFormData(payload);
    if (payload.disciplineId === null) {
      formData.append('clearDiscipline', 'true');
    }

    const { data } = await api.patch<DepartmentMethodicalMaterialDto>(
      `/umm/methodical/${id}`,
      formData
    );
    return data;
  },

  async deleteMethodical(id: number): Promise<void> {
    await api.delete(`/umm/methodical/${id}`);
  },

  async removeMethodicalUrl(id: number, url: string): Promise<void> {
    await api.delete(`/umm/methodical/${id}/urls`, { params: { url } });
  },

  async deleteMethodicalAttachment(attachmentId: number): Promise<void> {
    await api.delete(`/umm/methodical/attachments/${attachmentId}`);
  },

  async downloadMethodicalAttachment(
    attachmentId: number,
    fileName: string
  ): Promise<void> {
    const { data } = await api.get<Blob>(
      `/umm/methodical/attachments/${attachmentId}/download`,
      { responseType: 'blob' }
    );
    triggerDownload(data, fileName);
  },

  async getMethodicalAttachmentBlob(attachmentId: number): Promise<Blob> {
    const { data } = await api.get<Blob>(
      `/umm/methodical/attachments/${attachmentId}/download`,
      { responseType: 'blob' }
    );
    return data;
  },

  async list(params: ListParams = {}): Promise<UmmMaterialShortDto[]> {
    const { data } = await api.get<UmmMaterialShortDto[]>('/umm', {
      params: {
        disciplineId: params.disciplineId ?? undefined,
        authorId: params.authorId ?? undefined,
        search: params.search?.trim() ? params.search.trim() : undefined,
        materialKind: params.materialKind ?? undefined,
        section: params.section?.trim() ? params.section.trim() : undefined,
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
    formData.append('materialKind', payload.materialKind);
    if (payload.section?.trim()) {
      formData.append('section', payload.section.trim());
    }
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
    if (payload.materialKind != null)
      formData.append('materialKind', payload.materialKind);
    if (payload.section !== undefined) {
      formData.append('section', payload.section ?? '');
    }
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
