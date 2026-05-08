import {
  FiBookOpen,
  FiCalendar,
  FiEdit2,
  FiExternalLink,
  FiFileText,
  FiLink,
  FiTrash2,
  FiUser,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import {
  UMM_KIND_LABELS,
  UmmMaterialKind,
  UmmMaterialShortDto,
} from '@entities/ummRequest';
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

const kindLabel = (kind: UmmMaterialKind | undefined): string => {
  if (!kind) return UMM_KIND_LABELS.GENERAL;
  return UMM_KIND_LABELS[kind] ?? kind;
};

export const UmmCard = ({ material, canManage, onEdit, onDelete }: Props) => {
  const navigate = useNavigate();
  const kind = material.materialKind ?? 'GENERAL';

  const openDetails = () => {
    navigate(buildDetailPath(material.id));
  };

  return (
    <article className={s.ummCard}>
      <button type="button" className={s.cardMain} onClick={openDetails}>
        <div className={s.cardIcon}>
          <FiBookOpen size={24} aria-hidden="true" />
        </div>

        <div className={s.cardContent}>
          <div className={s.cardTitleRow}>
            <h3>{material.title}</h3>
            <FiExternalLink size={18} aria-hidden="true" />
          </div>

          <div className={s.cardMetaLine}>
            <span>
              <FiFileText size={15} aria-hidden="true" />
              {material.disciplineName}
            </span>
            <span>
              <FiUser size={15} aria-hidden="true" />
              {material.authorName}
            </span>
          </div>

          {material.description && (
            <p className={s.cardDescription}>{material.description}</p>
          )}

          <div className={s.cardChips}>
            <span className={s.metaChip}>{kindLabel(kind)}</span>
            {material.attachmentsCount > 0 && (
              <span className={s.metaChip}>
                <FiFileText size={14} aria-hidden="true" />
                {material.attachmentsCount} файл.
              </span>
            )}
            {material.urlsCount > 0 && (
              <span className={s.metaChip}>
                <FiLink size={14} aria-hidden="true" />
                {material.urlsCount} ссыл.
              </span>
            )}
            <span className={s.metaChip}>
              <FiCalendar size={14} aria-hidden="true" />
              {formatDate(material.createdAt)}
            </span>
          </div>
        </div>
      </button>

      {canManage && (
        <div className={s.cardActions}>
          {onEdit && (
            <button
              type="button"
              className={s.iconButton}
              onClick={() => onEdit(material)}
              aria-label={`Редактировать материал ${material.title}`}
            >
              <FiEdit2 size={18} aria-hidden="true" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className={`${s.iconButton} ${s.dangerIconButton}`}
              onClick={() => {
                if (window.confirm(`Удалить материал "${material.title}"?`)) {
                  onDelete(material.id);
                }
              }}
              aria-label={`Удалить материал ${material.title}`}
            >
              <FiTrash2 size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </article>
  );
};
