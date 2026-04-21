import {
  GradeRequest,
  ReportDto,
  TeacherDisciplineDto,
} from '@entities/teacherRequest';
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

export const teacherApi = {
  async getTeacherDisciplines(
    teacherId: number
  ): Promise<TeacherDisciplineDto[]> {
    const { data } = await api.get<TeacherDisciplineDto[]>(
      `/teacher/${teacherId}/disciplines`
    );
    return data;
  },

  async getReportsByTask(taskId: number): Promise<ReportDto[]> {
    const { data } = await api.get<ReportDto[]>(
      `/teacher/task/${taskId}/reports`
    );
    return data;
  },

  async downloadReportAttachment(
    attachmentId: number,
    fileName: string
  ): Promise<void> {
    const { data } = await api.get<Blob>(
      `/teacher/repost/attachment/${attachmentId}/download`,
      { responseType: 'blob' }
    );
    triggerDownload(data, fileName);
  },

  async getReportAttachmentBlob(attachmentId: number): Promise<Blob> {
    const { data } = await api.get<Blob>(
      `/teacher/repost/attachment/${attachmentId}/download`,
      { responseType: 'blob' }
    );
    return data;
  },

  async deleteReportAttachment(attachmentId: number): Promise<void> {
    await api.delete(`/teacher/report/attachment/${attachmentId}`);
  },

  async setReportGrade(payload: GradeRequest): Promise<void> {
    await api.post('/teacher/report/grade', payload);
  },

  async markReportChecked(
    reportId: number,
    comment: string,
    files?: File[]
  ): Promise<void> {
    const params = new URLSearchParams();
    params.append('reportId', String(reportId));
    params.append('comment', comment);

    const formData = new FormData();
    if (files?.length) {
      files.forEach((file) => formData.append('files', file));
    }

    await api.post(`/teacher/grade/checked?${params.toString()}`, formData);
  },

  async addUmm(
    disciplineId: number,
    urls?: string[],
    files?: File[]
  ): Promise<void> {
    const params = new URLSearchParams();
    params.append('disciplineId', String(disciplineId));
    if (urls?.length) {
      urls.forEach((url) => params.append('urls', url));
    }

    const formData = new FormData();
    if (files?.length) {
      files.forEach((file) => formData.append('files', file));
    }

    await api.post(`/teacher/umm/add?${params.toString()}`, formData);
  },

  async removeDisciplineUrl(disciplineId: number, url: string): Promise<void> {
    await api.delete(`/teacher/${disciplineId}/url`, {
      params: { url },
    });
  },

  async removeUmm(ummId: number): Promise<void> {
    await api.delete(`/teacher/umm/${ummId}`);
  },

  async downloadUmm(attachmentId: number, fileName: string): Promise<void> {
    const { data } = await api.get<Blob>(
      `/teacher/umm/${attachmentId}/download`,
      { responseType: 'blob' }
    );
    triggerDownload(data, fileName);
  },

  async getUmmBlob(attachmentId: number): Promise<Blob> {
    const { data } = await api.get<Blob>(
      `/teacher/umm/${attachmentId}/download`,
      { responseType: 'blob' }
    );
    return data;
  },
};
