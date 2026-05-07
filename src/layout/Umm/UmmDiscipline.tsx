import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  ButtonGroup,
  Card,
  Col,
  Form,
  Row,
  Spinner,
} from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';

import { scheduleApi } from '@api/scheduleApi';
import { ummApi } from '@api/ummApi';
import { useAuth } from '@context/AuthContext';
import { RoleEnum } from '@entities/role-enum';
import { DisciplineShort, TeacherShort } from '@entities/scheduleRequest';
import {
  UMM_KIND_LABELS,
  UmmCreatePayload,
  UmmMaterialKind,
  UmmMaterialShortDto,
  UmmUpdatePayload,
} from '@entities/ummRequest';
import { useUmmDiscipline } from '@hooks/umm/useUmmDiscipline';

import { UmmCard } from './components/UmmCard';
import { UmmForm } from './components/UmmForm';

import s from './Umm.module.css';

const KIND_CHIPS: { kind: UmmMaterialKind | null; label: string }[] = [
  { kind: null, label: 'Все типы' },
  { kind: 'GENERAL', label: UMM_KIND_LABELS.GENERAL },
  { kind: 'UMK', label: UMM_KIND_LABELS.UMK },
  { kind: 'LECTURE', label: UMM_KIND_LABELS.LECTURE },
  { kind: 'LAB', label: UMM_KIND_LABELS.LAB },
  { kind: 'EXTRA', label: UMM_KIND_LABELS.EXTRA },
];

export const UmmDiscipline = () => {
  const { disciplineId: rawId } = useParams<{ disciplineId: string }>();
  const disciplineId = rawId ? Number(rawId) : null;
  const navigate = useNavigate();

  const { user } = useAuth();
  const role = user?.role;
  const canManage = role === RoleEnum.TEACHER || role === RoleEnum.ADMIN;
  const showAuthorSelect = role === RoleEnum.ADMIN;

  const {
    materials,
    sections,
    filters,
    isLoading,
    error,
    updateFilters,
    resetFilters,
    reload,
    setMaterialKind,
    refreshSections,
  } = useUmmDiscipline(disciplineId);

  const [disciplines, setDisciplines] = useState<DisciplineShort[]>([]);
  const [teachers, setTeachers] = useState<TeacherShort[]>([]);
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] =
    useState<UmmMaterialShortDto | null>(null);

  useEffect(() => {
    scheduleApi
      .getDisciplines()
      .then(setDisciplines)
      .catch(() => setDisciplines([]));
    scheduleApi
      .getTeachers()
      .then(setTeachers)
      .catch(() => setTeachers([]));
  }, []);

  useEffect(() => {
    if (role === RoleEnum.TEACHER) {
      scheduleApi
        .getTeacherProfile()
        .then((p) => setTeacherId(p.teacherId))
        .catch(() => setTeacherId(null));
    } else {
      setTeacherId(null);
    }
  }, [role]);

  const disciplineName = useMemo(() => {
    if (disciplineId == null) return '';
    const d = disciplines.find((x) => x.id === disciplineId);
    return d?.name ?? 'Дисциплина';
  }, [disciplines, disciplineId]);

  const handleCreate = async (data: {
    title: string;
    description: string | null;
    disciplineId: number;
    authorId: number;
    materialKind: UmmMaterialKind;
    section: string | null;
    urls: string[];
    files: File[];
  }) => {
    const payload: UmmCreatePayload = {
      title: data.title,
      description: data.description,
      disciplineId: data.disciplineId,
      authorId: data.authorId,
      materialKind: data.materialKind,
      section: data.section,
      urls: data.urls,
      files: data.files,
    };
    setActionError(null);
    setIsSubmitting(true);
    try {
      await ummApi.create(payload);
      setShowForm(false);
      reload();
      refreshSections();
    } catch {
      setActionError('Не удалось создать материал');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: {
    title: string;
    description: string | null;
    disciplineId: number;
    authorId: number;
    materialKind: UmmMaterialKind;
    section: string | null;
    urls: string[];
    files: File[];
  }) => {
    if (!editingMaterial) return;
    const payload: UmmUpdatePayload = {
      title: data.title,
      description: data.description,
      disciplineId: data.disciplineId,
      materialKind: data.materialKind,
      section: data.section,
      urls: data.urls.length > 0 ? data.urls : undefined,
      files: data.files.length > 0 ? data.files : undefined,
    };
    setActionError(null);
    setIsSubmitting(true);
    try {
      await ummApi.update(editingMaterial.id, payload);
      setEditingMaterial(null);
      reload();
      refreshSections();
    } catch {
      setActionError('Не удалось обновить материал');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setActionError(null);
    try {
      await ummApi.delete(id);
      reload();
      refreshSections();
    } catch {
      setActionError('Не удалось удалить материал');
    }
  };

  const sectionOptions = useMemo(() => {
    const fromApi = new Set(sections);
    for (const m of materials) {
      if (m.section?.trim()) {
        fromApi.add(m.section.trim());
      }
    }
    return [...fromApi].sort((a, b) => a.localeCompare(b, 'ru'));
  }, [sections, materials]);

  if (disciplineId == null || Number.isNaN(disciplineId)) {
    return <Alert variant="danger">Некорректная дисциплина</Alert>;
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => navigate(-1)}
          >
            ← Назад к каталогу
          </Button>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={reload}
              disabled={isLoading}
            >
              Обновить
            </Button>
            {canManage && !showForm && !editingMaterial && (
              <Button onClick={() => setShowForm(true)}>
                Добавить материал
              </Button>
            )}
          </div>
        </div>
        <div className="mt-2">
          <h1 className="mb-1">{disciplineName}</h1>
          <p className="text-muted mb-0">
            Учебно-методические материалы по дисциплине. Отфильтруйте по типу и
            разделу или воспользуйтесь поиском.
          </p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {actionError && <Alert variant="danger">{actionError}</Alert>}

      <div className={s.filters}>
        <div className="mb-3">
          <span className="small fw-semibold text-muted d-block mb-2">
            Тип материала
          </span>
          <ButtonGroup className="flex-wrap gap-1">
            {KIND_CHIPS.map(({ kind, label }) => (
              <Button
                key={label}
                size="sm"
                variant={
                  filters.materialKind === kind ? 'primary' : 'outline-primary'
                }
                className="rounded-pill"
                onClick={() => setMaterialKind(kind)}
              >
                {label}
              </Button>
            ))}
          </ButtonGroup>
        </div>

        <Row className="g-3 align-items-end">
          <Col md={4}>
            <Form.Group controlId="umm-d-section">
              <Form.Label className="mb-1 small fw-semibold">
                Раздел курса
              </Form.Label>
              <Form.Select
                value={filters.section ?? ''}
                onChange={(e) =>
                  updateFilters({
                    section: e.target.value ? e.target.value : null,
                  })
                }
              >
                <option value="">Все разделы</option>
                {sectionOptions.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={7}>
            <Form.Group controlId="umm-d-search">
              <Form.Label className="mb-1 small fw-semibold">
                Поиск в дисциплине
              </Form.Label>
              <Form.Control
                type="search"
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                placeholder="Название, описание, раздел, имя файла…"
              />
            </Form.Group>
          </Col>
          <Col md={1} className="d-flex justify-content-end">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={resetFilters}
            >
              Сбросить
            </Button>
          </Col>
        </Row>
      </div>

      {showForm && (
        <Card>
          <Card.Body>
            <Card.Title className="mb-3">Новый материал</Card.Title>
            <UmmForm
              disciplines={disciplines}
              teachers={teachers}
              teacherId={teacherId}
              fixedDisciplineId={disciplineId}
              editingMaterial={null}
              isSubmitting={isSubmitting}
              showAuthorSelect={showAuthorSelect}
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          </Card.Body>
        </Card>
      )}

      {editingMaterial && (
        <Card>
          <Card.Body>
            <Card.Title className="mb-3">Редактирование материала</Card.Title>
            <UmmForm
              disciplines={disciplines}
              teachers={teachers}
              teacherId={teacherId}
              editingMaterial={editingMaterial}
              isSubmitting={isSubmitting}
              showAuthorSelect={showAuthorSelect}
              onSubmit={handleUpdate}
              onCancel={() => setEditingMaterial(null)}
            />
          </Card.Body>
        </Card>
      )}

      {isLoading ? (
        <div className="d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" />
          <span>Загрузка...</span>
        </div>
      ) : materials.length === 0 ? (
        <Alert variant="light" className="mb-0">
          Материалов не найдено по текущим фильтрам.
        </Alert>
      ) : (
        <div className={s.cardList}>
          {materials.map((material) => (
            <UmmCard
              key={material.id}
              material={material}
              canManage={canManage}
              onEdit={canManage ? setEditingMaterial : undefined}
              onDelete={canManage ? handleDelete : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};
