import { Button, Col, Form, Row } from 'react-bootstrap';

import { DisciplineShort, TeacherShort } from '@entities/scheduleRequest';
import { UmmFilters as UmmFiltersValue } from '@entities/ummRequest';

import s from '../Umm.module.css';

type Props = {
  value: UmmFiltersValue;
  disciplines: DisciplineShort[];
  teachers: TeacherShort[];
  onChange: (patch: Partial<UmmFiltersValue>) => void;
  onReset: () => void;
};

export const UmmFilters = ({
  value,
  disciplines,
  teachers,
  onChange,
  onReset,
}: Props) => {
  return (
    <div className={s.filters}>
      <Row className="g-3 align-items-end">
        <Col md={5}>
          <Form.Group controlId="umm-search">
            <Form.Label className="mb-1 small fw-semibold">
              Поиск по названию и описанию
            </Form.Label>
            <Form.Control
              type="search"
              value={value.search}
              onChange={(e) => onChange({ search: e.target.value })}
              placeholder="Введите ключевые слова..."
            />
          </Form.Group>
        </Col>

        <Col md={3}>
          <Form.Group controlId="umm-discipline">
            <Form.Label className="mb-1 small fw-semibold">Предмет</Form.Label>
            <Form.Select
              value={value.disciplineId ?? ''}
              onChange={(e) =>
                onChange({
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
          <Form.Group controlId="umm-author">
            <Form.Label className="mb-1 small fw-semibold">
              Преподаватель
            </Form.Label>
            <Form.Select
              value={value.authorId ?? ''}
              onChange={(e) =>
                onChange({
                  authorId: e.target.value ? Number(e.target.value) : null,
                })
              }
            >
              <option value="">Все преподаватели</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>

        <Col md={1} className="d-flex justify-content-end">
          <Button variant="outline-secondary" size="sm" onClick={onReset}>
            Сбросить
          </Button>
        </Col>
      </Row>
    </div>
  );
};
