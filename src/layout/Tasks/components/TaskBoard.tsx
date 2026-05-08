import { ReactNode, useMemo, useState } from 'react';
import { Alert, Button, Card, Form, Spinner } from 'react-bootstrap';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiFilter,
  FiPlus,
  FiSearch,
} from 'react-icons/fi';

import { DisciplineShort, TeacherShort } from '@entities/scheduleRequest';
import { TaskDto } from '@entities/taskRequest';

import {
  getManagerTaskStatus,
  MANAGER_TASK_STATUS_LABELS,
  ManagerTaskStatus,
} from '../taskUi';
import { TaskForm } from './TaskForm';
import { TaskManagerList } from './TaskManagerList';

import s from '../Tasks.module.css';

type StatusFilter = 'ALL' | ManagerTaskStatus;

type Props = {
  tasks: TaskDto[];
  disciplines: DisciplineShort[];
  teachers: TeacherShort[];
  selectedDisciplineId: number | null;
  isLoading: boolean;
  isSubmitting: boolean;
  emptyText: string;
  toolbarTitle: string;
  toolbarSubtitle: string;
  canCreate?: boolean;
  canEdit?: boolean;
  teacherId?: number | null;
  showTeacherSelect?: boolean;
  infoColumnTitle?: string;
  getTaskStatus?: (task: TaskDto) => ManagerTaskStatus;
  getTaskStatusLabel?: (task: TaskDto, status: ManagerTaskStatus) => string;
  renderInfoCell?: (task: TaskDto) => ReactNode;
  onSelectDiscipline: (disciplineId: number | null) => void;
  onAdd?: (
    title: string,
    description: string,
    disciplineId: number,
    createdById: number,
    deadline: string | null,
    files?: File[]
  ) => Promise<void>;
  onUpdate?: (
    taskId: number,
    params: {
      title?: string;
      description?: string;
      disciplineId?: number;
      deadline?: string | null;
      files?: File[];
    }
  ) => Promise<void>;
  onDelete?: (taskId: number) => Promise<void>;
};

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Все задания' },
  { value: 'ACTIVE', label: 'Активные' },
  { value: 'REVIEW', label: 'На проверке' },
  { value: 'COMPLETED', label: 'Завершенные' },
  { value: 'OVERDUE', label: 'Просроченные' },
];

export const TaskBoard = ({
  tasks,
  disciplines,
  teachers,
  selectedDisciplineId,
  isLoading,
  isSubmitting,
  emptyText,
  toolbarTitle,
  toolbarSubtitle,
  canCreate = false,
  canEdit = false,
  teacherId = null,
  showTeacherSelect = false,
  infoColumnTitle = 'Ответы',
  getTaskStatus = getManagerTaskStatus,
  getTaskStatusLabel,
  renderInfoCell,
  onSelectDiscipline,
  onAdd,
  onUpdate,
  onDelete,
}: Props) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDto | null>(null);

  const tasksWithStatus = useMemo(
    () =>
      tasks.map((task) => ({
        task,
        status: getTaskStatus(task),
      })),
    [getTaskStatus, tasks]
  );

  const statusCounts = useMemo(() => {
    return tasksWithStatus.reduce<Record<StatusFilter, number>>(
      (acc, item) => {
        acc.ALL += 1;
        acc[item.status] += 1;
        return acc;
      },
      {
        ALL: 0,
        ACTIVE: 0,
        REVIEW: 0,
        COMPLETED: 0,
        OVERDUE: 0,
      }
    );
  }, [tasksWithStatus]);

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return tasksWithStatus
      .filter(({ task, status }) => {
        if (
          selectedDisciplineId != null &&
          task.disciplineId !== selectedDisciplineId
        ) {
          return false;
        }

        if (statusFilter !== 'ALL' && status !== statusFilter) {
          return false;
        }

        if (!query) {
          return true;
        }

        return [
          task.title,
          task.description,
          task.disciplineName,
          task.teacherName,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));
      })
      .map(({ task }) => task);
  }, [searchQuery, selectedDisciplineId, statusFilter, tasksWithStatus]);

  const resetFilters = () => {
    onSelectDiscipline(null);
    setStatusFilter('ALL');
    setSearchQuery('');
  };

  const handleCreate = async (data: {
    title: string;
    description: string;
    disciplineId: number;
    createdById: number;
    deadline: string | null;
    files: File[];
  }) => {
    if (!onAdd) return;
    await onAdd(
      data.title,
      data.description,
      data.disciplineId,
      data.createdById,
      data.deadline,
      data.files
    );
    setShowForm(false);
  };

  const handleUpdate = async (data: {
    title: string;
    description: string;
    disciplineId: number;
    deadline: string | null;
    files: File[];
  }) => {
    if (!editingTask || !onUpdate) return;
    await onUpdate(editingTask.id, {
      title: data.title,
      description: data.description,
      disciplineId: data.disciplineId,
      deadline: data.deadline,
      files: data.files.length > 0 ? data.files : undefined,
    });
    setEditingTask(null);
  };

  const handleEdit = (task: TaskDto) => {
    setEditingTask(task);
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const showCreateButton = canCreate && Boolean(onAdd);
  const showEditActions = canEdit && Boolean(onUpdate);

  return (
    <>
      <section className={s.managerStats}>
        <div className={s.managerStatCard}>
          <span className={`${s.managerStatIcon} ${s.iconBlue}`}>
            <FiFileText />
          </span>
          <div>
            <span>Всего заданий</span>
            <strong>{statusCounts.ALL}</strong>
            <small>Все время</small>
          </div>
        </div>
        <div className={s.managerStatCard}>
          <span className={`${s.managerStatIcon} ${s.iconGreen}`}>
            <FiCheckCircle />
          </span>
          <div>
            <span>Активные</span>
            <strong>{statusCounts.ACTIVE}</strong>
            <small>Сейчас</small>
          </div>
        </div>
        <div className={s.managerStatCard}>
          <span className={`${s.managerStatIcon} ${s.iconOrange}`}>
            <FiClock />
          </span>
          <div>
            <span>На проверке</span>
            <strong>{statusCounts.REVIEW}</strong>
            <small>Требуют внимания</small>
          </div>
        </div>
        <div className={s.managerStatCard}>
          <span className={`${s.managerStatIcon} ${s.iconRed}`}>
            <FiAlertCircle />
          </span>
          <div>
            <span>Просроченные</span>
            <strong>{statusCounts.OVERDUE}</strong>
            <small>Требуют внимания</small>
          </div>
        </div>
      </section>

      <section className={s.managerFilters}>
        <Form.Group controlId="task-discipline-filter">
          <Form.Label>Выберите дисциплину</Form.Label>
          <Form.Select
            value={selectedDisciplineId ?? ''}
            onChange={(event) =>
              onSelectDiscipline(
                event.target.value ? Number(event.target.value) : null
              )
            }
          >
            <option value="">Все дисциплины</option>
            {disciplines.map((discipline) => (
              <option key={discipline.id} value={discipline.id}>
                {discipline.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group controlId="task-status-filter">
          <Form.Label>Статус задания</Form.Label>
          <Form.Select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
          >
            {STATUS_TABS.map((tab) => (
              <option key={tab.value} value={tab.value}>
                {tab.value === 'ALL'
                  ? 'Все статусы'
                  : MANAGER_TASK_STATUS_LABELS[tab.value]}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group controlId="task-search" className={s.searchGroup}>
          <Form.Label>Поиск заданий</Form.Label>
          <div className={s.searchInput}>
            <FiSearch />
            <Form.Control
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Название, описание, дисциплина..."
            />
          </div>
        </Form.Group>

        <Button
          type="button"
          variant="outline-secondary"
          className={s.filterButton}
          onClick={resetFilters}
        >
          <FiFilter />
          Сбросить
        </Button>
      </section>

      <div
        className={s.managerTabs}
        role="tablist"
        aria-label="Статусы заданий"
      >
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`${s.managerTab} ${
              statusFilter === tab.value ? s.managerTabActive : ''
            }`}
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
            <span>{statusCounts[tab.value]}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className={s.loadingState}>
          <Spinner animation="border" size="sm" />
          <span>Загрузка заданий...</span>
        </div>
      ) : (
        <div className={s.managerSection}>
          {!showForm && !editingTask && (
            <div className={s.managerToolbar}>
              <div>
                <strong>{toolbarTitle}</strong>
                <span>{toolbarSubtitle}</span>
              </div>
              {showCreateButton && (
                <Button onClick={() => setShowForm(true)}>
                  <FiPlus />
                  Создать задание
                </Button>
              )}
            </div>
          )}

          {showForm && (
            <Card className={s.formCard}>
              <Card.Body>
                <Card.Title className="mb-3">Новое задание</Card.Title>
                <TaskForm
                  disciplines={disciplines}
                  teachers={teachers}
                  teacherId={teacherId}
                  editingTask={null}
                  isSubmitting={isSubmitting}
                  showTeacherSelect={showTeacherSelect}
                  onSubmit={handleCreate}
                  onCancel={handleCancel}
                />
              </Card.Body>
            </Card>
          )}

          {editingTask && (
            <Card className={s.formCard}>
              <Card.Body>
                <Card.Title className="mb-3">Редактирование задания</Card.Title>
                <TaskForm
                  disciplines={disciplines}
                  teachers={teachers}
                  teacherId={teacherId}
                  editingTask={editingTask}
                  isSubmitting={isSubmitting}
                  showTeacherSelect={showTeacherSelect}
                  onSubmit={handleUpdate}
                  onCancel={handleCancel}
                />
              </Card.Body>
            </Card>
          )}

          {filteredTasks.length === 0 ? (
            <Alert variant="light">{emptyText}</Alert>
          ) : (
            <TaskManagerList
              tasks={filteredTasks}
              canEdit={showEditActions}
              infoColumnTitle={infoColumnTitle}
              getStatus={getTaskStatus}
              getStatusLabel={getTaskStatusLabel}
              renderInfoCell={renderInfoCell}
              onEdit={showEditActions ? handleEdit : undefined}
              onDelete={canEdit ? onDelete : undefined}
            />
          )}
        </div>
      )}
    </>
  );
};
