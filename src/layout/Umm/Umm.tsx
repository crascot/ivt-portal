import { useCallback, useEffect, useState } from 'react';
import {
  FiAlertCircle,
  FiBookOpen,
  FiFolder,
  FiInfo,
  FiPlus,
  FiSearch,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

import { scheduleApi } from '@api/scheduleApi';
import { ummApi } from '@api/ummApi';
import { useAuth } from '@context/AuthContext';
import { RoleEnum } from '@entities/role-enum';
import {
  UmmCreatePayload,
  UmmDisciplineStatDto,
  UmmMaterialKind,
  UmmMaterialShortDto,
} from '@entities/ummRequest';
import { useUmmList } from '@hooks/umm/useUmmList';
import { ROUTES } from '@utils/routes';
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
  const [methodicalCount, setMethodicalCount] = useState(0);

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

  const loadMethodicalCount = useCallback(async () => {
    try {
      const count = await ummApi.getMethodicalCount();
      setMethodicalCount(count);
    } catch {
      setMethodicalCount(0);
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
    void loadMethodicalCount();
  }, [loadDisciplineStats, loadMethodicalCount]);

  const refreshAll = useCallback(() => {
    void loadDisciplineStats();
    void loadMethodicalCount();
    reload();
  }, [loadDisciplineStats, loadMethodicalCount, reload]);

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
      section: null,
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
      section: null,
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
  const showEditor = showForm || editingMaterial;

  return (
    <div className={s.page}>
      <section className={s.hero}>
        <div>
          <h1>Учебно-методические материалы</h1>
          <p>
            Каталог материалов по дисциплинам: добавляйте файлы, ссылки и быстро
            находите нужные ресурсы.
          </p>
        </div>

        {canManage && !showEditor && (
          <button
            type="button"
            className={s.primaryButton}
            onClick={() => setShowForm(true)}
          >
            <FiPlus size={18} aria-hidden="true" />
            Новый материал
          </button>
        )}
      </section>

      {(error || actionError) && (
        <div className={s.errorBox}>
          <FiAlertCircle size={20} aria-hidden="true" />
          <span>{error || actionError}</span>
        </div>
      )}

      <UmmFilters
        value={filters}
        teachers={teachers}
        isLoading={isLoading}
        onChange={updateFilters}
        onReset={resetFilters}
        onRefresh={refreshAll}
      />

      {showEditor && canManage && (
        <section className={s.formCard}>
          <div className={s.formCardHeader}>
            <div>
              <span>
                {editingMaterial ? 'Редактирование' : 'Новый материал'}
              </span>
              <h2>
                {editingMaterial
                  ? 'Обновите учебный материал'
                  : 'Создайте учебный материал'}
              </h2>
            </div>
          </div>

          <UmmForm
            disciplines={disciplines}
            teachers={teachers}
            teacherId={teacherId}
            editingMaterial={editingMaterial}
            isSubmitting={isSubmitting}
            showAuthorSelect={showAuthorSelect}
            onSubmit={editingMaterial ? handleUpdate : handleCreate}
            onCancel={handleCancel}
          />
        </section>
      )}

      <div className={s.catalogOverview}>
        <Link to={ROUTES.UMM_METHODICAL} className={s.methodicalFeatureCard}>
          <div className={s.methodicalFeatureIcon}>
            <FiBookOpen size={36} aria-hidden="true" />
          </div>
          <h2>Все методические указания</h2>
          <p>
            Единая библиотека всех методичек кафедры, загруженных
            администратором.
          </p>
          <span className={s.methodicalFeatureNote}>
            <FiInfo size={15} aria-hidden="true" />
            Не зависит от дисциплины
          </span>
          <strong>{methodicalCount} методичек</strong>
          <span className={s.methodicalFeatureButton}>Открыть</span>
        </Link>

        {!searchActive ? (
          <section className={s.catalogSection}>
            <div className={s.sectionHeader}>
              <div>
                <h2>Дисциплины</h2>
                <p>Откройте дисциплину, чтобы посмотреть материалы по курсу.</p>
              </div>
              <span>{disciplineStats.length} дисциплин</span>
            </div>

            {disciplineStats.length === 0 ? (
              <div className={s.emptyState}>
                <FiFolder size={32} aria-hidden="true" />
                <strong>Материалы пока не опубликованы</strong>
                <span>
                  После публикации преподавателями здесь появятся карточки
                  дисциплин.
                </span>
              </div>
            ) : (
              <div className={s.disciplineGrid}>
                {disciplineStats.map((row) => (
                  <Link
                    key={row.disciplineId}
                    to={ummDisciplinePath(row.disciplineId)}
                    className={s.disciplineCard}
                  >
                    <div className={s.disciplineIcon}>
                      <FiBookOpen size={24} aria-hidden="true" />
                    </div>
                    <div>
                      <h3>{row.disciplineName}</h3>
                      <p>Материалов: {row.materialCount}</p>
                    </div>
                    <span className={s.disciplineCardHint}>Открыть</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className={s.catalogSection}>
            <div className={s.sectionHeader}>
              <div>
                <h2>Результаты поиска</h2>
                <p>Материалы, найденные по текущим фильтрам.</p>
              </div>
              <span>{materials.length} найдено</span>
            </div>

            {isLoading ? (
              <div className={s.loadingState}>Загрузка материалов...</div>
            ) : materials.length === 0 ? (
              <div className={s.emptyState}>
                <FiSearch size={32} aria-hidden="true" />
                <strong>Ничего не найдено</strong>
                <span>Измените запрос или сбросьте фильтры.</span>
              </div>
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
    </div>
  );
};
