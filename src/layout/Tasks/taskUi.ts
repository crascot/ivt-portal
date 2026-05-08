import { ROUTES } from '@utils/routes';
import { TaskDto } from '@entities/taskRequest';

export type ManagerTaskStatus = 'ACTIVE' | 'REVIEW' | 'COMPLETED' | 'OVERDUE';

export const MANAGER_TASK_STATUS_LABELS: Record<ManagerTaskStatus, string> = {
  ACTIVE: 'Активное',
  REVIEW: 'На проверке',
  COMPLETED: 'Завершенное',
  OVERDUE: 'Просрочено',
};

export const getTaskDetailPath = (taskId: number) =>
  ROUTES.TASK_DETAIL.replace(':taskId', String(taskId));

const parseTime = (iso: string | null): number | null => {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  return Number.isFinite(time) ? time : null;
};

export const formatTaskDate = (iso: string | null): string => {
  if (!iso) return 'Не указан';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  return date.toLocaleString('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

export const getDeadlineHint = (iso: string | null): string => {
  const deadlineTime = parseTime(iso);
  if (deadlineTime == null) return 'Без дедлайна';

  const diffMs = deadlineTime - Date.now();
  if (diffMs < 0) return 'Срок прошел';

  const hours = Math.ceil(diffMs / (1000 * 60 * 60));
  if (hours <= 24) return 'Осталось меньше суток';

  const days = Math.ceil(hours / 24);
  return `Осталось ${days} дн.`;
};

export const getManagerTaskStatus = (task: TaskDto): ManagerTaskStatus => {
  const deadlineTime = parseTime(task.deadline);
  const deadlinePassed = deadlineTime != null && deadlineTime < Date.now();
  const reportsCount = task.reportsCount ?? 0;
  const pendingCount = task.pendingReportsCount ?? 0;
  const acceptedCount = task.acceptedReportsCount ?? 0;

  if (pendingCount > 0) {
    return 'REVIEW';
  }

  if (reportsCount > 0 && acceptedCount === reportsCount) {
    return 'COMPLETED';
  }

  if (deadlinePassed) {
    return 'OVERDUE';
  }

  return 'ACTIVE';
};

export const sortTasksByCreatedAt = (tasks: TaskDto[]) =>
  [...tasks].sort((a, b) => {
    const aTime = parseTime(a.createdAt) ?? 0;
    const bTime = parseTime(b.createdAt) ?? 0;
    return bTime - aTime;
  });
