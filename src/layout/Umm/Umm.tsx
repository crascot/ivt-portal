import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Row, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { ummApi } from '@api/ummApi';
import { scheduleApi } from '@api/scheduleApi';
import { useAuth } from '@context/AuthContext';
import { RoleEnum } from '@entities/role-enum';
import {
  UmmCreatePayload,
  UmmDisciplineStatDto,
  UmmMaterialKind,
  UmmMaterialShortDto,
} from '@entities/ummRequest';
import { useUmmList } from '@hooks/umm/useUmmList';
import { ummDisciplinePath } from '@utils/ummRoutes';

import { UmmCard } from './components/UmmCard';
import { UmmFilters } from './components/UmmFilters';
import { UmmForm } from './components/UmmForm';

import s from './Umm.module.css';

function showCatalogSearchPane(filters: {
  search: string;
  authorId: number | null;
}): boolean {
  return Boolean(filters.search.trim()) || filters.authorId != null;
}

export const Umm = () => {
  const { user } = useAuth();
  const role = user?.role;

  const canManage = role === RoleEnum.TEACHER || role === RoleEnum.ADMIN;
  const showAuthorSelect = role === RoleEnum.ADMIN;

  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] =
    useState<UmmMaterialShortDto | null>(null);
  const [disciplineStats, setDisciplineStats] = useState<
    UmmDisciplineStatDto[]
  >([]);

  const {
    materials,
    disciplines,
    teachers,
    filters,
    isLoading,
    isSubmitting,
    error,
    actionError,
    updateFilters,
    resetFilters,
    reload,
    create,
    update,
    remove,
  } = useUmmList();

  const loadDisciplineStats = useCallback(async () => {
    try {
      const stats = await ummApi.getDisciplineStats();
      setDisciplineStats(stats);
    } catch {
      setDisciplineStats([]);
    }
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

  useEffect(() => {
    void loadDisciplineStats();
  }, [loadDisciplineStats]);

  const refreshAll = useCallback(() => {
    void loadDisciplineStats();
    reload();
  }, [loadDisciplineStats, reload]);

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
    await create(payload);
    setShowForm(false);
    void loadDisciplineStats();
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
    await update(editingMaterial.id, {
      title: data.title,
      description: data.description,
      disciplineId: data.disciplineId,
      materialKind: data.materialKind,
      section: data.section,
      urls: data.urls.length > 0 ? data.urls : undefined,
      files: data.files.length > 0 ? data.files : undefined,
    });
    setEditingMaterial(null);
    void loadDisciplineStats();
  };

  const handleEdit = (material: UmmMaterialShortDto) => {
    setEditingMaterial(material);
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingMaterial(null);
  };

  const handleDelete = async (id: number) => {
    await remove(id);
    void loadDisciplineStats();
  };

  const searchActive = showCatalogSearchPane(filters);

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="mb-1">Учебно-методические материалы</h1>
            <p className="text-muted mb-0">
              Выберите дисциплину или найдите материал по ключевым словам по
              всем курсам
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={refreshAll}
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
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {actionError && <Alert variant="danger">{actionError}</Alert>}

      <UmmFilters
        value={filters}
        teachers={teachers}
        onChange={updateFilters}
        onReset={resetFilters}
      />

      {showForm && (
        <Card>
          <Card.Body>
            <Card.Title className="mb-3">Новый материал</Card.Title>
            <UmmForm
              disciplines={disciplines}
              teachers={teachers}
              teacherId={teacherId}
              editingMaterial={null}
              isSubmitting={isSubmitting}
              showAuthorSelect={showAuthorSelect}
              onSubmit={handleCreate}
              onCancel={handleCancel}
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
              onCancel={handleCancel}
            />
          </Card.Body>
        </Card>
      )}

      {!searchActive && (
        <section>
          <h2 className="h5 mb-3">Дисциплины</h2>
          {disciplineStats.length === 0 ? (
            <Alert variant="light" className="mb-0">
              Пока нет загруженных материалов. После публикации преподавателями
              здесь появятся карточки дисциплин.
            </Alert>
          ) : (
            <Row className="g-3">
              {disciplineStats.map((row) => (
                <Col key={row.disciplineId} md={6} lg={4}>
                  <Card
                    as={Link}
                    to={ummDisciplinePath(row.disciplineId)}
                    className={s.disciplineCard}
                  >
                    <Card.Body>
                      <Card.Title className="h6 mb-2">
                        {row.disciplineName}
                      </Card.Title>
                      <p className="text-muted small mb-0">
                        Материалов: {row.materialCount}
                      </p>
                      <span className={s.disciplineCardHint}>
                        Открыть каталог →
                      </span>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </section>
      )}

      {searchActive && (
        <section className="mt-4">
          <h2 className="h5 mb-3">Результаты поиска</h2>
          {isLoading ? (
            <div className="d-flex align-items-center gap-2">
              <Spinner animation="border" size="sm" />
              <span>Загрузка...</span>
            </div>
          ) : materials.length === 0 ? (
            <Alert variant="light" className="mb-0">
              Ничего не найдено — измените запрос или выберите дисциплину в
              каталоге выше.
            </Alert>
          ) : (
            <div className={s.cardList}>
              {materials.map((material) => (
                <UmmCard
                  key={material.id}
                  material={material}
                  canManage={canManage}
                  onEdit={canManage ? handleEdit : undefined}
                  onDelete={canManage ? handleDelete : undefined}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
