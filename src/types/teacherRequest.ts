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

export type TeacherDirectoryItemDto = {
  id: number;
  fullName: string;
  email: string;
  position: string;
  hasAvatar: boolean;
  disciplinesCount: number;
  materialsCount: number;
};

export type TeacherDirectoryDisciplineDto = {
  id: number;
  name: string;
  description: string | null;
};

export type TeacherDirectoryScheduleDto = {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
  url: string | null;
  disciplineName: string;
  groupName: string;
};

export type TeacherDirectoryMaterialDto = {
  id: number;
  title: string;
  description: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  disciplineId: number;
  disciplineName: string;
  authorId: number;
  authorName: string;
  materialKind: string;
  section: string | null;
  attachmentsCount: number;
  urlsCount: number;
};

export type TeacherDetailDto = {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  whatsApp: string | null;
  position: string;
  enabled: boolean;
  hasAvatar: boolean;
  disciplinesCount: number;
  materialsCount: number;
  disciplines: TeacherDirectoryDisciplineDto[];
  schedules: TeacherDirectoryScheduleDto[];
  recentMaterials: TeacherDirectoryMaterialDto[];
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
