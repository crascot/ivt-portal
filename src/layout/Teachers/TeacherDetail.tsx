import { useEffect, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  FiBookOpen,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiFileText,
  FiMail,
  FiMessageCircle,
  FiPhone,
  FiUser,
} from 'react-icons/fi';

import { scheduleApi } from '@api/scheduleApi';
import { teacherDirectoryApi } from '@api/teacherDirectoryApi';
import { useAuth } from '@context/AuthContext';
import { RoleEnum } from '@entities/role-enum';
import { TeacherDetailDto } from '@entities/teacherRequest';
import {
  DAY_OF_WEEK_LABELS,
  DayOfWeek,
  StudentProfile,
} from '@entities/scheduleRequest';
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

const isStudentRole = (role?: RoleEnum) =>
  role === RoleEnum.STUDENT || role === RoleEnum.GROUP_LEADER;

const normalizePhoneForHref = (value: string) => {
  return value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
};

const createTelHref = (value?: string | null) => {
  if (!value) return null;

  const normalized = normalizePhoneForHref(value);
  return /\d/.test(normalized) ? `tel:${normalized}` : null;
};

const createWhatsAppHref = (value?: string | null, message?: string) => {
  if (!value) return null;

  const normalized = value.replace(/\D/g, '');
  if (!normalized) return null;

  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${normalized}${query}`;
};

export const TeacherDetail = () => {
  const { teacherId: rawTeacherId } = useParams<{ teacherId: string }>();
  const { user, isAuthenticated } = useAuth();
  const teacherId = rawTeacherId ? Number(rawTeacherId) : null;
  const [teacher, setTeacher] = useState<TeacherDetailDto | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(
    null
  );
  const [isContactModalOpen, setContactModalOpen] = useState(false);
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

  useEffect(() => {
    let isMounted = true;

    if (!teacher?.hasAvatar) {
      setAvatarUrl(null);
      return;
    }

    teacherDirectoryApi
      .getTeacherAvatarBlob(teacher.id)
      .then((blob) => {
        if (!isMounted) return;
        setAvatarUrl(URL.createObjectURL(blob));
      })
      .catch(() => {
        if (isMounted) {
          setAvatarUrl(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [teacher]);

  useEffect(() => {
    return () => {
      if (avatarUrl) {
        URL.revokeObjectURL(avatarUrl);
      }
    };
  }, [avatarUrl]);

  useEffect(() => {
    let isMounted = true;

    if (!isAuthenticated || !isStudentRole(user?.role)) {
      setStudentProfile(null);
      return;
    }

    scheduleApi
      .getStudentProfile()
      .then((profile) => {
        if (isMounted) {
          setStudentProfile(profile);
        }
      })
      .catch(() => {
        if (isMounted) {
          setStudentProfile(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.email, user?.role]);

  const schedulePreview = useMemo(() => {
    return teacher?.schedules.slice(0, 4) ?? [];
  }, [teacher]);

  const whatsAppMessage = useMemo(() => {
    if (!isStudentRole(user?.role)) return undefined;

    const studentName = studentProfile?.fullName || user?.fullName || 'студент';
    const groupName = studentProfile?.group;
    const groupPart = groupName ? ` с группы ${groupName}` : '';

    return `Добрый день, я ${studentName}${groupPart}, хотел задать вопрос.`;
  }, [studentProfile, user?.fullName, user?.role]);

  const telHref = useMemo(
    () => createTelHref(teacher?.phoneNumber),
    [teacher?.phoneNumber]
  );

  const whatsAppHref = useMemo(
    () => createWhatsAppHref(teacher?.whatsApp, whatsAppMessage),
    [teacher?.whatsApp, whatsAppMessage]
  );

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
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={teacher.fullName}
            className={s.detailAvatarImage}
          />
        ) : (
          <div className={s.detailAvatar}>{getInitials(teacher.fullName)}</div>
        )}

        <div className={s.detailInfo}>
          <h1>{teacher.fullName}</h1>
          <p>{teacher.position || 'Преподаватель'}</p>

          <div className={s.contactList}>
            <span>
              <FiMail size={18} aria-hidden="true" />
              {teacher.email}
            </span>
            {teacher.phoneNumber && (
              <span>
                <FiPhone size={18} aria-hidden="true" />
                {teacher.phoneNumber}
              </span>
            )}
            {teacher.whatsApp && (
              <span>
                <FiMessageCircle size={18} aria-hidden="true" />
                WhatsApp: {teacher.whatsApp}
              </span>
            )}
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
          <button
            type="button"
            className={s.primaryButton}
            onClick={() => setContactModalOpen(true)}
          >
            <FiMail size={18} aria-hidden="true" />
            Сообщение
          </button>
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
                {lesson.room && !lesson.url && <b>Аудитория {lesson.room}</b>}
                {lesson.url && (
                  <a
                    href={lesson.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Зайти на занятие
                  </a>
                )}
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
          По вопросам занятий и материалов выберите удобный способ связи с
          преподавателем.
        </span>
      </section>

      <Modal
        show={isContactModalOpen}
        onHide={() => setContactModalOpen(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Связаться с преподавателем</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className={s.contactOptions}>
            {teacher.email ? (
              <a href={`mailto:${teacher.email}`} className={s.contactOption}>
                <FiMail size={22} aria-hidden="true" />
                <span>
                  <strong>Email</strong>
                  <small>{teacher.email}</small>
                </span>
              </a>
            ) : (
              <button
                type="button"
                className={`${s.contactOption} ${s.disabledOption}`}
                disabled
              >
                <FiMail size={22} aria-hidden="true" />
                <span>
                  <strong>Email</strong>
                  <small>Почта не указана</small>
                </span>
              </button>
            )}

            {telHref ? (
              <a href={telHref} className={s.contactOption}>
                <FiPhone size={22} aria-hidden="true" />
                <span>
                  <strong>Телефон</strong>
                  <small>{teacher.phoneNumber}</small>
                </span>
              </a>
            ) : (
              <button
                type="button"
                className={`${s.contactOption} ${s.disabledOption}`}
                disabled
              >
                <FiPhone size={22} aria-hidden="true" />
                <span>
                  <strong>Телефон</strong>
                  <small>Номер не указан</small>
                </span>
              </button>
            )}

            {whatsAppHref ? (
              <a
                href={whatsAppHref}
                className={s.contactOption}
                target="_blank"
                rel="noreferrer"
              >
                <FiMessageCircle size={22} aria-hidden="true" />
                <span>
                  <strong>WhatsApp</strong>
                  <small>{teacher.whatsApp}</small>
                </span>
              </a>
            ) : (
              <button
                type="button"
                className={`${s.contactOption} ${s.disabledOption}`}
                disabled
              >
                <FiMessageCircle size={22} aria-hidden="true" />
                <span>
                  <strong>WhatsApp</strong>
                  <small>WhatsApp не указан</small>
                </span>
              </button>
            )}
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};
