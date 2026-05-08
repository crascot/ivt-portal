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
  createdById: number | null;
  teacherName: string;
  createdAt: string | null;
  deadline: string | null;
  reportsCount: number;
  pendingReportsCount: number;
  acceptedReportsCount: number;
  attachments: TaskAttachmentDto[];
};

export type TaskStatisticsDto = {
  totalTasks: number;
  overdueTasks: number;
  tasksWithoutReports?: number;
  pendingReviewReports?: number;
  checkedReports?: number;
  acceptedReports?: number;
  nextDeadline?: string | null;
};

export type TaskAnalyticsDto = {
  submissionOverview: {
    submitted: number;
    overdue: number;
  };
  weeklySubmissions: {
    weekStart: string;
    label: string;
    count: number;
  }[];
  disciplineAverageGrades: {
    disciplineId: number;
    disciplineName: string;
    averageGrade: number;
    gradedReports: number;
  }[];
  topStudents: {
    studentId: number;
    studentName: string;
    averageGrade: number;
    gradedReports: number;
  }[];
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
