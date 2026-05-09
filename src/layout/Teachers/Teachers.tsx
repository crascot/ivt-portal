import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiBookOpen,
  FiCalendar,
  FiGrid,
  FiInfo,
  FiList,
  FiMail,
  FiSearch,
  FiUser,
} from 'react-icons/fi';

import { teacherDirectoryApi } from '@api/teacherDirectoryApi';
import { TeacherDirectoryItemDto } from '@entities/teacherRequest';
import { ROUTES } from '@utils/routes';

import s from './Teachers.module.css';

type ViewMode = 'grid' | 'list';

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? 'П';
  const second = parts[1]?.charAt(0) ?? '';
  return `${first}${second}`.toUpperCase();
};

const teacherPath = (teacherId: number) =>
  ROUTES.TEACHER_DETAIL.replace(':teacherId', String(teacherId));

export const Teachers = () => {
  const [teachers, setTeachers] = useState<TeacherDirectoryItemDto[]>([]);
  const [teacherAvatars, setTeacherAvatars] = useState<Record<number, string>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setError(null);

    teacherDirectoryApi
      .getTeachers()
      .then((data) => {
        if (isMounted) {
          setTeachers(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Не удалось загрузить список преподавателей');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const urls: string[] = [];
    const teachersWithAvatars = teachers.filter((teacher) => teacher.hasAvatar);

    if (teachersWithAvatars.length === 0) {
      setTeacherAvatars({});
      return;
    }

    Promise.all(
      teachersWithAvatars.map(async (teacher) => {
        try {
          const blob = await teacherDirectoryApi.getTeacherAvatarBlob(
            teacher.id
          );
          const url = URL.createObjectURL(blob);
          urls.push(url);
          return [teacher.id, url] as const;
        } catch {
          return null;
        }
      })
    ).then((entries) => {
      if (!isMounted) return;

      setTeacherAvatars(
        Object.fromEntries(
          entries.filter(
            (entry): entry is readonly [number, string] => entry !== null
          )
        )
      );
    });

    return () => {
      isMounted = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return teachers;

    return teachers.filter((teacher) => {
      return [teacher.fullName, teacher.email, teacher.position]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [query, teachers]);

  const renderTeacherCard = (teacher: TeacherDirectoryItemDto) => (
    <Link
      key={teacher.id}
      to={teacherPath(teacher.id)}
      className={`${s.teacherCard} ${viewMode === 'list' ? s.listCard : ''}`}
    >
      {teacherAvatars[teacher.id] ? (
        <img
          src={teacherAvatars[teacher.id]}
          alt={teacher.fullName}
          className={s.avatarImage}
        />
      ) : (
        <div className={s.avatar}>{getInitials(teacher.fullName)}</div>
      )}

      <div className={s.teacherInfo}>
        <h2>{teacher.fullName}</h2>
        <p>{teacher.position || 'Преподаватель'}</p>

        <span className={s.disciplineChip}>
          Преподаёт дисциплин: {teacher.disciplinesCount}
        </span>

        <div className={s.quickMeta}>
          <span title={teacher.email}>
            <FiMail size={18} aria-hidden="true" />
          </span>
          <span title="Расписание">
            <FiCalendar size={18} aria-hidden="true" />
          </span>
          <span title="УММ">
            <FiBookOpen size={18} aria-hidden="true" />
          </span>
        </div>
      </div>

      <FiUser className={s.cardArrow} size={22} aria-hidden="true" />
    </Link>
  );

  return (
    <div className={s.page}>
      <section className={s.hero}>
        <div>
          <h1>Преподаватели кафедры ИВТ</h1>
          <p>
            Список преподавателей кафедры информатики и вычислительной техники,
            их дисциплины, расписание и учебные материалы.
          </p>
        </div>
      </section>

      <section className={s.toolbar}>
        <div className={s.searchBox}>
          <FiSearch size={20} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по ФИО, email или должности"
          />
        </div>

        <div className={s.viewSwitch} aria-label="Вид списка">
          <button
            type="button"
            className={viewMode === 'grid' ? s.activeView : ''}
            onClick={() => setViewMode('grid')}
          >
            <FiGrid size={18} aria-hidden="true" />
            Сетка
          </button>
          <button
            type="button"
            className={viewMode === 'list' ? s.activeView : ''}
            onClick={() => setViewMode('list')}
          >
            <FiList size={18} aria-hidden="true" />
            Список
          </button>
        </div>
      </section>

      {error && <div className={s.errorBox}>{error}</div>}

      {isLoading ? (
        <div className={s.emptyState}>Загрузка преподавателей...</div>
      ) : filteredTeachers.length === 0 ? (
        <div className={s.emptyState}>Преподаватели не найдены</div>
      ) : (
        <section
          className={`${s.teacherGrid} ${
            viewMode === 'list' ? s.teacherList : ''
          }`}
        >
          {filteredTeachers.map(renderTeacherCard)}
        </section>
      )}

      <section className={s.infoPanel}>
        <FiInfo size={22} aria-hidden="true" />
        <span>
          Здесь можно посмотреть информацию о преподавателях кафедры, их
          дисциплины, расписание и опубликованные учебные материалы.
        </span>
      </section>
    </div>
  );
};
