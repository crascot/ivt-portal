import { useState } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';

import { DisciplineFormValues } from '@entities/adminRequest';

type Props = {
  values: DisciplineFormValues;
  submitText: string;
  isSubmitting?: boolean;
  onSubmit: () => Promise<void>;
  onFieldChange: <K extends keyof DisciplineFormValues>(
    field: K,
    value: DisciplineFormValues[K]
  ) => void;
  onCancel?: () => void;
};

export const DisciplineForm = ({
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
        <Col md={6}>
          <Form.Group controlId="discipline-name">
            <Form.Label>Название дисциплины</Form.Label>
            <Form.Control
              required
              type="text"
              value={values.name}
              onChange={(e) => onFieldChange('name', e.target.value)}
              placeholder="Например, Алгоритмы и структуры данных"
            />
            <Form.Control.Feedback type="invalid">
              Введите название дисциплины
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="discipline-description">
            <Form.Label>Описание</Form.Label>
            <Form.Control
              required
              as="textarea"
              rows={3}
              value={values.description}
              onChange={(e) => onFieldChange('description', e.target.value)}
              placeholder="Введите описание дисциплины"
            />
            <Form.Control.Feedback type="invalid">
              Введите описание дисциплины
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
