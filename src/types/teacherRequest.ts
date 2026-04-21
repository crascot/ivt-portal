export type ReportAttachmentDto = {
  id: number;
  fileName: string;
  contentType: string;
};

export enum ReportStatus {
  Submitted = 'SUBMITTED',
  Checked = 'CHECKED',
  Accepted = 'ACCEPTED',
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  [ReportStatus.Submitted]: 'Отправлен',
  [ReportStatus.Checked]: 'Проверен',
  [ReportStatus.Accepted]: 'Принят',
};

export type UmmFileDto = {
  id: number;
  fileName: string;
  fileType: string;
};

export type TeacherDisciplineDto = {
  id: number;
  name: string;
  description: string;
  urlList: string[];
  ummfiles: UmmFileDto[];
};

export type ReportDto = {
  id: number;
  comment: string | null;
  commentTeacher: string | null;
  grade: number | null;
  status: ReportStatus;
  submittedAt: string;

  taskId: number;
  taskTitle: string;

  studentId: number;
  studentName: string;

  submittedByUserName: string | null;
  attachments: ReportAttachmentDto[];
};

export type GradeRequest = {
  reportId: number;
  teacherId: number;
  grade: number;
};

export type SubmitReportPayload = {
  taskId: number;
  studentId: number;
  comment: string;
  files?: File[];
};
