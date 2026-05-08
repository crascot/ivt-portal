import {
  TaskAnalyticsDto,
  TaskDto,
  TaskStatisticsDto,
} from '@entities/taskRequest';
import api from '@utils/api';

export const taskApi = {
  async getTaskStatistics(): Promise<TaskStatisticsDto> {
    const { data } = await api.get<TaskStatisticsDto>('/task/statistics');
    return data;
  },

  async getTaskAnalytics(): Promise<TaskAnalyticsDto> {
    const { data } = await api.get<TaskAnalyticsDto>('/task/analytics');
    return data;
  },

  async getCurrentUserTasks(): Promise<TaskDto[]> {
    const { data } = await api.get<TaskDto[]>('/task/current');
    return data;
  },

  async getTasksByDiscipline(disciplineId: number): Promise<TaskDto[]> {
    const { data } = await api.get<TaskDto[]>(`/task/${disciplineId}`);
    return data;
  },

  async getTaskById(taskId: number): Promise<TaskDto> {
    const { data } = await api.get<TaskDto>(`/task/detail/${taskId}`);
    return data;
  },

  async addTask(
    title: string,
    description: string,
    disciplineId: number,
    createdById: number,
    deadline: string | null,
    files?: File[]
  ): Promise<void> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('disciplineId', String(disciplineId));
    formData.append('createdById', String(createdById));
    if (deadline) {
      formData.append('deadline', deadline);
    }
    if (files?.length) {
      files.forEach((file) => formData.append('files', file));
    }

    await api.post('/task/add', formData);
  },

  async updateTask(
    taskId: number,
    params: {
      title?: string;
      description?: string;
      disciplineId?: number;
      deadline?: string | null;
      files?: File[];
    }
  ): Promise<void> {
    const formData = new FormData();
    if (params.title) formData.append('title', params.title);
    if (params.description) formData.append('description', params.description);
    if (params.disciplineId != null)
      formData.append('disciplineId', String(params.disciplineId));
    if (params.deadline !== undefined)
      formData.append('deadline', params.deadline ?? '');
    if (params.files) {
      params.files.forEach((file) => formData.append('files', file));
    }

    await api.patch(`/task/${taskId}`, formData);
  },

  async deleteTask(taskId: number): Promise<void> {
    await api.delete(`/task/${taskId}`);
  },

  async deleteAttachment(attachmentId: number): Promise<void> {
    await api.delete(`/task/attachments/${attachmentId}`);
  },

  async downloadAttachment(
    attachmentId: number,
    fileName: string
  ): Promise<void> {
    const { data } = await api.get(
      `/task/attachments/${attachmentId}/download`,
      {
        responseType: 'blob',
      }
    );

    const blob = new Blob([data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async getAttachmentBlob(attachmentId: number): Promise<Blob> {
    const { data } = await api.get(
      `/task/attachments/${attachmentId}/download`,
      {
        responseType: 'blob',
      }
    );
    return data;
  },
};
