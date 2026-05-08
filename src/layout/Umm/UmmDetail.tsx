import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '@context/AuthContext';
import { scheduleApi } from '@api/scheduleApi';
import { RoleEnum } from '@entities/role-enum';
import { DisciplineShort, TeacherShort } from '@entities/scheduleRequest';
import { useUmmDetail } from '@hooks/umm/useUmmDetail';
import { UMM_KIND_LABELS, UmmMaterialKind } from '@entities/ummRequest';
import { ROUTES } from '@utils/routes';
import { ummDisciplinePath } from '@utils/ummRoutes';

import { UmmForm } from './components/UmmForm';

import s from './Umm.module.css';

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

export const UmmDetail = () => {
  const { id } = useParams<{ id: string }>();
  const parsedId = id ? Number(id) : null;
  const navigate = useNavigate();

  const { user } = useAuth();
  const role = user?.role;

  const canManage = role === RoleEnum.TEACHER || role === RoleEnum.ADMIN;
  const showAuthorSelect = role === RoleEnum.ADMIN;

  const [disciplines, setDisciplines] = useState<DisciplineShort[]>([]);
  const [teachers, setTeachers] = useState<TeacherShort[]>([]);
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const {
    material,
    isLoading,
    isSubmitting,
    error,
    actionError,
    update,
    remove,
    removeUrl,
    deleteAttachment,
    downloadAttachment,
  } = useUmmDetail(parsedId);

  useEffect(() => {
    if (!canManage) return;
    Promise.all([scheduleApi.getDisciplines(), scheduleApi.getTeachers()])
      .then(([ds, ts]) => {
        setDisciplines(ds);
        setTeachers(ts);
      })
      .catch(() => undefined);
    if (role === RoleEnum.TEACHER) {
      scheduleApi
        .getTeacherProfile()
        .then((p) => setTeacherId(p.teacherId))
        .catch(() => setTeacherId(null));
    }
  }, [canManage, role]);

  if (parsedId == null || Number.isNaN(parsedId)) {
    return <Alert variant="danger">Неверный идентификатор материала</Alert>;
  }

  const handleDelete = async () => {
    if (!material) return;
    if (!window.confirm(`Удалить материал "${material.title}"?`)) return;
    const backId = material.disciplineId;
    try {
      await remove();
      navigate(ummDisciplinePath(backId));
    } catch {
      // error shown via actionError
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
    await update({
      title: data.title,
      description: data.description,
      disciplineId: data.disciplineId,
      materialKind: data.materialKind,
      section: null,
      urls: data.urls.length > 0 ? data.urls : undefined,
      files: data.files.length > 0 ? data.files : undefined,
    });
    setIsEditing(false);
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex gap-2 flex-wrap">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() =>
                material
                  ? navigate(ummDisciplinePath(material.disciplineId))
                  : navigate(ROUTES.UMM)
              }
            >
              ← К дисциплине
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => navigate(ROUTES.UMM)}
            >
              Каталог УММ
            </Button>
          </div>

          {canManage && material && !isEditing && (
            <div className="d-flex gap-2">
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => setIsEditing(true)}
              >
                Редактировать
              </Button>
              <Button
                size="sm"
                variant="outline-danger"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                Удалить
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {actionError && <Alert variant="danger">{actionError}</Alert>}

      {isLoading ? (
        <div className="d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" />
          <span>Загрузка материала...</span>
        </div>
      ) : !material ? (
        <Alert variant="light">Материал не найден</Alert>
      ) : isEditing ? (
        <Card>
          <Card.Body>
            <Card.Title className="mb-3">Редактирование материала</Card.Title>
            <UmmForm
              disciplines={disciplines}
              teachers={teachers}
              teacherId={teacherId}
              editingMaterial={material}
              isSubmitting={isSubmitting}
              showAuthorSelect={showAuthorSelect}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
          </Card.Body>
        </Card>
      ) : (
        <Card className={s.detailCard}>
          <Card.Body>
            <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
              <Badge bg="light" text="dark" className={s.metaChip}>
                {material.disciplineName}
              </Badge>
              <Badge bg="light" text="dark" className={s.metaChip}>
                {UMM_KIND_LABELS[material.materialKind ?? 'GENERAL']}
              </Badge>
              <Badge bg="light" text="dark" className={s.metaChip}>
                {material.authorName}
              </Badge>
              <span className="text-muted small">
                Создано {formatDate(material.createdAt)}
                {material.updatedAt && material.updatedAt !== material.createdAt
                  ? ` · обновлено ${formatDate(material.updatedAt)}`
                  : ''}
              </span>
            </div>

            <Card.Title className={`${s.detailTitle} mb-3`}>
              {material.title}
            </Card.Title>

            {material.description ? (
              <p className={s.detailDescription}>{material.description}</p>
            ) : (
              <p className="text-muted">Описание не добавлено</p>
            )}

            {material.urls.length > 0 && (
              <div className={s.section}>
                <h5 className="mb-2">Ссылки</h5>
                <ul className={s.urlList}>
                  {material.urls.map((url) => (
                    <li key={url} className={s.urlItem}>
                      <a href={url} target="_blank" rel="noreferrer">
                        {url}
                      </a>
                      {canManage && (
                        <Button
                          size="sm"
                          variant="link"
                          className="p-0 ms-2 text-danger"
                          title="Удалить ссылку"
                          onClick={() => {
                            if (window.confirm(`Удалить ссылку?\n${url}`)) {
                              void removeUrl(url);
                            }
                          }}
                        >
                          ×
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {material.attachments.length > 0 && (
              <div className={s.section}>
                <h5 className="mb-2">Файлы</h5>
                <div className={s.attachmentList}>
                  {material.attachments.map((attachment) => (
                    <span
                      key={attachment.id}
                      className="d-inline-flex align-items-center gap-1"
                    >
                      <Badge
                        bg="light"
                        text="dark"
                        className={s.attachmentItem}
                        role="button"
                        onClick={() =>
                          downloadAttachment(attachment.id, attachment.fileName)
                        }
                      >
                        {attachment.fileName}
                      </Badge>
                      {canManage && (
                        <Button
                          size="sm"
                          variant="link"
                          className="p-0 text-danger"
                          title="Удалить файл"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Удалить файл "${attachment.fileName}"?`
                              )
                            ) {
                              void deleteAttachment(attachment.id);
                            }
                          }}
                        >
                          ×
                        </Button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {material.urls.length === 0 &&
              material.attachments.length === 0 && (
                <Alert variant="light" className="mb-0 mt-3">
                  В этом материале пока нет файлов и ссылок
                </Alert>
              )}
          </Card.Body>
        </Card>
      )}
    </div>
  );
};
