import { useRef, useState } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';

import { DisciplineShort, TeacherShort } from '@entities/scheduleRequest';
import { TaskDto } from '@entities/taskRequest';

type Props = {
  disciplines: DisciplineShort[];
  teachers: TeacherShort[];
  teacherId: number | null;
  editingTask: TaskDto | null;
  isSubmitting: boolean;
  showTeacherSelect: boolean;
  onSubmit: (data: {
    title: string;
    description: string;
    disciplineId: number;
    createdById: number;
    deadline: string | null;
    files: File[];
  }) => Promise<void>;
  onCancel: () => void;
};

const toDatetimeLocalValue = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const fromDatetimeLocalValue = (value: string): string | null => {
  if (!value) return null;
  return `${value}:00`;
};

export const TaskForm = ({
  disciplines,
  teachers,
  teacherId,
  editingTask,
  isSubmitting,
  showTeacherSelect,
  onSubmit,
  onCancel,
}: Props) => {
  const [title, setTitle] = useState(editingTask?.title ?? '');
  const [description, setDescription] = useState(
    editingTask?.description ?? ''
  );
  const [disciplineId, setDisciplineId] = useState<number | null>(
    editingTask
      ? (disciplines.find((d) => d.name === editingTask.disciplineName)?.id ??
          null)
      : null
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(
    editingTask
      ? (teachers.find((t) => t.fullName === editingTask.teacherName)?.id ??
          null)
      : teacherId
  );
  const [deadline, setDeadline] = useState<string>(
    toDatetimeLocalValue(editingTask?.deadline)
  );
  const [files, setFiles] = useState<File[]>([]);
  const [validated, setValidated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    if (!form.checkValidity() || !disciplineId) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    const resolvedTeacherId = selectedTeacherId ?? teacherId;
    if (!resolvedTeacherId) {
      setValidated(true);
      return;
    }

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      disciplineId,
      createdById: resolvedTeacherId,
      deadline: fromDatetimeLocalValue(deadline),
      files,
    });

    setTitle('');
    setDescription('');
    setDisciplineId(null);
    setDeadline('');
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit}>
      <Row className="g-3">
        <Col md={6}>
          <Form.Group controlId="task-title">
            <Form.Label>Название задания</Form.Label>
            <Form.Control
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название"
            />
            <Form.Control.Feedback type="invalid">
              Введите название задания
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="task-discipline">
            <Form.Label>Дисциплина</Form.Label>
            <Form.Select
              required
              value={disciplineId ?? ''}
              onChange={(e) =>
                setDisciplineId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">Выберите дисциплину</option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              Выберите дисциплину
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col xs={12}>
          <Form.Group controlId="task-description">
            <Form.Label>Описание задания</Form.Label>
            <Form.Control
              required
              as="textarea"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишите задание подробно"
            />
            <Form.Control.Feedback type="invalid">
              Введите описание задания
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="task-deadline">
            <Form.Label>Дедлайн</Form.Label>
            <Form.Control
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
            <Form.Text className="text-muted">
              Оставьте пустым, если дедлайна нет
            </Form.Text>
          </Form.Group>
        </Col>

        {showTeacherSelect && (
          <Col md={6}>
            <Form.Group controlId="task-teacher">
              <Form.Label>Преподаватель</Form.Label>
              <Form.Select
                required
                value={selectedTeacherId ?? ''}
                onChange={(e) =>
                  setSelectedTeacherId(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              >
                <option value="">Выберите преподавателя</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                Выберите преподавателя
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        )}

        <Col md={12}>
          <Form.Group controlId="task-file">
            <Form.Label>Прикрепить файлы</Form.Label>
            <Form.Control
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
            />
          </Form.Group>
        </Col>
      </Row>

      <div className="d-flex gap-2 mt-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Сохранение...'
            : editingTask
              ? 'Сохранить изменения'
              : 'Создать задание'}
        </Button>
        <Button
          type="button"
          variant="outline-secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Отмена
        </Button>
      </div>
    </Form>
  );
};
