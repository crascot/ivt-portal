import { RoleEnum } from '@entities/role-enum';
import { TaskDto } from '@entities/taskRequest';
import { ReportDto, ReportStatus } from '@entities/teacherRequest';
import {
  DisciplineAverage,
  GroupMetric,
  StudentDetail,
  StudentReportsEntry,
  StudentTopMetric,
  SubmissionOverview,
} from '../types';

export const parseRouteId = (value: string | undefined) => {
  if (!value) return null;

  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const isStudentRole = (role: RoleEnum | undefined) =>
  role === RoleEnum.STUDENT || role === RoleEnum.GROUP_LEADER;

export const isTeacherRole = (role: RoleEnum | undefined) =>
  role === RoleEnum.TEACHER || role === RoleEnum.ADMIN;

export const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
  });
};

export const formatGrade = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

export const getLatestReportsByTask = (reports: ReportDto[]) =>
  reports.reduce<Record<number, ReportDto>>((acc, report) => {
    const current = acc[report.taskId];
    const currentTime = current ? new Date(current.submittedAt).getTime() : 0;
    const reportTime = new Date(report.submittedAt).getTime();

    if (!current || reportTime >= currentTime) {
      acc[report.taskId] = report;
    }

    return acc;
  }, {});

export const isStudentTaskOverdue = (task: TaskDto, report?: ReportDto) => {
  if (!task.deadline) return false;

  const deadline = new Date(task.deadline);
  return (
    !Number.isNaN(deadline.getTime()) &&
    deadline.getTime() < Date.now() &&
    report?.status !== ReportStatus.Accepted
  );
};

export const getWeekStart = (value: string) => {
  const date = new Date(value);
  const day = date.getDay() || 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day + 1);
  return date;
};

export const buildWeeklyActivity = (reports: ReportDto[]) => {
  const firstWeek = getWeekStart(new Date().toISOString());
  firstWeek.setDate(firstWeek.getDate() - 7 * 7);

  const counts = reports.reduce<Record<string, number>>((acc, report) => {
    const key = getWeekStart(report.submittedAt).toISOString().slice(0, 10);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return Array.from({ length: 8 }, (_, index) => {
    const week = new Date(firstWeek);
    week.setDate(firstWeek.getDate() + index * 7);
    const key = week.toISOString().slice(0, 10);

    return {
      key,
      label: formatDate(key),
      count: counts[key] ?? 0,
    };
  });
};

export const buildDisciplineAverages = (
  tasks: TaskDto[],
  reports: ReportDto[]
): DisciplineAverage[] => {
  const latestReports = getLatestReportsByTask(reports);
  const aggregate = tasks.reduce<
    Record<
      number,
      {
        disciplineId: number;
        disciplineName: string;
        total: number;
        count: number;
      }
    >
  >((acc, task) => {
    if (!task.disciplineId) return acc;
    const report = latestReports[task.id];
    if (report?.grade == null) return acc;

    const disciplineId = task.disciplineId;
    const current = acc[disciplineId] ?? {
      disciplineId,
      disciplineName: task.disciplineName,
      total: 0,
      count: 0,
    };

    current.total += report.grade;
    current.count += 1;
    acc[disciplineId] = current;
    return acc;
  }, {});

  return Object.values(aggregate)
    .map((item) => ({
      disciplineId: item.disciplineId,
      disciplineName: item.disciplineName,
      averageGrade: Number((item.total / item.count).toFixed(1)),
      gradedReports: item.count,
    }))
    .sort((a, b) => b.averageGrade - a.averageGrade);
};

export const buildStudentDetail = (
  fullName: string,
  disciplineName: string,
  tasks: TaskDto[],
  reports: ReportDto[]
): StudentDetail => {
  const taskIds = new Set(tasks.map((task) => task.id));
  const disciplineReports = reports.filter((report) =>
    taskIds.has(report.taskId)
  );
  const latestReports = getLatestReportsByTask(disciplineReports);

  const accepted = Object.values(latestReports).filter(
    (report) =>
      report.status === ReportStatus.Accepted ||
      report.status === ReportStatus.Checked
  ).length;
  const underReview = Object.values(latestReports).filter(
    (report) => report.status === ReportStatus.Submitted
  ).length;
  const overdue = tasks.filter((task) =>
    isStudentTaskOverdue(task, latestReports[task.id])
  ).length;
  const totalTasks = tasks.length;

  const gradedReports = disciplineReports.filter(
    (report) => report.grade != null
  );
  const averageGrade =
    gradedReports.length > 0
      ? Number(
          (
            gradedReports.reduce(
              (sum, report) => sum + (report.grade ?? 0),
              0
            ) / gradedReports.length
          ).toFixed(1)
        )
      : 0;

  return {
    fullName,
    disciplineName,
    averageGrade,
    gradedReports: gradedReports.length,
    totalTasks,
    accepted,
    underReview,
    overdue,
    untouched: Math.max(totalTasks - accepted - underReview - overdue, 0),
    completion: totalTasks > 0 ? Math.round((accepted / totalTasks) * 100) : 0,
  };
};

export const buildGroupMetric = (
  studentReports: ReportDto[][],
  tasks: TaskDto[],
  groupId: number,
  groupName: string
): GroupMetric => {
  const taskIds = new Set(tasks.map((task) => task.id));
  const disciplineReports = studentReports.flatMap((reports) =>
    reports.filter((report) => taskIds.has(report.taskId))
  );

  const gradedReports = disciplineReports.filter(
    (report) => report.grade != null
  );
  const averageGrade =
    gradedReports.length > 0
      ? Number(
          (
            gradedReports.reduce(
              (sum, report) => sum + (report.grade ?? 0),
              0
            ) / gradedReports.length
          ).toFixed(1)
        )
      : 0;

  return {
    groupId,
    groupName,
    studentCount: studentReports.length,
    averageGrade,
    gradedReports: gradedReports.length,
    tasksCount: tasks.length,
  };
};

export const buildStudentTopMetrics = (
  entries: StudentReportsEntry[],
  tasks: TaskDto[]
): StudentTopMetric[] =>
  entries
    .map((entry) => {
      const detail = buildStudentDetail(
        entry.studentName,
        '',
        tasks,
        entry.reports
      );

      return {
        studentId: entry.studentId,
        studentName: entry.studentName,
        groupName: entry.groupName,
        averageGrade: detail.averageGrade,
        gradedReports: detail.gradedReports,
        submittedReports: entry.reports.filter((report) =>
          tasks.some((task) => task.id === report.taskId)
        ).length,
        accepted: detail.accepted,
        underReview: detail.underReview,
        overdue: detail.overdue,
        completion: detail.completion,
      };
    })
    .filter((item) => item.gradedReports > 0 || item.submittedReports > 0)
    .sort(
      (a, b) =>
        b.averageGrade - a.averageGrade ||
        b.completion - a.completion ||
        b.gradedReports - a.gradedReports
    );

export const buildSubmissionOverviewFromEntries = (
  entries: StudentReportsEntry[],
  tasks: TaskDto[]
): SubmissionOverview =>
  entries.reduce<SubmissionOverview>(
    (acc, entry) => {
      const detail = buildStudentDetail(
        entry.studentName,
        '',
        tasks,
        entry.reports
      );
      acc.accepted += detail.accepted;
      acc.pending += detail.underReview;
      acc.overdue += detail.overdue;
      acc.untouched += detail.untouched;
      return acc;
    },
    { accepted: 0, pending: 0, overdue: 0, untouched: 0 }
  );

export const buildStatusGradient = ({
  accepted,
  pending,
  overdue,
  untouched = 0,
}: {
  accepted: number;
  pending: number;
  overdue: number;
  untouched?: number;
}) => {
  const total = accepted + pending + overdue + untouched;
  if (total <= 0) {
    return 'conic-gradient(#adb5bd 0 100%)';
  }

  const acceptedEnd = (accepted / total) * 100;
  const pendingEnd = acceptedEnd + (pending / total) * 100;
  const overdueEnd = pendingEnd + (overdue / total) * 100;

  return `conic-gradient(
    #198754 0 ${acceptedEnd}%,
    #f59f00 ${acceptedEnd}% ${pendingEnd}%,
    #dc3545 ${pendingEnd}% ${overdueEnd}%,
    #adb5bd ${overdueEnd}% 100%
  )`;
};
