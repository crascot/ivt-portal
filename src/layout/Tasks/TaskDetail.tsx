import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiBookOpen,
  FiCalendar,
  FiClock,
  FiFileText,
  FiUser,
} from 'react-icons/fi';

import { taskApi } from '@api/taskApi';
import { scheduleApi } from '@api/scheduleApi';
import { useAuth } from '@context/AuthContext';
import { RoleEnum } from '@entities/role-enum';
import { TaskDto } from '@entities/taskRequest';
import { ROUTES } from '@utils/routes';

import { TaskCard } from './components/TaskCard';
import { StudentReportsPanel } from './components/reports/StudentReportsPanel';
import { TeacherReportsPanel } from './components/reports/TeacherReportsPanel';
import {
  formatTaskDate,
  getDeadlineHint,
  getManagerTaskStatus,
  MANAGER_TASK_STATUS_LABELS,
} from './taskUi';

import s from './Tasks.module.css';

export const TaskDetail = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { user } = useAuth();
  const role = user?.role;

  const [task, setTask] = useState<TaskDto | null>(null);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [reviewTeacherId, setReviewTeacherId] = useState<number | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericTaskId = taskId ? Number(taskId) : NaN;

  const loadTask = useCallback(async () => {
    if (!Number.isFinite(numericTaskId) || !role) {
      setError('Некорректный идентификатор задания');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextTask = await taskApi.getTaskById(numericTaskId);

      if (role === RoleEnum.STUDENT || role === RoleEnum.GROUP_LEADER) {
        const profile = await scheduleApi.getStudentProfile();
        setStudentId(profile.studentId);
        setReviewTeacherId(null);
      } else if (role === RoleEnum.TEACHER) {
        const profile = await scheduleApi.getTeacherProfile();
        setReviewTeacherId(profile.teacherId);
        setStudentId(null);
      } else {
        setReviewTeacherId(nextTask.createdById);
        setStudentId(null);
      }

      setTask(nextTask);
    } catch {
      setError('Не удалось загрузить задание');
    } finally {
      setLoading(false);
    }
  }, [numericTaskId, role]);

  useEffect(() => {
    void loadTask();
  }, [loadTask]);

  const downloadAttachment = async (attachmentId: number, fileName: string) => {
    try {
      await taskApi.downloadAttachment(attachmentId, fileName);
    } catch {
      setError('Не удалось скачать файл');
    }
  };

  if (isLoading) {
    return (
      <div className={s.loadingState}>
        <Spinner animation="border" size="sm" />
        <span>Загрузка задания...</span>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className={s.taskDetailPage}>
        <Link to={ROUTES.TASKS} className={s.backLink}>
          <FiArrowLeft />К заданиям
        </Link>
        <Alert variant="danger">{error}</Alert>
      </div>
    );
  }

  if (!task) {
    return null;
  }

  const status = getManagerTaskStatus(task);
  const showTeacherReports =
    role === RoleEnum.TEACHER || role === RoleEnum.ADMIN;
  const isStudentRole =
    role === RoleEnum.STUDENT || role === RoleEnum.GROUP_LEADER;

  return (
    <div className={s.taskDetailPage}>
      <Link to={ROUTES.TASKS} className={s.backLink}>
        <FiArrowLeft />К заданиям
      </Link>

      {error && <Alert variant="danger">{error}</Alert>}

      <section className={s.detailHero}>
        <div className={s.detailHeroTop}>
          <span
            className={`${s.managerStatusBadge} ${s[`managerStatus_${status}`]}`}
          >
            {MANAGER_TASK_STATUS_LABELS[status]}
          </span>
          <span className={s.detailFilesCount}>
            <FiFileText />
            Файлов: {task.attachments.length}
          </span>
        </div>
        <h1>{task.title}</h1>
        <p>{task.description || 'Описание задания не указано'}</p>

        <div className={s.detailMetaGrid}>
          <div className={s.detailMetaItem}>
            <FiBookOpen />
            <span>Дисциплина</span>
            <strong>{task.disciplineName}</strong>
          </div>
          <div className={s.detailMetaItem}>
            <FiUser />
            <span>Преподаватель</span>
            <strong>{task.teacherName}</strong>
          </div>
          <div className={s.detailMetaItem}>
            <FiCalendar />
            <span>Дедлайн</span>
            <strong>{formatTaskDate(task.deadline)}</strong>
          </div>
          <div className={s.detailMetaItem}>
            <FiClock />
            <span>Состояние срока</span>
            <strong>{getDeadlineHint(task.deadline)}</strong>
          </div>
        </div>
      </section>

      <section className={s.detailGrid}>
        <div className={s.detailPanel}>
          <div className={s.detailPanelHeader}>
            <h2>Материалы задания</h2>
          </div>
          <TaskCard
            task={task}
            canEdit={false}
            onDownloadAttachment={downloadAttachment}
          />
        </div>

        <div className={s.detailPanel}>
          <div className={s.detailPanelHeader}>
            <h2>{showTeacherReports ? 'Ответы студентов' : 'Мой ответ'}</h2>
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              onClick={loadTask}
            >
              Обновить
            </Button>
          </div>

          {showTeacherReports && reviewTeacherId != null && (
            <TeacherReportsPanel taskId={task.id} teacherId={reviewTeacherId} />
          )}

          {isStudentRole && studentId != null && (
            <StudentReportsPanel taskId={task.id} studentId={studentId} />
          )}

          {!showTeacherReports && (!isStudentRole || studentId == null) && (
            <Alert variant="light" className="mb-0">
              Не удалось определить профиль пользователя для работы с ответами.
            </Alert>
          )}
        </div>
      </section>
    </div>
  );
};
