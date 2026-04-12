import { useEffect, useMemo, useState } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';

type FieldType = 'text' | 'number' | 'textarea';

type FieldConfig<TValues> = {
  name: keyof TValues;
  label: string;
  type?: FieldType;
  placeholder?: string;
  required?: boolean;
  min?: number;
  md?: number;
  invalidFeedback?: string;
};

type Props<TValues, TSubmitDto> = {
  initialValues: TValues;
  fields: FieldConfig<TValues>[];
  submitText: string;
  isSubmitting?: boolean;
  onSubmit: (values: TSubmitDto) => Promise<void>;
  mapValuesToSubmit: (values: TValues) => TSubmitDto;
  onCancel?: () => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EntityForm = <TValues extends Record<string, any>, TSubmitDto>({
  initialValues,
  fields,
  submitText,
  isSubmitting = false,
  onSubmit,
  mapValuesToSubmit,
  onCancel,
}: Props<TValues, TSubmitDto>) => {
  const [values, setValues] = useState<TValues>(initialValues);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = event.target;

    setValues((prev) => ({
      ...prev,
      [name]: type === 'number' ? value : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.checkValidity()) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    await onSubmit(mapValuesToSubmit(values));
  };

  const renderedFields = useMemo(() => {
    return fields.map((field) => {
      const fieldName = String(field.name);
      const value = values[field.name] ?? '';
      const controlType = field.type ?? 'text';
      const md = field.md ?? 12;

      return (
        <Col md={md} key={fieldName}>
          <Form.Group controlId={fieldName}>
            <Form.Label>{field.label}</Form.Label>

            {controlType === 'textarea' ? (
              <Form.Control
                as="textarea"
                rows={3}
                name={fieldName}
                value={value}
                onChange={handleChange}
                placeholder={field.placeholder}
                required={field.required}
              />
            ) : (
              <Form.Control
                type={controlType}
                name={fieldName}
                value={value}
                onChange={handleChange}
                placeholder={field.placeholder}
                required={field.required}
                min={field.min}
              />
            )}

            {field.invalidFeedback && (
              <Form.Control.Feedback type="invalid">
                {field.invalidFeedback}
              </Form.Control.Feedback>
            )}
          </Form.Group>
        </Col>
      );
    });
  }, [fields, values]);

  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit}>
      <Row className="g-3">{renderedFields}</Row>

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
