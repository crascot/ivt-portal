import { useState } from 'react';
import { Alert, Button, Card, Collapse } from 'react-bootstrap';

import { DisciplineShort, TeacherShort } from '@entities/scheduleRequest';
import { TaskDto } from '@entities/taskRequest';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { TeacherReportsPanel } from './reports/TeacherReportsPanel';

import s from '../Tasks.module.css';

type Props = {
  tasks: TaskDto[];
  disciplines: DisciplineShort[];
  teachers: TeacherShort[];
  teacherId: number | null;
  isSubmitting: boolean;
  showTeacherSelect: boolean;
  onAdd: (
    title: string,
    description: string,
    disciplineId: number,
    createdById: number,
    deadline: string | null,
    files?: File[]
  ) => Promise<void>;
  onUpdate: (
    taskId: number,
    params: {
      title?: string;
      description?: string;
      disciplineId?: number;
      deadline?: string | null;
      files?: File[];
    }
  ) => Promise<void>;
  onDelete: (taskId: number) => Promise<void>;
  onDownloadAttachment: (attachmentId: number, fileName: string) => void;
  onDeleteAttachment: (attachmentId: number) => Promise<void>;
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

export const TeacherTasks = ({
  tasks,
  disciplines,
  teachers,
  teacherId,
  isSubmitting,
  showTeacherSelect,
  onAdd,
  onUpdate,
  onDelete,
  onDownloadAttachment,
  onDeleteAttachment,
}: Props) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDto | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleCreate = async (data: {
    title: string;
    description: string;
    disciplineId: number;
    createdById: number;
    deadline: string | null;
    files: File[];
  }) => {
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
    if (!editingTask) return;
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

  return (
    <div className="d-flex flex-column gap-3">
      {!showForm && !editingTask && (
        <div>
          <Button onClick={() => setShowForm(true)}>Создать задание</Button>
        </div>
      )}

      {showForm && (
        <Card>
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
        <Card>
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

      {tasks.length === 0 ? (
        <Alert variant="light">Заданий по этой дисциплине пока нет</Alert>
      ) : (
        <div className={s.taskList}>
          {tasks.map((task) => {
            const isExpanded = expandedId === task.id;

            return (
              <div key={task.id} className={s.taskWithReports}>
                <Card
                  as="button"
                  type="button"
                  onClick={() =>
                    setExpandedId((prev) => (prev === task.id ? null : task.id))
                  }
                  className={s.taskHeaderCard}
                >
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                      <div className="flex-grow-1 text-start">
                        <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                          <strong>{task.title}</strong>
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
                        onClick={(event) => {
                          event.stopPropagation();
                          setExpandedId((prev) =>
                            prev === task.id ? null : task.id
                          );
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
                        canEdit
                        onEdit={handleEdit}
                        onDelete={onDelete}
                        onDownloadAttachment={onDownloadAttachment}
                        onDeleteAttachment={onDeleteAttachment}
                      />
                      {teacherId != null && (
                        <TeacherReportsPanel
                          taskId={task.id}
                          teacherId={teacherId}
                        />
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
