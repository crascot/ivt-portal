import { useEffect, useState } from 'react';
import { Alert, Button, Card, Spinner } from 'react-bootstrap';

import { useAuth } from '@context/AuthContext';
import { scheduleApi } from '@api/scheduleApi';
import { RoleEnum } from '@entities/role-enum';
import { UmmCreatePayload, UmmMaterialShortDto } from '@entities/ummRequest';
import { useUmmList } from '@hooks/umm/useUmmList';

import { UmmCard } from './components/UmmCard';
import { UmmFilters } from './components/UmmFilters';
import { UmmForm } from './components/UmmForm';

import s from './Umm.module.css';

export const Umm = () => {
  const { user } = useAuth();
  const role = user?.role;

  const canManage = role === RoleEnum.TEACHER || role === RoleEnum.ADMIN;
  const showAuthorSelect = role === RoleEnum.ADMIN;

  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] =
    useState<UmmMaterialShortDto | null>(null);

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

  const handleCreate = async (data: {
    title: string;
    description: string | null;
    disciplineId: number;
    authorId: number;
    urls: string[];
    files: File[];
  }) => {
    const payload: UmmCreatePayload = {
      title: data.title,
      description: data.description,
      disciplineId: data.disciplineId,
      authorId: data.authorId,
      urls: data.urls,
      files: data.files,
    };
    await create(payload);
    setShowForm(false);
  };

  const handleUpdate = async (data: {
    title: string;
    description: string | null;
    disciplineId: number;
    authorId: number;
    urls: string[];
    files: File[];
  }) => {
    if (!editingMaterial) return;
    await update(editingMaterial.id, {
      title: data.title,
      description: data.description,
      disciplineId: data.disciplineId,
      urls: data.urls,
      files: data.files.length > 0 ? data.files : undefined,
    });
    setEditingMaterial(null);
  };

  const handleEdit = (material: UmmMaterialShortDto) => {
    setEditingMaterial(material);
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingMaterial(null);
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="mb-1">Учебно-методические материалы</h1>
            <p className="text-muted mb-0">
              Библиотека лекций, документов и полезных ссылок от преподавателей
            </p>
          </div>
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
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {actionError && <Alert variant="danger">{actionError}</Alert>}

      <UmmFilters
        value={filters}
        disciplines={disciplines}
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

      {isLoading ? (
        <div className="d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" />
          <span>Загрузка...</span>
        </div>
      ) : materials.length === 0 ? (
        <Alert variant="light" className="mb-0">
          Материалов не найдено
        </Alert>
      ) : (
        <div className={s.cardList}>
          {materials.map((material) => (
            <UmmCard
              key={material.id}
              material={material}
              canManage={canManage}
              onEdit={canManage ? handleEdit : undefined}
              onDelete={canManage ? remove : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};
