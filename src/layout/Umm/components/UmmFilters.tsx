import { Button, Col, Form, Row } from 'react-bootstrap';

import { TeacherShort } from '@entities/scheduleRequest';
import { UmmCatalogFilters } from '@entities/ummRequest';

import s from '../Umm.module.css';

type Props = {
  value: UmmCatalogFilters;
  teachers: TeacherShort[];
  onChange: (patch: Partial<UmmCatalogFilters>) => void;
  onReset: () => void;
};

export const UmmFilters = ({
  value,
  teachers,
  onChange,
  onReset,
}: Props) => {
  return (
    <div className={s.filters}>
      <Row className="g-3 align-items-end">
        <Col md={7}>
          <Form.Group controlId="umm-search">
            <Form.Label className="mb-1 small fw-semibold">
              Поиск по названию, описанию, разделу и имени файла
            </Form.Label>
            <Form.Control
              type="search"
              value={value.search}
              onChange={(e) => onChange({ search: e.target.value })}
              placeholder="Ключевые слова по всем дисциплинам…"
            />
          </Form.Group>
        </Col>

        <Col md={4}>
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
