import { useRef, useState } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';

type Props = {
  isSubmitting: boolean;
  onCheck: (comment: string, files: File[]) => Promise<void>;
  onGrade: (grade: number) => Promise<void>;
};

export const TeacherReviewForm = ({
  isSubmitting,
  onCheck,
  onGrade,
}: Props) => {
  const [comment, setComment] = useState('');
  const [grade, setGrade] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetCheckInputs = () => {
    setComment('');
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleCheck = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed) return;
    try {
      await onCheck(trimmed, files);
      resetCheckInputs();
    } catch {
      // handled by parent
    }
  };

  const handleGrade = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = Number(grade);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return;
    try {
      await onGrade(parsed);
      setGrade('');
    } catch {
      // handled by parent
    }
  };

  return (
    <Row className="g-3">
      <Col md={8}>
        <Form onSubmit={handleCheck}>
          <Form.Group controlId={`review-comment-${Math.random()}`}>
            <Form.Label className="mb-1 small fw-semibold">
              Замечания / комментарий
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Опишите недочеты или оставьте комментарий"
              required
            />
          </Form.Group>
          <Form.Group className="mt-2">
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
          <Button
            type="submit"
            size="sm"
            className="mt-2"
            variant="warning"
            disabled={isSubmitting || !comment.trim()}
          >
            {isSubmitting ? 'Сохранение...' : 'Отправить замечания'}
          </Button>
        </Form>
      </Col>
      <Col md={4}>
        <Form onSubmit={handleGrade}>
          <Form.Group>
            <Form.Label className="mb-1 small fw-semibold">
              Оценка (принять)
            </Form.Label>
            <Form.Control
              type="number"
              min={0}
              max={100}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="0 - 100"
              required
            />
          </Form.Group>
          <Button
            type="submit"
            size="sm"
            className="mt-2"
            variant="success"
            disabled={isSubmitting || !grade}
          >
            {isSubmitting ? 'Сохранение...' : 'Принять и оценить'}
          </Button>
        </Form>
      </Col>
    </Row>
  );
};
