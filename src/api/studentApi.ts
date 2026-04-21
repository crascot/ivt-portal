import {
  ReportDto,
  SubmitReportPayload,
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

export const studentApi = {
  async getDisciplinesByGroup(
    groupId: number
  ): Promise<TeacherDisciplineDto[]> {
    const { data } = await api.get<TeacherDisciplineDto[]>(
      `/student/group/${groupId}/disciplines`
    );
    return data;
  },

  async getReportsByTaskAndStudent(
    taskId: number,
    studentId: number
  ): Promise<ReportDto[]> {
    const { data } = await api.get<ReportDto[]>(
      `/student/task/${taskId}/student/${studentId}`
    );
    return data;
  },

  async getAllReportsByStudent(studentId: number): Promise<ReportDto[]> {
    const { data } = await api.get<ReportDto[]>(
      `/student/${studentId}/reports`
    );
    return data;
  },

  async submitReport(payload: SubmitReportPayload): Promise<void> {
    const params = new URLSearchParams();
    params.append('title', `report-task-${payload.taskId}`);
    params.append('comment', payload.comment);
    params.append('studentId', String(payload.studentId));
    params.append('taskId', String(payload.taskId));

    const formData = new FormData();
    if (payload.files?.length) {
      payload.files.forEach((file) => formData.append('file', file));
    }

    await api.post(`/student/report?${params.toString()}`, formData);
  },

  async deleteReport(reportId: number): Promise<void> {
    await api.delete(`/student/report/${reportId}`);
  },

  async deleteReportAttachment(attachmentId: number): Promise<void> {
    await api.delete(`/student/report/attachment/${attachmentId}`);
  },

  async downloadReportAttachment(
    attachmentId: number,
    fileName: string
  ): Promise<void> {
    const { data } = await api.get<Blob>(
      `/student/repost/attachment/${attachmentId}/download`,
      { responseType: 'blob' }
    );
    triggerDownload(data, fileName);
  },

  async getReportAttachmentBlob(attachmentId: number): Promise<Blob> {
    const { data } = await api.get<Blob>(
      `/student/repost/attachment/${attachmentId}/download`,
      { responseType: 'blob' }
    );
    return data;
  },
};
