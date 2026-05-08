import { FiRefreshCw, FiSearch, FiX } from 'react-icons/fi';

import { TeacherShort } from '@entities/scheduleRequest';
import { UmmCatalogFilters } from '@entities/ummRequest';

import s from '../Umm.module.css';

type Props = {
  value: UmmCatalogFilters;
  teachers: TeacherShort[];
  isLoading: boolean;
  onChange: (patch: Partial<UmmCatalogFilters>) => void;
  onReset: () => void;
  onRefresh: () => void;
};

export const UmmFilters = ({
  value,
  teachers,
  isLoading,
  onChange,
  onReset,
  onRefresh,
}: Props) => {
  return (
    <section className={s.filters}>
      <label className={`${s.filterField} ${s.searchField}`}>
        <span>Поиск</span>
        <div className={s.inputWithIcon}>
          <FiSearch size={20} aria-hidden="true" />
          <input
            type="search"
            value={value.search}
            onChange={(event) => onChange({ search: event.target.value })}
            placeholder="Поиск по названию, описанию или имени файла"
          />
        </div>
      </label>

      <label className={s.filterField}>
        <span>Преподаватель</span>
        <select
          value={value.authorId ?? ''}
          onChange={(event) =>
            onChange({
              authorId: event.target.value ? Number(event.target.value) : null,
            })
          }
        >
          <option value="">Все преподаватели</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.fullName}
            </option>
          ))}
        </select>
      </label>

      <div className={s.filterActions}>
        <button
          type="button"
          className={s.secondaryButton}
          onClick={onRefresh}
          disabled={isLoading}
        >
          <FiRefreshCw size={18} aria-hidden="true" />
          Обновить
        </button>
        <button type="button" className={s.ghostButton} onClick={onReset}>
          <FiX size={18} aria-hidden="true" />
          Сбросить
        </button>
      </div>
    </section>
  );
};
