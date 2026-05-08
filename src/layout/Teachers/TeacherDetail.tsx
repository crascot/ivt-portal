import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  FiBookOpen,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiFileText,
  FiMail,
  FiMapPin,
  FiUser,
} from 'react-icons/fi';

import { teacherDirectoryApi } from '@api/teacherDirectoryApi';
import { TeacherDetailDto } from '@entities/teacherRequest';
import { DAY_OF_WEEK_LABELS, DayOfWeek } from '@entities/scheduleRequest';
import { ROUTES } from '@utils/routes';
import { ummDisciplinePath } from '@utils/ummRoutes';

import s from './Teachers.module.css';

const materialPath = (materialId: number) =>
  ROUTES.UMM_DETAIL.replace(':id', String(materialId));

const teacherSchedulePath = (teacherId: number) =>
  ROUTES.TEACHER_SCHEDULE.replace(':teacherId', String(teacherId));

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? 'П';
  const second = parts[1]?.charAt(0) ?? '';
  return `${first}${second}`.toUpperCase();
};

const formatTime = (time: string) => {
  return time.length >= 5 ? time.slice(0, 5) : time;
};

export const TeacherDetail = () => {
  const { teacherId: rawTeacherId } = useParams<{ teacherId: string }>();
  const teacherId = rawTeacherId ? Number(rawTeacherId) : null;
  const [teacher, setTeacher] = useState<TeacherDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (teacherId == null || Number.isNaN(teacherId)) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    teacherDirectoryApi
      .getTeacher(teacherId)
      .then((data) => {
        if (isMounted) {
          setTeacher(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Не удалось загрузить данные преподавателя');
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
  }, [teacherId]);

  const schedulePreview = useMemo(() => {
    return teacher?.schedules.slice(0, 4) ?? [];
  }, [teacher]);

  if (teacherId == null || Number.isNaN(teacherId)) {
    return <Navigate to={ROUTES.TEACHERS} replace />;
  }

  if (isLoading) {
    return <div className={s.emptyState}>Загрузка преподавателя...</div>;
  }

  if (error || !teacher) {
    return (
      <div className={s.page}>
        <Link to={ROUTES.TEACHERS} className={s.backLink}>
          <FiChevronLeft size={18} aria-hidden="true" />К списку преподавателей
        </Link>
        <div className={s.errorBox}>{error ?? 'Преподаватель не найден'}</div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <Link to={ROUTES.TEACHERS} className={s.backLink}>
        <FiChevronLeft size={18} aria-hidden="true" />К списку преподавателей
      </Link>

      <section className={s.detailHero}>
        <div className={s.detailAvatar}>{getInitials(teacher.fullName)}</div>

        <div className={s.detailInfo}>
          <h1>{teacher.fullName}</h1>
          <p>{teacher.position || 'Преподаватель'}</p>

          <div className={s.contactList}>
            <span>
              <FiMail size={18} aria-hidden="true" />
              {teacher.email}
            </span>
            <span>
              <FiBookOpen size={18} aria-hidden="true" />
              Дисциплин: {teacher.disciplinesCount}
            </span>
            <span>
              <FiFileText size={18} aria-hidden="true" />
              Материалов УММ: {teacher.materialsCount}
            </span>
          </div>
        </div>

        <div className={s.detailActions}>
          <a href={`mailto:${teacher.email}`} className={s.primaryButton}>
            <FiMail size={18} aria-hidden="true" />
            Сообщение
          </a>
          <Link
            to={teacherSchedulePath(teacher.id)}
            className={s.secondaryButton}
          >
            <FiCalendar size={18} aria-hidden="true" />
            Расписание
          </Link>
        </div>
      </section>

      <section className={s.detailSection}>
        <div className={s.sectionHeader}>
          <h2>Преподаваемые дисциплины</h2>
          <span>Всего: {teacher.disciplines.length}</span>
        </div>

        {teacher.disciplines.length === 0 ? (
          <div className={s.emptyState}>Дисциплины не найдены</div>
        ) : (
          <div className={s.disciplineGrid}>
            {teacher.disciplines.map((discipline) => (
              <Link
                key={discipline.id}
                to={ummDisciplinePath(discipline.id)}
                className={s.disciplineCard}
              >
                <FiBookOpen size={26} aria-hidden="true" />
                <span>
                  <strong>{discipline.name}</strong>
                  <small>Открыть дисциплину → УММ</small>
                </span>
                <FiChevronRight size={20} aria-hidden="true" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className={s.detailSection}>
        <div className={s.sectionHeader}>
          <h2>Ближайшие пары</h2>
          <Link to={teacherSchedulePath(teacher.id)}>Полное расписание</Link>
        </div>

        {schedulePreview.length === 0 ? (
          <div className={s.emptyState}>Расписание не найдено</div>
        ) : (
          <div className={s.scheduleList}>
            {schedulePreview.map((lesson) => (
              <div className={s.scheduleRow} key={lesson.id}>
                <span>
                  <strong>{lesson.disciplineName}</strong>
                  <small>Группа {lesson.groupName}</small>
                </span>
                <span>
                  <FiClock size={18} aria-hidden="true" />
                  {DAY_OF_WEEK_LABELS[lesson.dayOfWeek as DayOfWeek] ??
                    lesson.dayOfWeek}
                  , {formatTime(lesson.startTime)} —{' '}
                  {formatTime(lesson.endTime)}
                </span>
                <b>
                  <FiMapPin size={16} aria-hidden="true" />
                  {lesson.room ?? lesson.url ?? '—'}
                </b>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={s.detailSection}>
        <div className={s.sectionHeader}>
          <h2>Доступные УММ</h2>
          <Link to={ROUTES.UMM}>Все материалы</Link>
        </div>

        {teacher.recentMaterials.length === 0 ? (
          <div className={s.emptyState}>Материалы пока не опубликованы</div>
        ) : (
          <div className={s.materialGrid}>
            {teacher.recentMaterials.map((material) => (
              <Link
                key={material.id}
                to={materialPath(material.id)}
                className={s.materialCard}
              >
                <FiFileText size={28} aria-hidden="true" />
                <span>
                  <strong>{material.title}</strong>
                  <small>
                    {material.disciplineName} · файлов:{' '}
                    {material.attachmentsCount}
                  </small>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className={s.infoPanel}>
        <FiUser size={22} aria-hidden="true" />
        <span>
          По вопросам занятий и материалов обращайтесь к преподавателю по email.
        </span>
      </section>
    </div>
  );
};
