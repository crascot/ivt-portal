import { useMemo, useState } from 'react';
import { Alert, Button, Card, Collapse } from 'react-bootstrap';

import { DisciplineShort } from '@entities/scheduleRequest';
import {
  STUDENT_TASK_STATUS_LABELS,
  StudentTaskStatus,
  TaskDto,
  TaskFilters as TaskFiltersValue,
} from '@entities/taskRequest';
import { ReportDto } from '@entities/teacherRequest';
import {
  compareTasksForStudent,
  computeTaskStatus,
  TaskStatusInfo,
} from '@utils/taskStatus';

import { TaskCard } from './TaskCard';
import { TaskFilters } from './TaskFilters';
import { StudentReportsPanel } from './reports/StudentReportsPanel';

import s from '../Tasks.module.css';

type Props = {
  tasks: TaskDto[];
  reportsByTaskId: Record<number, ReportDto[]>;
  disciplines: DisciplineShort[];
  studentId: number | null;
  onDownloadAttachment: (attachmentId: number, fileName: string) => void;
  onReportsMutated?: () => void;
};

const emptyFilters: TaskFiltersValue = {
  disciplineId: null,
  statuses: [],
  createdFrom: null,
  createdTo: null,
  deadlineFrom: null,
  deadlineTo: null,
};

const dayStartTime = (iso: string | null): number | null => {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  return Number.isFinite(time) ? time : null;
};

const dayEndTime = (iso: string | null): number | null => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(23, 59, 59, 999);
  return date.getTime();
};

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

export const StudentTasks = ({
  tasks,
  reportsByTaskId,
  disciplines,
  studentId,
  onDownloadAttachment,
  onReportsMutated,
}: Props) => {
  const [filters, setFilters] = useState<TaskFiltersValue>(emptyFilters);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const tasksWithInfo = useMemo<
    { task: TaskDto; info: TaskStatusInfo }[]
  >(() => {
    return tasks.map((task) => ({
      task,
      info: computeTaskStatus(task, reportsByTaskId[task.id] ?? []),
    }));
  }, [tasks, reportsByTaskId]);

  const filteredAndSorted = useMemo(() => {
    const createdFrom = dayStartTime(filters.createdFrom);
    const createdTo = dayEndTime(filters.createdTo);
    const deadlineFrom = dayStartTime(filters.deadlineFrom);
    const deadlineTo = dayEndTime(filters.deadlineTo);

    const passed = tasksWithInfo.filter(({ task, info }) => {
      if (
        filters.disciplineId != null &&
        task.disciplineId !== filters.disciplineId
      ) {
        return false;
      }

      if (
        filters.statuses.length > 0 &&
        !filters.statuses.includes(info.status)
      ) {
        return false;
      }

      const createdAt = task.createdAt
        ? new Date(task.createdAt).getTime()
        : null;
      if (
        createdFrom != null &&
        (createdAt == null || createdAt < createdFrom)
      ) {
        return false;
      }
      if (createdTo != null && (createdAt == null || createdAt > createdTo)) {
        return false;
      }

      const deadline = task.deadline ? new Date(task.deadline).getTime() : null;
      if (
        deadlineFrom != null &&
        (deadline == null || deadline < deadlineFrom)
      ) {
        return false;
      }
      if (deadlineTo != null && (deadline == null || deadline > deadlineTo)) {
        return false;
      }

      return true;
    });

    return passed.sort(compareTasksForStudent);
  }, [tasksWithInfo, filters]);

  const statusCounts = useMemo(() => {
    const counts: Record<StudentTaskStatus, number> = {
      [StudentTaskStatus.NotSubmitted]: 0,
      [StudentTaskStatus.UnderReview]: 0,
      [StudentTaskStatus.NeedsRework]: 0,
      [StudentTaskStatus.Accepted]: 0,
      [StudentTaskStatus.AcceptedLate]: 0,
    };
    tasksWithInfo.forEach(({ info }) => {
      counts[info.status] += 1;
    });
    return counts;
  }, [tasksWithInfo]);

  const overdueCount = useMemo(
    () => tasksWithInfo.filter(({ info }) => info.isOverdue).length,
    [tasksWithInfo]
  );

  const toggleExpanded = (taskId: number) => {
    setExpandedId((prev) => (prev === taskId ? null : taskId));
  };

  if (tasks.length === 0) {
    return <Alert variant="light">Заданий по вашим дисциплинам пока нет</Alert>;
  }

  return (
    <div className={s.studentTasks}>
      <div className={s.taskStats}>
        <div className={s.taskStat}>
          <span className={s.taskStatLabel}>Всего заданий</span>
          <strong>{tasks.length}</strong>
        </div>
        <div
          className={`${s.taskStat} ${
            overdueCount > 0 ? s.taskStatDanger : ''
          }`}
        >
          <span className={s.taskStatLabel}>Просрочено</span>
          <strong>{overdueCount}</strong>
        </div>
        <div className={s.taskStat}>
          <span className={s.taskStatLabel}>Показано</span>
          <strong>{filteredAndSorted.length}</strong>
        </div>
      </div>

      <TaskFilters
        value={filters}
        disciplines={disciplines}
        onChange={setFilters}
        onReset={() => setFilters(emptyFilters)}
      />

      <div className={s.statusSummary}>
        {(Object.entries(statusCounts) as [StudentTaskStatus, number][]).map(
          ([status, count]) => (
            <span
              key={status}
              className={`${s.statusSummaryChip} ${s[`status_${status}`]}`}
            >
              {STUDENT_TASK_STATUS_LABELS[status]}: <b>{count}</b>
            </span>
          )
        )}
      </div>

      {filteredAndSorted.length === 0 ? (
        <Alert variant="light" className="mb-0">
          Нет заданий, соответствующих выбранным фильтрам
        </Alert>
      ) : (
        <div className={s.taskList}>
          {filteredAndSorted.map(({ task, info }) => {
            const isExpanded = expandedId === task.id;
            const cardClass = [
              s.taskWithReports,
              s[`card_${info.status}`],
              info.isOverdue ? s.card_overdue : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div key={task.id} className={cardClass}>
                <Card
                  as="button"
                  type="button"
                  onClick={() => toggleExpanded(task.id)}
                  className={s.taskHeaderCard}
                >
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                      <div className="flex-grow-1 text-start">
                        <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                          <strong>{task.title}</strong>
                          <span
                            className={`${s.statusBadge} ${s[`status_${info.status}`]}`}
                          >
                            {STUDENT_TASK_STATUS_LABELS[info.status]}
                          </span>
                          {info.isOverdue &&
                            info.status === StudentTaskStatus.NotSubmitted && (
                              <span className={s.overdueBadge}>Просрочено</span>
                            )}
                        </div>
                        <div className="text-muted small">
                          <span>{task.disciplineName}</span>
                          <span className="mx-1">·</span>
                          <span>{task.teacherName}</span>
                        </div>
                        <div className="text-muted small mt-1">
                          <span>Создано: {formatDate(task.createdAt)}</span>
                          <span className="mx-2">·</span>
                          <span>Дедлайн: {formatDate(task.deadline)}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={isExpanded ? 'secondary' : 'outline-primary'}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(task.id);
                        }}
                      >
                        {isExpanded ? 'Свернуть' : 'Открыть'}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>

                <Collapse in={isExpanded} unmountOnExit>
                  <div>
                    <div className={s.taskDetails}>
                      <TaskCard
                        task={task}
                        canEdit={false}
                        onDownloadAttachment={onDownloadAttachment}
                      />
                      {studentId != null ? (
                        <StudentReportsPanel
                          taskId={task.id}
                          studentId={studentId}
                          onMutated={onReportsMutated}
                        />
                      ) : (
                        <div className={s.submitStub}>
                          <p className="mb-1">Отправка выполненного задания</p>
                          <small>Не удалось определить профиль студента</small>
                        </div>
                      )}
                    </div>
                  </div>
                </Collapse>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
