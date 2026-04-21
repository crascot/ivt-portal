import { Button, Col, Form, Row } from 'react-bootstrap';

import { DisciplineShort } from '@entities/scheduleRequest';
import {
  STUDENT_TASK_STATUS_LABELS,
  StudentTaskStatus,
  TaskFilters as TaskFiltersValue,
} from '@entities/taskRequest';

import s from '../Tasks.module.css';

type Props = {
  value: TaskFiltersValue;
  disciplines: DisciplineShort[];
  onChange: (next: TaskFiltersValue) => void;
  onReset: () => void;
};

const STATUS_OPTIONS: StudentTaskStatus[] = [
  StudentTaskStatus.NotSubmitted,
  StudentTaskStatus.UnderReview,
  StudentTaskStatus.NeedsRework,
  StudentTaskStatus.Accepted,
  StudentTaskStatus.AcceptedLate,
];

export const TaskFilters = ({
  value,
  disciplines,
  onChange,
  onReset,
}: Props) => {
  const toggleStatus = (status: StudentTaskStatus) => {
    const next = value.statuses.includes(status)
      ? value.statuses.filter((x) => x !== status)
      : [...value.statuses, status];
    onChange({ ...value, statuses: next });
  };

  return (
    <div className={s.filters}>
      <Row className="g-3 align-items-end">
        <Col md={3}>
          <Form.Group controlId="filter-discipline">
            <Form.Label className="mb-1 small fw-semibold">Предмет</Form.Label>
            <Form.Select
              value={value.disciplineId ?? ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  disciplineId: e.target.value ? Number(e.target.value) : null,
                })
              }
            >
              <option value="">Все предметы</option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>

        <Col md={3}>
          <Form.Group controlId="filter-created">
            <Form.Label className="mb-1 small fw-semibold">Создано</Form.Label>
            <div className="d-flex gap-1">
              <Form.Control
                type="date"
                value={value.createdFrom ?? ''}
                onChange={(e) =>
                  onChange({ ...value, createdFrom: e.target.value || null })
                }
                placeholder="с"
              />
            </div>
          </Form.Group>
        </Col>

        <Col md={3}>
          <Form.Group controlId="filter-created">
            <Form.Label className="mb-1 small fw-semibold">Дедлайн</Form.Label>
            <div className="d-flex gap-1">
              <Form.Control
                type="date"
                value={value.deadlineFrom ?? ''}
                onChange={(e) =>
                  onChange({ ...value, deadlineFrom: e.target.value || null })
                }
              />
            </div>
          </Form.Group>
        </Col>

        <Col md={3} className="d-flex justify-content-end">
          <Button variant="outline-secondary" size="sm" onClick={onReset}>
            Сбросить
          </Button>
        </Col>
      </Row>

      <div className={s.statusChips}>
        {STATUS_OPTIONS.map((status) => {
          const active = value.statuses.includes(status);
          return (
            <button
              key={status}
              type="button"
              onClick={() => toggleStatus(status)}
              className={`${s.statusChip} ${s[`status_${status}`]} ${
                active ? s.statusChipActive : ''
              }`}
            >
              {STUDENT_TASK_STATUS_LABELS[status]}
            </button>
          );
        })}
      </div>
    </div>
  );
};
