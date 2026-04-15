import { FormEvent, useCallback, useState } from 'react';
import { Alert, Button, Col, Form, Row, Spinner } from 'react-bootstrap';

import {
  AddScheduleDto,
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_ORDER,
  DayOfWeek,
  DisciplineShort,
  ScheduleDto,
  TeacherShort,
} from '@entities/scheduleRequest';

type Props = {
  groupId: number;
  disciplines: DisciplineShort[];
  teachers: TeacherShort[];
  editingItem: ScheduleDto | null;
  existingSchedule: ScheduleDto[];
  onSubmit: (dto: AddScheduleDto) => Promise<void>;
  onCancel: () => void;
};

type FormValues = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string;
  url: string;
  disciplineId: number;
  teacherId: number;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  dayOfWeek: DayOfWeek.Monday,
  startTime: '08:00',
  endTime: '09:30',
  room: '',
  url: '',
  disciplineId: 0,
  teacherId: 0,
};

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const hasTimeOverlap = (
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean => {
  const a0 = timeToMinutes(startA);
  const a1 = timeToMinutes(endA);
  const b0 = timeToMinutes(startB);
  const b1 = timeToMinutes(endB);
  return a0 < b1 && b0 < a1;
};

export const ScheduleForm = ({
  groupId,
  disciplines,
  teachers,
  editingItem,
  existingSchedule,
  onSubmit,
  onCancel,
}: Props) => {
  const [values, setValues] = useState<FormValues>(() => {
    if (editingItem) {
      const disc = disciplines.find(
        (d) => d.name === editingItem.disciplineName
      );
      const teacher = teachers.find(
        (t) => t.fullName === editingItem.teacherName
      );
      return {
        dayOfWeek: (editingItem.dayOfWeek as DayOfWeek) || DayOfWeek.Monday,
        startTime: editingItem.startTime || '08:00',
        endTime: editingItem.endTime || '09:30',
        room: editingItem.room || '',
        url: editingItem.url || '',
        disciplineId: disc?.id || 0,
        teacherId: teacher?.id || 0,
      };
    }
    return INITIAL_VALUES;
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof FormValues, value: string | number) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (field === 'dayOfWeek' || field === 'startTime' || field === 'endTime') {
      setConflictWarning(null);
    }
  };

  const validate = useCallback((): boolean => {
    const next: FieldErrors = {};

    if (!values.startTime) {
      next.startTime = 'Укажите время начала';
    }
    if (!values.endTime) {
      next.endTime = 'Укажите время окончания';
    }
    if (
      values.startTime &&
      values.endTime &&
      timeToMinutes(values.endTime) <= timeToMinutes(values.startTime)
    ) {
      next.endTime = 'Время окончания должно быть позже начала';
    }
    if (!values.disciplineId) {
      next.disciplineId = 'Выберите дисциплину';
    }
    if (!values.teacherId) {
      next.teacherId = 'Выберите преподавателя';
    }

    setErrors(next);

    if (Object.keys(next).length > 0) return false;

    const conflicting = existingSchedule.filter((item) => {
      if (editingItem && item.id === editingItem.id) return false;
      if (item.dayOfWeek !== values.dayOfWeek) return false;
      return hasTimeOverlap(
        values.startTime,
        values.endTime,
        item.startTime,
        item.endTime
      );
    });

    if (conflicting.length > 0) {
      const names = conflicting
        .map((c) => `«${c.disciplineName}» (${c.startTime}–${c.endTime})`)
        .join(', ');
      setConflictWarning(
        `Пересечение по времени с: ${names}. Проверьте расписание.`
      );
      return false;
    }

    setConflictWarning(null);
    return true;
  }, [values, existingSchedule, editingItem]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        dayOfWeek: values.dayOfWeek,
        startTime: values.startTime,
        endTime: values.endTime,
        room: values.room || undefined,
        url: values.url || undefined,
        groupId,
        disciplineId: values.disciplineId,
        teacherId: values.teacherId,
      });
      if (!editingItem) {
        setValues(INITIAL_VALUES);
        setErrors({});
        setConflictWarning(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form noValidate onSubmit={handleSubmit}>
      {conflictWarning && (
        <Alert variant="warning" className="mb-3">
          {conflictWarning}
        </Alert>
      )}

      <Row className="g-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label>День недели</Form.Label>
            <Form.Select
              value={values.dayOfWeek}
              onChange={(e) => handleChange('dayOfWeek', e.target.value)}
            >
              {DAY_OF_WEEK_ORDER.map((day) => (
                <option key={day} value={day}>
                  {DAY_OF_WEEK_LABELS[day]}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>

        <Col md={4}>
          <Form.Group>
            <Form.Label>Начало</Form.Label>
            <Form.Control
              type="time"
              value={values.startTime}
              onChange={(e) => handleChange('startTime', e.target.value)}
              isInvalid={!!errors.startTime}
            />
            <Form.Control.Feedback type="invalid">
              {errors.startTime}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col md={4}>
          <Form.Group>
            <Form.Label>Конец</Form.Label>
            <Form.Control
              type="time"
              value={values.endTime}
              onChange={(e) => handleChange('endTime', e.target.value)}
              isInvalid={!!errors.endTime}
            />
            <Form.Control.Feedback type="invalid">
              {errors.endTime}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label>Дисциплина</Form.Label>
            <Form.Select
              value={values.disciplineId}
              onChange={(e) =>
                handleChange('disciplineId', Number(e.target.value))
              }
              isInvalid={!!errors.disciplineId}
            >
              <option value={0} disabled>
                Выберите дисциплину
              </option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {errors.disciplineId}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label>Преподаватель</Form.Label>
            <Form.Select
              value={values.teacherId}
              onChange={(e) =>
                handleChange('teacherId', Number(e.target.value))
              }
              isInvalid={!!errors.teacherId}
            >
              <option value={0} disabled>
                Выберите преподавателя
              </option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} ({t.position})
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {errors.teacherId}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label>Аудитория</Form.Label>
            <Form.Control
              type="text"
              placeholder="Например: 301"
              value={values.room}
              onChange={(e) => handleChange('room', e.target.value)}
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label>Ссылка на занятие</Form.Label>
            <Form.Control
              type="url"
              placeholder="https://..."
              value={values.url}
              onChange={(e) => handleChange('url', e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>

      <div className="d-flex gap-2 mt-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner animation="border" size="sm" className="me-1" />
              Сохранение...
            </>
          ) : editingItem ? (
            'Сохранить изменения'
          ) : (
            'Добавить занятие'
          )}
        </Button>

        {editingItem && (
          <Button variant="outline-secondary" onClick={onCancel}>
            Отмена
          </Button>
        )}
      </div>
    </Form>
  );
};
