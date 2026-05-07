import { useRef, useState } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';

import { DisciplineShort, TeacherShort } from '@entities/scheduleRequest';
import {
  UMM_KIND_LABELS,
  UmmMaterialDto,
  UmmMaterialKind,
  UmmMaterialShortDto,
} from '@entities/ummRequest';

type EditingMaterial = UmmMaterialDto | UmmMaterialShortDto;

type SubmitData = {
  title: string;
  description: string | null;
  disciplineId: number;
  authorId: number;
  materialKind: UmmMaterialKind;
  section: string | null;
  urls: string[];
  files: File[];
};

type Props = {
  disciplines: DisciplineShort[];
  teachers: TeacherShort[];
  teacherId: number | null;
  /** Если задан — дисциплина фиксирована (страница дисциплины) */
  fixedDisciplineId?: number;
  editingMaterial: EditingMaterial | null;
  isSubmitting: boolean;
  showAuthorSelect: boolean;
  onSubmit: (data: SubmitData) => Promise<void>;
  onCancel: () => void;
};

const kindFromEditing = (m: EditingMaterial | null): UmmMaterialKind => {
  if (!m || !('materialKind' in m) || !m.materialKind) {
    return 'GENERAL';
  }
  return m.materialKind;
};

export const UmmForm = ({
  disciplines,
  teachers,
  teacherId,
  fixedDisciplineId,
  editingMaterial,
  isSubmitting,
  showAuthorSelect,
  onSubmit,
  onCancel,
}: Props) => {
  const [title, setTitle] = useState(editingMaterial?.title ?? '');
  const [description, setDescription] = useState(
    editingMaterial?.description ?? ''
  );
  const [disciplineId, setDisciplineId] = useState<number | null>(
    fixedDisciplineId ?? editingMaterial?.disciplineId ?? null
  );
  const [materialKind, setMaterialKind] = useState<UmmMaterialKind>(
    kindFromEditing(editingMaterial)
  );
  const [section, setSection] = useState(editingMaterial?.section ?? '');
  const [selectedAuthorId, setSelectedAuthorId] = useState<number | null>(
    editingMaterial?.authorId ?? teacherId
  );
  const [urlsText, setUrlsText] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [validated, setValidated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fixedDisciplineName =
    fixedDisciplineId != null
      ? disciplines.find((d) => d.id === fixedDisciplineId)?.name
      : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const resolvedDisciplineId = fixedDisciplineId ?? disciplineId;
    const isValid = form.checkValidity() && resolvedDisciplineId != null;
    if (!isValid) {
      setValidated(true);
      return;
    }

    const resolvedAuthorId = selectedAuthorId ?? teacherId;
    if (!resolvedAuthorId) {
      setValidated(true);
      return;
    }

    const parsedUrls = urlsText
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        disciplineId: resolvedDisciplineId,
        authorId: resolvedAuthorId,
        materialKind,
        section: section.trim() ? section.trim() : null,
        urls: parsedUrls,
        files,
      });
      if (!editingMaterial) {
        setTitle('');
        setDescription('');
        setDisciplineId(fixedDisciplineId ?? null);
        setMaterialKind('GENERAL');
        setSection('');
        setUrlsText('');
        setFiles([]);
        setValidated(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setUrlsText('');
        setFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch {
      // parent handles error display
    }
  };

  const kindEntries = Object.entries(UMM_KIND_LABELS) as [
    UmmMaterialKind,
    string,
  ][];

  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit}>
      <Row className="g-3">
        <Col md={6}>
          <Form.Group controlId="umm-title">
            <Form.Label>Название материала</Form.Label>
            <Form.Control
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название"
            />
            <Form.Control.Feedback type="invalid">
              Введите название
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col md={6}>
          {fixedDisciplineId != null && fixedDisciplineName ? (
            <Form.Group controlId="umm-discipline-fixed">
              <Form.Label>Предмет</Form.Label>
              <Form.Control
                plaintext
                readOnly
                className="py-2"
                value={fixedDisciplineName}
              />
            </Form.Group>
          ) : (
            <Form.Group controlId="umm-discipline">
              <Form.Label>Предмет</Form.Label>
              <Form.Select
                required
                value={disciplineId ?? ''}
                onChange={(e) =>
                  setDisciplineId(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              >
                <option value="">Выберите предмет</option>
                {disciplines.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                Выберите предмет
              </Form.Control.Feedback>
            </Form.Group>
          )}
        </Col>

        <Col xs={12}>
          <Form.Group controlId="umm-description">
            <Form.Label>Описание</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание материала"
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="umm-kind">
            <Form.Label>Тип материала</Form.Label>
            <Form.Select
              value={materialKind}
              onChange={(e) =>
                setMaterialKind(e.target.value as UmmMaterialKind)
              }
            >
              {kindEntries.map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Общее, УМК, лекции, лабораторные или дополнительные материалы
            </Form.Text>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="umm-section">
            <Form.Label>Раздел курса</Form.Label>
            <Form.Control
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="Необязательно: тема модуля для фильтра на странице дисциплины"
            />
          </Form.Group>
        </Col>

        {showAuthorSelect && (
          <Col md={6}>
            <Form.Group controlId="umm-author">
              <Form.Label>Автор</Form.Label>
              <Form.Select
                required
                value={selectedAuthorId ?? ''}
                onChange={(e) =>
                  setSelectedAuthorId(
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
                Выберите автора
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        )}

        <Col md={showAuthorSelect ? 6 : 12}>
          <Form.Group controlId="umm-urls">
            <Form.Label>Ссылки</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={urlsText}
              onChange={(e) => setUrlsText(e.target.value)}
              placeholder="По одной ссылке на строку"
            />
            <Form.Text className="text-muted">
              Разделяйте ссылки переносом строки или запятой
            </Form.Text>
          </Form.Group>
        </Col>

        <Col xs={12}>
          <Form.Group controlId="umm-files">
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
            : editingMaterial
              ? 'Сохранить изменения'
              : 'Создать материал'}
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
