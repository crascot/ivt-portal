import { useState } from 'react';
import { Alert, Button, Card } from 'react-bootstrap';

import { DisciplineShort, TeacherShort } from '@entities/scheduleRequest';
import { TaskDto } from '@entities/taskRequest';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';

import s from '../Tasks.module.css';

type Props = {
  tasks: TaskDto[];
  disciplines: DisciplineShort[];
  teachers: TeacherShort[];
  isSubmitting: boolean;
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

export const AdminTasks = ({
  tasks,
  disciplines,
  teachers,
  isSubmitting,
  onAdd,
  onUpdate,
  onDelete,
  onDownloadAttachment,
  onDeleteAttachment,
}: Props) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDto | null>(null);

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
              teacherId={null}
              editingTask={null}
              isSubmitting={isSubmitting}
              showTeacherSelect
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
              teacherId={null}
              editingTask={editingTask}
              isSubmitting={isSubmitting}
              showTeacherSelect
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
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              canEdit
              onEdit={handleEdit}
              onDelete={onDelete}
              onDownloadAttachment={onDownloadAttachment}
              onDeleteAttachment={onDeleteAttachment}
            />
          ))}
        </div>
      )}
    </div>
  );
};
