import { Badge, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import { UmmMaterialShortDto } from '@entities/ummRequest';
import { ROUTES } from '@utils/routes';

import s from '../Umm.module.css';

type Props = {
  material: UmmMaterialShortDto;
  canManage: boolean;
  onEdit?: (material: UmmMaterialShortDto) => void;
  onDelete?: (id: number) => void;
};

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

const buildDetailPath = (id: number) =>
  ROUTES.UMM_DETAIL.replace(':id', String(id));

export const UmmCard = ({ material, canManage, onEdit, onDelete }: Props) => {
  const navigate = useNavigate();

  const openDetails = () => navigate(buildDetailPath(material.id));

  return (
    <Card
      as="button"
      type="button"
      onClick={openDetails}
      className={s.ummCard}
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
          <div className="flex-grow-1 text-start">
            <Card.Title className="mb-1">{material.title}</Card.Title>
            <div className="text-muted small mb-2">
              <span>{material.disciplineName}</span>
              <span className="mx-1">·</span>
              <span>{material.authorName}</span>
            </div>
            {material.description && (
              <Card.Text className={`mb-2 ${s.cardDescription}`}>
                {material.description}
              </Card.Text>
            )}
            <div className="d-flex gap-2 flex-wrap">
              {material.attachmentsCount > 0 && (
                <Badge bg="light" text="dark" className={s.metaChip}>
                  Файлов: {material.attachmentsCount}
                </Badge>
              )}
              {material.urlsCount > 0 && (
                <Badge bg="light" text="dark" className={s.metaChip}>
                  Ссылок: {material.urlsCount}
                </Badge>
              )}
              <Badge bg="light" text="dark" className={s.metaChip}>
                {formatDate(material.createdAt)}
              </Badge>
            </div>
          </div>

          {canManage && (
            <div
              className="d-flex flex-column gap-1 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(material);
                  }}
                >
                  Редактировать
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      window.confirm(`Удалить материал "${material.title}"?`)
                    ) {
                      onDelete(material.id);
                    }
                  }}
                >
                  Удалить
                </Button>
              )}
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};
