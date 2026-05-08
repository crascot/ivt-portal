import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useRef,
  useState,
} from 'react';
import {
  FiBookOpen,
  FiCheckCircle,
  FiFileText,
  FiLink,
  FiPaperclip,
  FiSave,
  FiUploadCloud,
  FiX,
} from 'react-icons/fi';

import { DisciplineShort, TeacherShort } from '@entities/scheduleRequest';
import {
  UMM_KIND_LABELS,
  UmmMaterialDto,
  UmmMaterialKind,
  UmmMaterialShortDto,
} from '@entities/ummRequest';

import s from '../Umm.module.css';

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

type FieldErrors = Partial<
  Record<
    | 'title'
    | 'description'
    | 'disciplineId'
    | 'authorId'
    | 'materialKind'
    | 'urls',
    string
  >
>;

const kindFromEditing = (m: EditingMaterial | null): UmmMaterialKind => {
  if (!m || !('materialKind' in m) || !m.materialKind) {
    return 'GENERAL';
  }
  return m.materialKind;
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
  const [selectedAuthorId, setSelectedAuthorId] = useState<number | null>(
    editingMaterial?.authorId ?? teacherId
  );
  const [urlsText, setUrlsText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [validated, setValidated] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fixedDisciplineName =
    fixedDisciplineId != null
      ? disciplines.find((d) => d.id === fixedDisciplineId)?.name
      : null;

  const kindEntries = Object.entries(UMM_KIND_LABELS) as [
    UmmMaterialKind,
    string,
  ][];

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

  const clearError = (field: keyof FieldErrors) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    addFiles(Array.from(event.dataTransfer.files));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const resolvedDisciplineId = fixedDisciplineId ?? disciplineId;
    const resolvedAuthorId = selectedAuthorId ?? teacherId;
    const parsedUrls = parseUrls(urlsText);
    const nextErrors: FieldErrors = {};

    if (!title.trim()) {
      nextErrors.title = 'Укажите название материала';
    }

    if (!description.trim()) {
      nextErrors.description = 'Добавьте описание материала';
    }

    if (resolvedDisciplineId == null) {
      nextErrors.disciplineId = 'Выберите предмет';
    }

    if (!materialKind) {
      nextErrors.materialKind = 'Выберите тип материала';
    }

    if (resolvedAuthorId == null) {
      nextErrors.authorId = showAuthorSelect
        ? 'Выберите автора материала'
        : 'Не удалось определить текущего преподавателя';
    }

    if (parsedUrls.some((url) => !isHttpUrl(url))) {
      nextErrors.urls = 'Ссылки должны начинаться с http:// или https://';
    }

    if (Object.keys(nextErrors).length > 0) {
      setValidated(true);
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    if (resolvedDisciplineId == null || resolvedAuthorId == null) {
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        disciplineId: resolvedDisciplineId,
        authorId: resolvedAuthorId,
        materialKind,
        section: null,
        urls: parsedUrls,
        files,
      });

      if (!editingMaterial) {
        setTitle('');
        setDescription('');
        setDisciplineId(fixedDisciplineId ?? null);
        setMaterialKind('GENERAL');
        setSelectedAuthorId(teacherId);
        setUrlsText('');
        setFiles([]);
        setValidated(false);
        setErrors({});
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

  return (
    <form
      noValidate
      className={`${s.ummForm} ${validated ? s.formValidated : ''}`}
      onSubmit={handleSubmit}
    >
      <div className={s.formTopGrid}>
        <section className={s.formSection}>
          <div className={s.formSectionHeader}>
            <span className={s.formStep}>1</span>
            <div>
              <h3>Основная информация</h3>
              <p>Название, дисциплина и краткое описание материала.</p>
            </div>
          </div>

          <div className={s.formFieldsGrid}>
            <label className={s.fieldGroup}>
              <span>
                Название материала <b>*</b>
              </span>
              <input
                required
                aria-invalid={Boolean(errors.title)}
                type="text"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  clearError('title');
                }}
                placeholder="Например: Конспект лекций по базам данных"
              />
              {errors.title && (
                <strong className={s.fieldError}>{errors.title}</strong>
              )}
              <small>Короткое и понятное название материала</small>
            </label>

            <label className={s.fieldGroup}>
              <span>
                Предмет <b>*</b>
              </span>
              {fixedDisciplineId != null && fixedDisciplineName ? (
                <div className={s.readOnlyField}>{fixedDisciplineName}</div>
              ) : (
                <select
                  required
                  aria-invalid={Boolean(errors.disciplineId)}
                  value={disciplineId ?? ''}
                  onChange={(event) => {
                    setDisciplineId(
                      event.target.value ? Number(event.target.value) : null
                    );
                    clearError('disciplineId');
                  }}
                >
                  <option value="">Выберите предмет</option>
                  {disciplines.map((discipline) => (
                    <option key={discipline.id} value={discipline.id}>
                      {discipline.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.disciplineId && (
                <strong className={s.fieldError}>{errors.disciplineId}</strong>
              )}
              <small>Выберите дисциплину из списка</small>
            </label>
          </div>

          <label className={s.fieldGroup}>
            <span>
              Описание <b>*</b>
            </span>
            <textarea
              required
              aria-invalid={Boolean(errors.description)}
              rows={5}
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                clearError('description');
              }}
              placeholder="Опишите содержание, цель и структуру материала"
            />
            {errors.description && (
              <strong className={s.fieldError}>{errors.description}</strong>
            )}
            <small>
              Это описание поможет студентам быстрее понять контекст
            </small>
          </label>
        </section>

        <section className={s.formSection}>
          <div className={s.formSectionHeader}>
            <span className={s.formStep}>2</span>
            <div>
              <h3>Классификация</h3>
              <p>Оставьте только тип материала и автора публикации.</p>
            </div>
          </div>

          <label className={s.fieldGroup}>
            <span>
              Тип материала <b>*</b>
            </span>
            <select
              required
              aria-invalid={Boolean(errors.materialKind)}
              value={materialKind}
              onChange={(event) => {
                setMaterialKind(event.target.value as UmmMaterialKind);
                clearError('materialKind');
              }}
            >
              {kindEntries.map(([kind, label]) => (
                <option key={kind} value={kind}>
                  {label}
                </option>
              ))}
            </select>
            {errors.materialKind && (
              <strong className={s.fieldError}>{errors.materialKind}</strong>
            )}
            <small>Общее, УМК, лекции, лабораторные или дополнительные</small>
          </label>

          {showAuthorSelect && (
            <label className={s.fieldGroup}>
              <span>
                Автор <b>*</b>
              </span>
              <select
                required
                aria-invalid={Boolean(errors.authorId)}
                value={selectedAuthorId ?? ''}
                onChange={(event) => {
                  setSelectedAuthorId(
                    event.target.value ? Number(event.target.value) : null
                  );
                  clearError('authorId');
                }}
              >
                <option value="">Выберите преподавателя</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.fullName}
                  </option>
                ))}
              </select>
              {errors.authorId && (
                <strong className={s.fieldError}>{errors.authorId}</strong>
              )}
              <small>Администратор может выбрать автора материала</small>
            </label>
          )}

          {!showAuthorSelect && (
            <div className={s.formNote}>
              <FiBookOpen size={20} aria-hidden="true" />
              <span>
                Материал будет опубликован от имени текущего преподавателя.
              </span>
            </div>
          )}
          {!showAuthorSelect && errors.authorId && (
            <strong className={s.fieldError}>{errors.authorId}</strong>
          )}
        </section>
      </div>

      <div className={s.formBottomGrid}>
        <section className={s.formSection}>
          <div className={s.formSectionHeader}>
            <FiLink size={22} aria-hidden="true" />
            <div>
              <h3>Ссылки</h3>
              <p>Добавьте полезные внешние ресурсы, если они есть.</p>
            </div>
          </div>

          <label className={s.fieldGroup}>
            <span>Ресурсы</span>
            <textarea
              rows={6}
              value={urlsText}
              aria-invalid={Boolean(errors.urls)}
              onChange={(event) => {
                setUrlsText(event.target.value);
                clearError('urls');
              }}
              placeholder="https://example.com/material&#10;https://example.com/docs"
            />
            {errors.urls && (
              <strong className={s.fieldError}>{errors.urls}</strong>
            )}
            <small>Каждая ссылка с новой строки или через запятую</small>
          </label>
        </section>

        <section className={s.formSection}>
          <div className={s.formSectionHeader}>
            <FiPaperclip size={22} aria-hidden="true" />
            <div>
              <h3>Файлы</h3>
              <p>Прикрепите документы, презентации или архивы.</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            id="umm-files"
            className={s.fileInput}
            type="file"
            multiple
            onChange={handleFileChange}
          />
          <label
            htmlFor="umm-files"
            className={s.fileDropzone}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
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
                  <FiCheckCircle
                    className={s.fileOk}
                    size={18}
                    aria-hidden="true"
                  />
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
          <FiSave size={18} aria-hidden="true" />
          {isSubmitting
            ? 'Сохранение...'
            : editingMaterial
              ? 'Сохранить изменения'
              : 'Создать материал'}
        </button>
        <button
          type="button"
          className={s.secondaryButton}
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <FiX size={18} aria-hidden="true" />
          Отмена
        </button>
      </div>
    </form>
  );
};
