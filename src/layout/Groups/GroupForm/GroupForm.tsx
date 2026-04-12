import { useState } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';

import { GroupFormValues } from '@entities/adminRequest';

type Props = {
  values: GroupFormValues;
  submitText: string;
  isSubmitting?: boolean;
  onSubmit: () => Promise<void>;
  onFieldChange: <K extends keyof GroupFormValues>(
    field: K,
    value: GroupFormValues[K]
  ) => void;
  onCancel?: () => void;
};

export const GroupForm = ({
  values,
  submitText,
  isSubmitting = false,
  onSubmit,
  onFieldChange,
  onCancel,
}: Props) => {
  const [validated, setValidated] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.checkValidity()) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    await onSubmit();
  };

  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit}>
      <Row className="g-3">
        <Col md={4}>
          <Form.Group controlId="group-name">
            <Form.Label>Название группы</Form.Label>
            <Form.Control
              required
              type="text"
              name="name"
              value={values.name}
              onChange={(e) => onFieldChange('name', e.target.value)}
              placeholder="Например, ИВТ-101"
            />
            <Form.Control.Feedback type="invalid">
              Введите название группы
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col md={4}>
          <Form.Group controlId="group-course-number">
            <Form.Label>Номер курса</Form.Label>
            <Form.Control
              required
              min={1}
              type="number"
              name="courseNumber"
              value={values.courseNumber}
              onChange={(e) =>
                onFieldChange('courseNumber', Number(e.target.value))
              }
              placeholder="Например, 1"
            />
            <Form.Control.Feedback type="invalid">
              Введите корректный номер курса
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col md={4}>
          <Form.Group controlId="group-specialty">
            <Form.Label>Специальность</Form.Label>
            <Form.Control
              required
              type="text"
              name="specialty"
              value={values.specialty}
              onChange={(e) => onFieldChange('specialty', e.target.value)}
              placeholder="Например, Программная инженерия"
            />
            <Form.Control.Feedback type="invalid">
              Введите специальность
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <div className="d-flex gap-2 mt-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Сохранение...' : submitText}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
        )}
      </div>
    </Form>
  );
};
