export type TaskAttachmentDto = {
  id: number;
  fileName: string;
  contentType: string;
};

export type TaskDto = {
  id: number;
  title: string;
  description: string;
  disciplineName: string;
  disciplineId: number | null;
  teacherName: string;
  createdAt: string | null;
  deadline: string | null;
  attachments: TaskAttachmentDto[];
};

export type TaskFormValues = {
  title: string;
  description: string;
  disciplineId: number | null;
  createdById: number | null;
  deadline: string | null;
  files: File[];
};

export enum StudentTaskStatus {
  NotSubmitted = 'NOT_SUBMITTED',
  UnderReview = 'UNDER_REVIEW',
  NeedsRework = 'NEEDS_REWORK',
  Accepted = 'ACCEPTED',
  AcceptedLate = 'ACCEPTED_LATE',
}

export const STUDENT_TASK_STATUS_LABELS: Record<StudentTaskStatus, string> = {
  [StudentTaskStatus.NotSubmitted]: 'Не сдано',
  [StudentTaskStatus.UnderReview]: 'На рассмотрении',
  [StudentTaskStatus.NeedsRework]: 'На переделку',
  [StudentTaskStatus.Accepted]: 'Сдано',
  [StudentTaskStatus.AcceptedLate]: 'Сдано с опозданием',
};

export type TaskFilters = {
  disciplineId: number | null;
  statuses: StudentTaskStatus[];
  createdFrom: string | null;
  createdTo: string | null;
  deadlineFrom: string | null;
  deadlineTo: string | null;
};
