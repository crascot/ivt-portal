import { DisciplineShort } from '@entities/scheduleRequest';
import { CreateTaskDto, TaskDiscipline, TaskDto } from '@entities/taskRequest';
import api from '@utils/api';

export const taskApi = {
  async getTasksByDiscipline(disciplineId: number): Promise<TaskDto[]> {
    const { data } = await api.get<TaskDto[]>(`/task/${disciplineId}`);
    return data;
  },

  async getTeacherDisciplines(teacherId: number): Promise<TaskDiscipline[]> {
    const { data } = await api.get<TaskDiscipline[]>(
      `/teacher/${teacherId}/disciplines`
    );
    return data;
  },

  async getAllDisciplines(): Promise<DisciplineShort[]> {
    const { data } = await api.get<DisciplineShort[]>('/schedule/disciplines');
    return data;
  },

  async createTask(payload: CreateTaskDto): Promise<void> {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('description', payload.description);
    formData.append('disciplineId', String(payload.disciplineId));
    formData.append('createdById', String(payload.createdById));

    if (payload.file) {
      formData.append('file', payload.file);
    }

    await api.post('/task/add', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async downloadAttachment(
    attachmentId: number,
    fileName: string
  ): Promise<void> {
    const { data } = await api.get<Blob>(
      `/task/attachments/${attachmentId}/download`,
      {
        responseType: 'blob',
      }
    );

    const blobUrl = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  },
};
