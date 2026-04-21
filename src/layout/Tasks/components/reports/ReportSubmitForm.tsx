import { useRef, useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';

type Props = {
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (comment: string, files: File[]) => Promise<void>;
};

export const ReportSubmitForm = ({ isSubmitting, error, onSubmit }: Props) => {
  const [comment, setComment] = useState('');
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
    const trimmed = comment.trim();
    if (!trimmed && files.length === 0) {
      setValidated(true);
      return;
    }

    try {
      await onSubmit(trimmed, files);
      setComment('');
      setFiles([]);
      setValidated(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch {
      // error is rendered by parent via error prop
    }
  };

  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit}>
      {error && (
        <Alert variant="danger" className="mb-2 py-1 px-2 small">
          {error}
        </Alert>
      )}

      <Form.Group controlId="report-comment" className="mb-2">
        <Form.Label className="mb-1 small fw-semibold">
          Комментарий к ответу
        </Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Опишите выполненную работу или оставьте пояснение"
          isInvalid={validated && !comment.trim() && files.length === 0}
        />
        <Form.Control.Feedback type="invalid">
          Добавьте комментарий или прикрепите файл
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group controlId="report-files" className="mb-2">
        <Form.Label className="mb-1 small fw-semibold">
          Прикрепить файлы
        </Form.Label>
        <Form.Control
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
        />
      </Form.Group>

      <div className="d-flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Отправка...' : 'Отправить ответ'}
        </Button>
      </div>
    </Form>
  );
};
