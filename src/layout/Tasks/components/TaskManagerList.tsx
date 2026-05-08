import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiEye,
  FiFileText,
  FiTrash2,
} from 'react-icons/fi';

import { TaskDto } from '@entities/taskRequest';

import {
  formatTaskDate,
  getDeadlineHint,
  getManagerTaskStatus,
  getTaskDetailPath,
  MANAGER_TASK_STATUS_LABELS,
  ManagerTaskStatus,
} from '../taskUi';

import s from '../Tasks.module.css';

type Props = {
  tasks: TaskDto[];
  canEdit?: boolean;
  infoColumnTitle?: string;
  getStatus?: (task: TaskDto) => ManagerTaskStatus;
  getStatusLabel?: (task: TaskDto, status: ManagerTaskStatus) => string;
  renderInfoCell?: (task: TaskDto) => ReactNode;
  onEdit?: (task: TaskDto) => void;
  onDelete?: (taskId: number) => Promise<void>;
};

export const TaskManagerList = ({
  tasks,
  canEdit = true,
  infoColumnTitle = 'Ответы',
  getStatus = getManagerTaskStatus,
  getStatusLabel,
  renderInfoCell,
  onEdit,
  onDelete,
}: Props) => {
  return (
    <div className={s.taskTable}>
      <div className={`${s.taskRow} ${s.taskTableHead}`}>
        <div>Задание</div>
        <div>Дисциплина</div>
        <div>Статус</div>
        <div>Дедлайн</div>
        <div>{infoColumnTitle}</div>
        <div>Действия</div>
      </div>

      {tasks.map((task) => {
        const status = getStatus(task);
        const statusLabel =
          getStatusLabel?.(task, status) ?? MANAGER_TASK_STATUS_LABELS[status];

        return (
          <div key={task.id} className={s.taskRow}>
            <div className={s.taskTitleCell}>
              <span className={`${s.taskIcon} ${s[`managerStatus_${status}`]}`}>
                <FiFileText />
              </span>
              <div className={s.taskTitleText}>
                <strong>{task.title}</strong>
                <span>{task.description || 'Описание не указано'}</span>
                {task.attachments.length > 0 && (
                  <small>Файлов: {task.attachments.length}</small>
                )}
              </div>
            </div>

            <div className={s.taskMetaCell}>
              <strong>{task.disciplineName}</strong>
              <span>{task.teacherName}</span>
            </div>

            <div>
              <span
                className={`${s.managerStatusBadge} ${s[`managerStatus_${status}`]}`}
              >
                {statusLabel}
              </span>
            </div>

            <div className={s.taskMetaCell}>
              <strong>{formatTaskDate(task.deadline)}</strong>
              <span>{getDeadlineHint(task.deadline)}</span>
            </div>

            {renderInfoCell ? (
              renderInfoCell(task)
            ) : (
              <div className={s.taskAnswersCell}>
                <strong>{task.reportsCount ?? 0}</strong>
                <span>
                  <FiClock /> {task.pendingReportsCount ?? 0} на проверке
                </span>
                <span>
                  <FiCheckCircle /> {task.acceptedReportsCount ?? 0} принято
                </span>
              </div>
            )}

            <div className={s.taskActions}>
              <Link
                to={getTaskDetailPath(task.id)}
                className={s.iconAction}
                title="Открыть задание"
              >
                <FiEye />
              </Link>
              {canEdit && onEdit && (
                <button
                  type="button"
                  className={s.iconAction}
                  title="Редактировать"
                  onClick={() => onEdit(task)}
                >
                  <FiEdit2 />
                </button>
              )}
              {canEdit && onDelete && (
                <button
                  type="button"
                  className={`${s.iconAction} ${s.dangerAction}`}
                  title="Удалить"
                  onClick={() => {
                    if (window.confirm(`Удалить задание "${task.title}"?`)) {
                      void onDelete(task.id);
                    }
                  }}
                >
                  <FiTrash2 />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
