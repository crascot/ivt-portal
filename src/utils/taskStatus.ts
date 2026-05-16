import { StudentTaskStatus, TaskDto } from '@entities/taskRequest';
import { ReportDto, ReportStatus } from '@entities/teacherRequest';

export type TaskStatusInfo = {
  status: StudentTaskStatus;
  /** latest student report (if any), used for extra UI */
  latestReport: ReportDto | null;
  /** true if deadline has passed AND task is not yet accepted */
  isOverdue: boolean;
};

const parseReportSubmittedAt = (iso: string): number => {
  const time = new Date(iso).getTime();
  return Number.isFinite(time) ? time : 0;
};

export const compareReportRecency = (
  first: ReportDto,
  second: ReportDto
): number => {
  const submittedAtDiff =
    parseReportSubmittedAt(first.submittedAt) -
    parseReportSubmittedAt(second.submittedAt);

  if (submittedAtDiff !== 0) return submittedAtDiff;

  return first.id - second.id;
};

export const pickLatestReport = (reports: ReportDto[]): ReportDto | null => {
  if (reports.length === 0) return null;

  return reports.reduce((latest, current) => {
    return compareReportRecency(current, latest) > 0 ? current : latest;
  });
};

export const isReportAcceptedAndGraded = (report: ReportDto): boolean =>
  report.status === ReportStatus.Accepted && report.grade != null;

export const computeTaskStatus = (
  task: TaskDto,
  reports: ReportDto[]
): TaskStatusInfo => {
  const latestReport = pickLatestReport(reports);
  const deadlineTime = task.deadline ? new Date(task.deadline).getTime() : null;
  const now = Date.now();

  if (!latestReport) {
    return {
      status: StudentTaskStatus.NotSubmitted,
      latestReport: null,
      isOverdue: deadlineTime != null && deadlineTime < now,
    };
  }

  const submittedTime = new Date(latestReport.submittedAt).getTime();
  const submittedLate = deadlineTime != null && submittedTime > deadlineTime;

  if (isReportAcceptedAndGraded(latestReport)) {
    return {
      status: submittedLate
        ? StudentTaskStatus.AcceptedLate
        : StudentTaskStatus.Accepted,
      latestReport,
      isOverdue: false,
    };
  }

  if (latestReport.status === ReportStatus.Checked) {
    return {
      status: StudentTaskStatus.NeedsRework,
      latestReport,
      isOverdue: deadlineTime != null && deadlineTime < now,
    };
  }

  return {
    status: StudentTaskStatus.UnderReview,
    latestReport,
    isOverdue: deadlineTime != null && deadlineTime < now,
  };
};

const STATUS_ORDER: Record<StudentTaskStatus, number> = {
  [StudentTaskStatus.NeedsRework]: 0,
  [StudentTaskStatus.NotSubmitted]: 1,
  [StudentTaskStatus.UnderReview]: 2,
  [StudentTaskStatus.AcceptedLate]: 3,
  [StudentTaskStatus.Accepted]: 4,
};

export const compareTasksForStudent = (
  a: { task: TaskDto; info: TaskStatusInfo },
  b: { task: TaskDto; info: TaskStatusInfo }
): number => {
  const orderDiff = STATUS_ORDER[a.info.status] - STATUS_ORDER[b.info.status];
  if (orderDiff !== 0) return orderDiff;

  const aDeadline = a.task.deadline
    ? new Date(a.task.deadline).getTime()
    : Infinity;
  const bDeadline = b.task.deadline
    ? new Date(b.task.deadline).getTime()
    : Infinity;
  if (aDeadline !== bDeadline) return aDeadline - bDeadline;

  const aCreated = a.task.createdAt ? new Date(a.task.createdAt).getTime() : 0;
  const bCreated = b.task.createdAt ? new Date(b.task.createdAt).getTime() : 0;
  return bCreated - aCreated;
};
