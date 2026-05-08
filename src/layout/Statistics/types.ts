import { AnnouncementDto } from '@entities/announcementRequest';
import {
  TaskAnalyticsDto,
  TaskDto,
  TaskStatisticsDto,
} from '@entities/taskRequest';
import { ReportDto } from '@entities/teacherRequest';

export type StudentState = {
  fullName: string;
  tasks: TaskDto[];
  reports: ReportDto[];
  notifications: AnnouncementDto[];
};

export type TeacherState = {
  statistics: TaskStatisticsDto | null;
  analytics: TaskAnalyticsDto | null;
};

export type AdminStatisticsParams = {
  disciplineId?: string;
  groupId?: string;
  studentId?: string;
};

export type DisciplineAverage = {
  disciplineId: number;
  disciplineName: string;
  averageGrade: number;
  gradedReports: number;
};

export type StudentDetail = {
  fullName: string;
  disciplineName: string;
  averageGrade: number;
  gradedReports: number;
  totalTasks: number;
  accepted: number;
  underReview: number;
  overdue: number;
  untouched: number;
  completion: number;
};

export type GroupMetric = {
  groupId: number;
  groupName: string;
  studentCount: number;
  averageGrade: number;
  gradedReports: number;
  tasksCount: number;
};

export type SubmissionOverview = {
  accepted: number;
  pending: number;
  overdue: number;
  untouched: number;
};

export type StudentReportsEntry = {
  studentId: number;
  studentName: string;
  groupName: string;
  reports: ReportDto[];
};

export type StudentTopMetric = {
  studentId: number;
  studentName: string;
  groupName: string;
  averageGrade: number;
  gradedReports: number;
  submittedReports: number;
  accepted: number;
  underReview: number;
  overdue: number;
  completion: number;
};
