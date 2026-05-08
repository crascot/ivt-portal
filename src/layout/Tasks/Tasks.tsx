import { useCallback } from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import { FiCheckCircle, FiClock, FiRefreshCw } from 'react-icons/fi';

import { RoleEnum } from '@entities/role-enum';
import {
  STUDENT_TASK_STATUS_LABELS,
  StudentTaskStatus,
  TaskDto,
} from '@entities/taskRequest';
import { ReportDto } from '@entities/teacherRequest';
import { useTasks } from '@hooks/tasks/useTasks';
import { computeTaskStatus } from '@utils/taskStatus';

import { TaskBoard } from './components/TaskBoard';
import { formatTaskDate, ManagerTaskStatus } from './taskUi';

import s from './Tasks.module.css';

const ROLE_TITLES: Record<RoleEnum, string> = {
  [RoleEnum.STUDENT]: 'Мои задания',
  [RoleEnum.TEACHER]: 'Управление заданиями',
  [RoleEnum.GROUP_LEADER]: 'Мои задания',
  [RoleEnum.ADMIN]: 'Управление заданиями',
};

const ROLE_SUBTITLES: Record<RoleEnum, string> = {
  [RoleEnum.STUDENT]: 'Просмотр заданий и отправка выполненных работ',
  [RoleEnum.TEACHER]:
    'Создание, редактирование и контроль заданий для студентов',
  [RoleEnum.GROUP_LEADER]: 'Просмотр заданий и отправка выполненных работ',
  [RoleEnum.ADMIN]:
    'Создание заданий от имени преподавателей и контроль ответов',
};

const getLatestReport = (reports: ReportDto[]): ReportDto | null => {
  if (reports.length === 0) return null;

  return reports.reduce((latest, current) => {
    const currentTime = new Date(current.submittedAt).getTime();
    const latestTime = new Date(latest.submittedAt).getTime();
    return currentTime > latestTime ? current : latest;
  });
};

const getStudentBoardStatus = (
  task: TaskDto,
  reports: ReportDto[]
): ManagerTaskStatus => {
  const info = computeTaskStatus(task, reports);

  if (
    info.isOverdue &&
    info.status !== StudentTaskStatus.Accepted &&
    info.status !== StudentTaskStatus.AcceptedLate
  ) {
    return 'OVERDUE';
  }

  if (
    info.status === StudentTaskStatus.Accepted ||
    info.status === StudentTaskStatus.AcceptedLate
  ) {
    return 'COMPLETED';
  }

  if (info.status === StudentTaskStatus.UnderReview) {
    return 'REVIEW';
  }

  return 'ACTIVE';
};

const getStudentStatusLabel = (task: TaskDto, reports: ReportDto[]) => {
  const info = computeTaskStatus(task, reports);

  if (
    info.isOverdue &&
    info.status !== StudentTaskStatus.Accepted &&
    info.status !== StudentTaskStatus.AcceptedLate
  ) {
    return 'Просрочено';
  }

  return STUDENT_TASK_STATUS_LABELS[info.status];
};

export const Tasks = () => {
  const {
    role,
    tasks,
    disciplines,
    teachers,
    teacherId,
    reportsByTaskId,
    selectedDisciplineId,
    isLoading,
    isTasksLoading,
    isSubmitting,
    error,
    actionError,
    isStudentView,
    selectDiscipline,
    reloadTasks,
    addTask,
    updateTask,
    deleteTask,
  } = useTasks();

  const title = role ? ROLE_TITLES[role] : 'Задания';
  const subtitle = role ? ROLE_SUBTITLES[role] : '';

  const getStudentStatus = useCallback(
    (task: TaskDto) =>
      getStudentBoardStatus(task, reportsByTaskId[task.id] ?? []),
    [reportsByTaskId]
  );

  const getStudentRowStatusLabel = useCallback(
    (task: TaskDto) =>
      getStudentStatusLabel(task, reportsByTaskId[task.id] ?? []),
    [reportsByTaskId]
  );

  const renderStudentInfoCell = useCallback(
    (task: TaskDto) => {
      const reports = reportsByTaskId[task.id] ?? [];
      const latestReport = getLatestReport(reports);

      if (!latestReport) {
        return (
          <div className={s.taskAnswersCell}>
            <strong>0</strong>
            <span>Ответ не отправлен</span>
            <span>Откройте задание для сдачи</span>
          </div>
        );
      }

      return (
        <div className={s.taskAnswersCell}>
          <strong>{reports.length}</strong>
          <span>
            <FiClock /> Последний: {formatTaskDate(latestReport.submittedAt)}
          </span>
          <span>
            <FiCheckCircle />{' '}
            {latestReport.grade != null
              ? `Оценка: ${latestReport.grade}`
              : getStudentStatusLabel(task, reports)}
          </span>
        </div>
      );
    },
    [reportsByTaskId]
  );

  return (
    <div className={s.tasks}>
      <header className={s.header}>
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <Button
          type="button"
          variant="outline-primary"
          onClick={reloadTasks}
          disabled={isTasksLoading}
          className={s.refreshButton}
        >
          <FiRefreshCw />
          Обновить
        </Button>
      </header>

      {error && <Alert variant="danger">{error}</Alert>}
      {actionError && <Alert variant="danger">{actionError}</Alert>}

      {isLoading ? (
        <div className={s.loadingState}>
          <Spinner animation="border" size="sm" />
          <span>Загрузка...</span>
        </div>
      ) : (
        <TaskBoard
          tasks={tasks}
          disciplines={disciplines}
          teachers={teachers}
          selectedDisciplineId={selectedDisciplineId}
          isLoading={isTasksLoading}
          isSubmitting={isSubmitting}
          emptyText={
            isStudentView
              ? 'Заданий по вашим дисциплинам пока нет'
              : 'Заданий по выбранным условиям пока нет'
          }
          toolbarTitle="Список заданий"
          toolbarSubtitle={
            isStudentView
              ? 'Откройте задание, чтобы посмотреть материалы и отправить ответ'
              : 'Показаны задания по выбранным фильтрам'
          }
          canCreate={role === RoleEnum.TEACHER || role === RoleEnum.ADMIN}
          canEdit={role === RoleEnum.TEACHER || role === RoleEnum.ADMIN}
          teacherId={teacherId}
          showTeacherSelect={role === RoleEnum.ADMIN}
          infoColumnTitle={isStudentView ? 'Мой ответ' : 'Ответы'}
          getTaskStatus={isStudentView ? getStudentStatus : undefined}
          getTaskStatusLabel={
            isStudentView ? getStudentRowStatusLabel : undefined
          }
          renderInfoCell={isStudentView ? renderStudentInfoCell : undefined}
          onSelectDiscipline={selectDiscipline}
          onAdd={
            role === RoleEnum.TEACHER || role === RoleEnum.ADMIN
              ? addTask
              : undefined
          }
          onUpdate={
            role === RoleEnum.TEACHER || role === RoleEnum.ADMIN
              ? updateTask
              : undefined
          }
          onDelete={
            role === RoleEnum.TEACHER || role === RoleEnum.ADMIN
              ? deleteTask
              : undefined
          }
        />
      )}
    </div>
  );
};
