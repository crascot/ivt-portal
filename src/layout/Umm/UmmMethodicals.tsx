import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, Badge, Button, Modal, Spinner } from 'react-bootstrap';
import {
  FiArrowLeft,
  FiBookOpen,
  FiCalendar,
  FiDownload,
  FiEdit2,
  FiExternalLink,
  FiFileText,
  FiInfo,
  FiPaperclip,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUploadCloud,
  FiUser,
  FiX,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

import { scheduleApi } from '@api/scheduleApi';
import { ummApi } from '@api/ummApi';
import { useAuth } from '@context/AuthContext';
import { DisciplineShort } from '@entities/scheduleRequest';
import { RoleEnum } from '@entities/role-enum';
import {
  DepartmentMethodicalCreatePayload,
  DepartmentMethodicalFilters,
  DepartmentMethodicalMaterialDto,
  DepartmentMethodicalMaterialShortDto,
} from '@entities/ummRequest';
import { ROUTES } from '@utils/routes';

import s from './Umm.module.css';

type MethodicalFormData = DepartmentMethodicalCreatePayload;

type MethodicalFormProps = {
  disciplines: DisciplineShort[];
  editingMaterial: DepartmentMethodicalMaterialDto | null;
  isSubmitting: boolean;
  onSubmit: (data: MethodicalFormData) => Promise<void>;
  onCancel: () => void;
};

const emptyFilters: DepartmentMethodicalFilters = {
  disciplineId: null,
  search: '',
};

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('ru-RU');
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
};

const parseUrls = (value: string) =>
  value
    .split(/[\n,]+/)
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const MethodicalForm = ({
  disciplines,
  editingMaterial,
  isSubmitting,
  onSubmit,
  onCancel,
}: MethodicalFormProps) => {
  const [title, setTitle] = useState(editingMaterial?.title ?? '');
  const [description, setDescription] = useState(
    editingMaterial?.description ?? ''
  );
  const [disciplineId, setDisciplineId] = useState<number | null>(
    editingMaterial?.disciplineId ?? null
  );
  const [urlsText, setUrlsText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (nextFiles: File[]) => {
    if (nextFiles.length === 0) return;

    setFiles((prev) => {
      const existing = new Set(
        prev.map((file) => `${file.name}-${file.size}-${file.lastModified}`)
      );
      const unique = nextFiles.filter(
        (file) =>
          !existing.has(`${file.name}-${file.size}-${file.lastModified}`)
      );
      return [...prev, ...unique];
    });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedUrls = parseUrls(urlsText);

    if (!title.trim()) {
      setError('Укажите название методического указания');
      return;
    }

    if (parsedUrls.some((url) => !isHttpUrl(url))) {
      setError('Ссылки должны начинаться с http:// или https://');
      return;
    }

    setError(null);
    await onSubmit({
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      disciplineId,
      urls: parsedUrls,
      files,
    });
  };

  return (
    <form className={s.ummForm} onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}

      <div className={s.formTopGrid}>
        <section className={s.formSection}>
          <div className={s.formSectionHeader}>
            <span className={s.formStep}>1</span>
            <div>
              <h3>Основная информация</h3>
              <p>Название, описание и необязательная привязка для фильтра.</p>
            </div>
          </div>

          <label className={s.fieldGroup}>
            <span>
              Название <b>*</b>
            </span>
            <input
              required
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Например: Методические указания по базам данных"
            />
          </label>

          <label className={s.fieldGroup}>
            <span>Дисциплина</span>
            <select
              value={disciplineId ?? ''}
              onChange={(event) =>
                setDisciplineId(
                  event.target.value ? Number(event.target.value) : null
                )
              }
            >
              <option value="">Без привязки к дисциплине</option>
              {disciplines.map((discipline) => (
                <option key={discipline.id} value={discipline.id}>
                  {discipline.name}
                </option>
              ))}
            </select>
            <small>
              Раздел остается общим. Дисциплина нужна только для фильтрации.
            </small>
          </label>

          <label className={s.fieldGroup}>
            <span>Описание</span>
            <textarea
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Кратко опишите содержание методички"
            />
          </label>
        </section>

        <section className={s.formSection}>
          <div className={s.formSectionHeader}>
            <FiPaperclip size={22} aria-hidden="true" />
            <div>
              <h3>Файлы и ссылки</h3>
              <p>Загрузите основные документы кафедры или добавьте ссылки.</p>
            </div>
          </div>

          <label className={s.fieldGroup}>
            <span>Ссылки</span>
            <textarea
              rows={4}
              value={urlsText}
              onChange={(event) => setUrlsText(event.target.value)}
              placeholder="https://example.com/methodical.pdf"
            />
            <small>Каждая ссылка с новой строки или через запятую</small>
          </label>

          <input
            ref={fileInputRef}
            id="department-methodical-files"
            className={s.fileInput}
            type="file"
            multiple
            onChange={handleFileChange}
          />
          <label
            htmlFor="department-methodical-files"
            className={s.fileDropzone}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              addFiles(Array.from(event.dataTransfer.files));
            }}
          >
            <FiUploadCloud size={34} aria-hidden="true" />
            <strong>
              Перетащите файлы сюда или <span>нажмите для выбора</span>
            </strong>
            <small>PDF, DOCX, PPTX, XLSX, ZIP и другие учебные файлы</small>
          </label>

          {files.length > 0 && (
            <div className={s.fileList}>
              {files.map((file, index) => (
                <div
                  className={s.fileItem}
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                >
                  <FiFileText size={20} aria-hidden="true" />
                  <span>{file.name}</span>
                  <small>{formatFileSize(file.size)}</small>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    aria-label={`Убрать файл ${file.name}`}
                  >
                    <FiX size={18} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className={s.formActions}>
        <button
          type="submit"
          className={s.primaryButton}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? 'Сохранение...'
            : editingMaterial
              ? 'Сохранить'
              : 'Добавить методичку'}
        </button>
        <button
          type="button"
          className={s.secondaryButton}
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Отмена
        </button>
      </div>
    </form>
  );
};

export const UmmMethodicals = () => {
  const { user } = useAuth();
  const canManage = user?.role === RoleEnum.ADMIN;
  const objectUrlsRef = useRef<string[]>([]);

  const [filters, setFilters] =
    useState<DepartmentMethodicalFilters>(emptyFilters);
  const [materials, setMaterials] = useState<
    DepartmentMethodicalMaterialShortDto[]
  >([]);
  const [disciplines, setDisciplines] = useState<DisciplineShort[]>([]);
  const [selectedMaterial, setSelectedMaterial] =
    useState<DepartmentMethodicalMaterialDto | null>(null);
  const [editingMaterial, setEditingMaterial] =
    useState<DepartmentMethodicalMaterialDto | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setLoading] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasActiveFilters = useMemo(
    () => filters.search.trim().length > 0 || filters.disciplineId != null,
    [filters]
  );

  const loadDisciplines = useCallback(async () => {
    try {
      const data = await scheduleApi.getDisciplines();
      setDisciplines(data);
    } catch {
      setDisciplines([]);
    }
  }, []);

  const loadCount = useCallback(async () => {
    try {
      const count = await ummApi.getMethodicalCount();
      setTotalCount(count);
    } catch {
      setTotalCount(0);
    }
  }, []);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ummApi.listMethodicals(filters);
      setMaterials(data);
    } catch {
      setError('Не удалось загрузить методические указания');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const refreshAll = useCallback(() => {
    void loadCount();
    void loadMaterials();
  }, [loadCount, loadMaterials]);

  useEffect(() => {
    void loadDisciplines();
    void loadCount();
  }, [loadDisciplines, loadCount]);

  useEffect(() => {
    void loadMaterials();
  }, [loadMaterials]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, []);

  const openMaterial = async (id: number) => {
    setError(null);
    try {
      const data = await ummApi.getMethodicalById(id);
      setSelectedMaterial(data);
    } catch {
      setError('Не удалось открыть методическое указание');
    }
  };

  const openPreview = async (attachmentId: number) => {
    try {
      const blob = await ummApi.getMethodicalAttachmentBlob(attachmentId);
      const url = URL.createObjectURL(blob);
      objectUrlsRef.current.push(url);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      setError('Не удалось открыть файл');
    }
  };

  const handleCreate = async (data: MethodicalFormData) => {
    setSubmitting(true);
    setError(null);
    try {
      await ummApi.createMethodical(data);
      setShowCreateForm(false);
      await Promise.all([loadCount(), loadMaterials()]);
    } catch {
      setError('Не удалось добавить методическое указание');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data: MethodicalFormData) => {
    if (!editingMaterial) return;

    setSubmitting(true);
    setError(null);
    try {
      await ummApi.updateMethodical(editingMaterial.id, {
        title: data.title,
        description: data.description,
        disciplineId: data.disciplineId,
        urls: data.urls.length > 0 ? data.urls : undefined,
        files: data.files.length > 0 ? data.files : undefined,
      });
      setEditingMaterial(null);
      await loadMaterials();
    } catch {
      setError('Не удалось обновить методическое указание');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setError(null);
    try {
      await ummApi.deleteMethodical(id);
      setSelectedMaterial((prev) => (prev?.id === id ? null : prev));
      await Promise.all([loadCount(), loadMaterials()]);
    } catch {
      setError('Не удалось удалить методическое указание');
    }
  };

  const reloadSelected = async (id: number) => {
    const data = await ummApi.getMethodicalById(id);
    setSelectedMaterial(data);
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!selectedMaterial) return;
    try {
      await ummApi.deleteMethodicalAttachment(attachmentId);
      await Promise.all([reloadSelected(selectedMaterial.id), loadMaterials()]);
    } catch {
      setError('Не удалось удалить файл');
    }
  };

  const handleRemoveUrl = async (url: string) => {
    if (!selectedMaterial) return;
    try {
      await ummApi.removeMethodicalUrl(selectedMaterial.id, url);
      await reloadSelected(selectedMaterial.id);
    } catch {
      setError('Не удалось удалить ссылку');
    }
  };

  return (
    <div className={s.page}>
      <section className={s.hero}>
        <div>
          <Link to={ROUTES.UMM} className={s.backInlineLink}>
            <FiArrowLeft size={16} aria-hidden="true" /> К разделу УММ
          </Link>
          <h1>Все методические указания</h1>
          <p>
            Единая библиотека методических указаний, загруженных администратором
            для всей кафедры.
          </p>
        </div>

        <div className={s.methodicalHeroBadge}>
          <FiBookOpen size={24} aria-hidden="true" />
          <strong>{totalCount}</strong>
          <span>методичек</span>
        </div>
      </section>

      {error && (
        <div className={s.errorBox}>
          <FiInfo size={20} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <section className={s.methodicalFilters}>
        <label className={s.filterField}>
          <span>Поиск</span>
          <div className={s.inputWithIcon}>
            <FiSearch size={18} aria-hidden="true" />
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, search: event.target.value }))
              }
              placeholder="Поиск по названию, описанию или имени файла"
            />
          </div>
        </label>

        <label className={s.filterField}>
          <span>Дисциплина</span>
          <select
            value={filters.disciplineId ?? ''}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                disciplineId: event.target.value
                  ? Number(event.target.value)
                  : null,
              }))
            }
          >
            <option value="">Все дисциплины</option>
            {disciplines.map((discipline) => (
              <option key={discipline.id} value={discipline.id}>
                {discipline.name}
              </option>
            ))}
          </select>
        </label>

        <div className={s.filterActions}>
          <button
            type="button"
            className={s.secondaryButton}
            onClick={refreshAll}
            disabled={isLoading}
          >
            <FiRefreshCw size={18} aria-hidden="true" />
            Обновить
          </button>
          <button
            type="button"
            className={s.ghostButton}
            onClick={() => setFilters(emptyFilters)}
          >
            <FiX size={18} aria-hidden="true" />
            Сбросить
          </button>
        </div>
      </section>

      {canManage && !showCreateForm && !editingMaterial && (
        <button
          type="button"
          className={s.primaryButton}
          onClick={() => setShowCreateForm(true)}
        >
          <FiPlus size={18} aria-hidden="true" />
          Добавить методичку
        </button>
      )}

      {canManage && (showCreateForm || editingMaterial) && (
        <section className={s.formCard}>
          <div className={s.formCardHeader}>
            <div>
              <span>
                {editingMaterial ? 'Редактирование' : 'Новая методичка'}
              </span>
              <h2>
                {editingMaterial
                  ? 'Обновите общий материал кафедры'
                  : 'Добавьте общий материал кафедры'}
              </h2>
            </div>
          </div>

          <MethodicalForm
            key={editingMaterial?.id ?? 'new'}
            disciplines={disciplines}
            editingMaterial={editingMaterial}
            isSubmitting={isSubmitting}
            onSubmit={editingMaterial ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowCreateForm(false);
              setEditingMaterial(null);
            }}
          />
        </section>
      )}

      <section className={s.catalogSection}>
        <div className={s.sectionHeader}>
          <div>
            <h2>Библиотека кафедры</h2>
            <p>
              {hasActiveFilters
                ? 'Материалы, найденные по текущим фильтрам.'
                : 'Методические указания доступны всем преподавателям и студентам.'}
            </p>
          </div>
          <span>{materials.length} найдено</span>
        </div>

        {isLoading ? (
          <div className={s.loadingState}>
            <Spinner animation="border" size="sm" />
            <span>Загрузка методичек...</span>
          </div>
        ) : materials.length === 0 ? (
          <div className={s.emptyState}>
            <FiBookOpen size={32} aria-hidden="true" />
            <strong>Методички пока не добавлены</strong>
            <span>Администратор может загрузить их централизованно.</span>
          </div>
        ) : (
          <div className={s.methodicalGrid}>
            {materials.map((material) => (
              <article key={material.id} className={s.methodicalCard}>
                <div className={s.methodicalCardTop}>
                  <div className={s.cardIcon}>
                    <FiBookOpen size={24} aria-hidden="true" />
                  </div>
                  <div>
                    <h3>{material.title}</h3>
                    {material.description && <p>{material.description}</p>}
                  </div>
                </div>

                <div className={s.cardMetaLine}>
                  <span>
                    <FiFileText size={15} aria-hidden="true" />
                    {material.disciplineName ?? 'Общая библиотека'}
                  </span>
                  <span>
                    <FiUser size={15} aria-hidden="true" />
                    {material.uploadedByName}
                  </span>
                </div>

                <div className={s.cardChips}>
                  <span className={s.metaChip}>
                    <FiPaperclip size={14} aria-hidden="true" />
                    {material.attachmentsCount} файл.
                  </span>
                  <span className={s.metaChip}>
                    <FiExternalLink size={14} aria-hidden="true" />
                    {material.urlsCount} ссыл.
                  </span>
                  <span className={s.metaChip}>
                    <FiCalendar size={14} aria-hidden="true" />
                    {formatDate(material.createdAt)}
                  </span>
                </div>

                <div className={s.methodicalCardActions}>
                  <button
                    type="button"
                    className={s.secondaryButton}
                    onClick={() => void openMaterial(material.id)}
                  >
                    Открыть
                  </button>
                  {canManage && (
                    <>
                      <button
                        type="button"
                        className={s.iconButton}
                        onClick={() =>
                          void ummApi
                            .getMethodicalById(material.id)
                            .then(setEditingMaterial)
                        }
                        aria-label={`Редактировать ${material.title}`}
                      >
                        <FiEdit2 size={18} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={`${s.iconButton} ${s.dangerIconButton}`}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Удалить методичку "${material.title}"?`
                            )
                          ) {
                            void handleDelete(material.id);
                          }
                        }}
                        aria-label={`Удалить ${material.title}`}
                      >
                        <FiTrash2 size={18} aria-hidden="true" />
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className={s.formNote}>
        <FiInfo size={20} aria-hidden="true" />
        <span>
          Все методические указания загружаются и управляются администратором
          централизованно. Материалы доступны всем преподавателям и студентам
          независимо от дисциплины.
        </span>
      </div>

      <Modal
        show={Boolean(selectedMaterial)}
        onHide={() => setSelectedMaterial(null)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{selectedMaterial?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMaterial && (
            <div className={s.methodicalModalBody}>
              <div className="d-flex flex-wrap gap-2">
                <Badge bg="light" text="dark" className={s.metaChip}>
                  {selectedMaterial.disciplineName ?? 'Общая библиотека'}
                </Badge>
                <Badge bg="light" text="dark" className={s.metaChip}>
                  {selectedMaterial.uploadedByName}
                </Badge>
                <Badge bg="light" text="dark" className={s.metaChip}>
                  {formatDate(selectedMaterial.createdAt)}
                </Badge>
              </div>

              {selectedMaterial.description ? (
                <p className={s.detailDescription}>
                  {selectedMaterial.description}
                </p>
              ) : (
                <p className="text-muted">Описание не добавлено</p>
              )}

              {selectedMaterial.urls.length > 0 && (
                <section className={s.section}>
                  <h5>Ссылки</h5>
                  <ul className={s.urlList}>
                    {selectedMaterial.urls.map((url) => (
                      <li key={url} className={s.urlItem}>
                        <a href={url} target="_blank" rel="noreferrer">
                          {url}
                        </a>
                        {canManage && (
                          <Button
                            size="sm"
                            variant="link"
                            className="p-0 ms-2 text-danger"
                            onClick={() => {
                              if (window.confirm(`Удалить ссылку?\n${url}`)) {
                                void handleRemoveUrl(url);
                              }
                            }}
                          >
                            ×
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {selectedMaterial.attachments.length > 0 && (
                <section className={s.section}>
                  <h5>Файлы</h5>
                  <div className={s.methodicalAttachmentList}>
                    {selectedMaterial.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className={s.methodicalAttachmentItem}
                      >
                        <FiFileText size={20} aria-hidden="true" />
                        <span>{attachment.fileName}</span>
                        <button
                          type="button"
                          className={s.secondaryButton}
                          onClick={() => void openPreview(attachment.id)}
                        >
                          <FiExternalLink size={16} aria-hidden="true" />
                          Открыть
                        </button>
                        <button
                          type="button"
                          className={s.iconButton}
                          onClick={() =>
                            void ummApi.downloadMethodicalAttachment(
                              attachment.id,
                              attachment.fileName
                            )
                          }
                          aria-label={`Скачать ${attachment.fileName}`}
                        >
                          <FiDownload size={18} aria-hidden="true" />
                        </button>
                        {canManage && (
                          <button
                            type="button"
                            className={`${s.iconButton} ${s.dangerIconButton}`}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Удалить файл "${attachment.fileName}"?`
                                )
                              ) {
                                void handleDeleteAttachment(attachment.id);
                              }
                            }}
                            aria-label={`Удалить ${attachment.fileName}`}
                          >
                            <FiTrash2 size={18} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {selectedMaterial.urls.length === 0 &&
                selectedMaterial.attachments.length === 0 && (
                  <Alert variant="light" className="mb-0">
                    В этой методичке пока нет файлов и ссылок
                  </Alert>
                )}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};
