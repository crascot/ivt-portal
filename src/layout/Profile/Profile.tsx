import {
  type CSSProperties,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { Link, Navigate } from 'react-router-dom';
import {
  FiBell,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiChevronRight,
  FiClipboard,
  FiClock,
  FiFileText,
  FiGrid,
  FiLogOut,
  FiMail,
  FiMessageCircle,
  FiPhone,
  FiShield,
  FiUploadCloud,
  FiUser,
  FiUsers,
  FiSettings,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';

import { adminAuthApi } from '@api/admin/adminAuthApi';
import { adminDisciplineApi } from '@api/admin/adminDiscipline';
import { adminGroupApi } from '@api/admin/adminGroupApi';
import { profileApi } from '@api/profileApi';
import { scheduleApi } from '@api/scheduleApi';
import { taskApi } from '@api/taskApi';
import { ummApi } from '@api/ummApi';
import { useAnnouncements } from '@context/AnnouncementContext';
import { useAuth } from '@context/AuthContext';
import { AdminRequest } from '@entities/adminRequest';
import { AnnouncementDto } from '@entities/announcementRequest';
import { RoleEnum } from '@entities/role-enum';
import {
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_ORDER,
  StudentProfile,
  TeacherProfile,
  TeacherScheduleDto,
  UpcomingScheduleDto,
} from '@entities/scheduleRequest';
import { TaskStatisticsDto } from '@entities/taskRequest';
import { ROUTES } from '@utils/routes';

import s from './Profile.module.css';

type Tone = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'cyan';

type MetricItem = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: IconType;
  tone: Tone;
};

type ActionItem = {
  label: string;
  description: string;
  to: string;
  icon: IconType;
  tone: Tone;
};

type InfoItem = {
  label: string;
  value: ReactNode;
  icon: IconType;
};

type AdminMetrics = {
  pendingUsers: number | null;
  groups: number | null;
  disciplines: number | null;
};

const ROLE_LABELS: Record<RoleEnum, string> = {
  [RoleEnum.ADMIN]: 'Администратор',
  [RoleEnum.TEACHER]: 'Преподаватель',
  [RoleEnum.STUDENT]: 'Студент',
  [RoleEnum.GROUP_LEADER]: 'Староста',
};

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const isStudentRole = (role?: RoleEnum) =>
  role === RoleEnum.STUDENT || role === RoleEnum.GROUP_LEADER;

const isTaskStatsRole = (role?: RoleEnum) =>
  isStudentRole(role) || role === RoleEnum.TEACHER;

const getInitial = (value?: string) => {
  return value?.trim().charAt(0).toUpperCase() || 'U';
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatTime = (value?: string | null) => {
  if (!value) return '—';
  return value.length >= 5 ? value.slice(0, 5) : value;
};

const getPhoneDigits = (value: string) => value.replace(/\D/g, '');

const isValidPhoneContact = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) return true;
  if (!/^\+?[\d\s()-]+$/.test(trimmedValue)) return false;

  const digitsCount = getPhoneDigits(trimmedValue).length;
  return digitsCount >= 7 && digitsCount <= 15;
};

const formatPhoneInput = (value: string) => {
  const startsWithPlus = value.trim().startsWith('+');
  const digits = getPhoneDigits(value).slice(0, 15);

  if (!digits) return startsWithPlus ? '+' : '';

  if (digits.startsWith('996')) {
    const country = digits.slice(0, 3);
    const operator = digits.slice(3, 6);
    const firstPart = digits.slice(6, 9);
    const secondPart = digits.slice(9, 12);
    return [country ? `+${country}` : '', operator, firstPart, secondPart]
      .filter(Boolean)
      .join(' ');
  }

  const prefix = startsWithPlus ? '+' : '';
  const groups = digits.match(/.{1,3}/g) ?? [];
  return `${prefix}${groups.join(' ')}`;
};

const getDayIndex = (day: TeacherScheduleDto['dayOfWeek']) => {
  const index = DAY_OF_WEEK_ORDER.indexOf(day);
  return index === -1 ? DAY_OF_WEEK_ORDER.length : index;
};

const SectionCard = ({
  title,
  action,
  children,
  className = '',
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <section className={`${s.card} ${className}`}>
    <div className={s.cardHeader}>
      <h2>{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

const IconBadge = ({ icon: Icon, tone }: { icon: IconType; tone: Tone }) => (
  <span className={`${s.iconBadge} ${s[tone]}`}>
    <Icon size={22} aria-hidden="true" />
  </span>
);

const StatusBadge = ({ children }: { children: ReactNode }) => (
  <span className={s.statusBadge}>{children}</span>
);

const EmptyState = ({ children }: { children: ReactNode }) => (
  <div className={s.emptyState}>{children}</div>
);

export const Profile = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  const { announcements } = useAnnouncements();
  const [taskStats, setTaskStats] = useState<TaskStatisticsDto | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(false);
  const [adminProfile, setAdminProfile] = useState<AdminRequest | null>(null);
  const [adminMetrics, setAdminMetrics] = useState<AdminMetrics>({
    pendingUsers: null,
    groups: null,
    disciplines: null,
  });
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(
    null
  );
  const [teacherSchedule, setTeacherSchedule] = useState<TeacherScheduleDto[]>(
    []
  );
  const [teacherUmmCount, setTeacherUmmCount] = useState<number | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(
    null
  );
  const [studentSchedule, setStudentSchedule] = useState<UpcomingScheduleDto[]>(
    []
  );
  const [isRoleDataLoading, setIsRoleDataLoading] = useState(false);
  const [roleDataError, setRoleDataError] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isProfileSaving, setProfileSaving] = useState(false);
  const [profileFormError, setProfileFormError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    whatsApp: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  const loadAvatar = useCallback(async () => {
    try {
      const blob = await profileApi.getAvatarBlob();
      const url = URL.createObjectURL(blob);
      setAvatarUrl(url);
    } catch {
      setAvatarUrl(null);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setAvatarUrl(null);
      return;
    }

    void loadAvatar();
  }, [isAuthenticated, loadAvatar, user?.email]);

  useEffect(() => {
    return () => {
      if (avatarUrl) {
        URL.revokeObjectURL(avatarUrl);
      }
    };
  }, [avatarUrl]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [avatarFile]);

  const showTaskStats = isAuthenticated && isTaskStatsRole(user?.role);

  useEffect(() => {
    let isMounted = true;

    if (!showTaskStats) {
      setTaskStats(null);
      setStatsError(false);
      setIsStatsLoading(false);
      return;
    }

    setIsStatsLoading(true);
    setStatsError(false);

    taskApi
      .getTaskStatistics()
      .then((statistics) => {
        if (isMounted) {
          setTaskStats(statistics);
        }
      })
      .catch(() => {
        if (isMounted) {
          setTaskStats(null);
          setStatsError(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsStatsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [showTaskStats, user?.email, user?.role]);

  useEffect(() => {
    let isMounted = true;

    setRoleDataError(false);
    setAdminProfile(null);
    setAdminMetrics({
      pendingUsers: null,
      groups: null,
      disciplines: null,
    });
    setTeacherProfile(null);
    setTeacherSchedule([]);
    setTeacherUmmCount(null);
    setStudentProfile(null);
    setStudentSchedule([]);

    if (!isAuthenticated || !user?.role) {
      setIsRoleDataLoading(false);
      return;
    }

    const loadRoleData = async () => {
      setIsRoleDataLoading(true);

      try {
        if (user.role === RoleEnum.ADMIN) {
          const [profile, pendingUsers, groups, disciplines] =
            await Promise.allSettled([
              adminAuthApi.me(),
              adminAuthApi.getPending(),
              adminGroupApi.getAll(),
              adminDisciplineApi.getAll(),
            ]);

          if (!isMounted) return;

          if (profile.status === 'fulfilled') {
            setAdminProfile(profile.value);
          }

          setAdminMetrics({
            pendingUsers:
              pendingUsers.status === 'fulfilled'
                ? pendingUsers.value.length
                : null,
            groups: groups.status === 'fulfilled' ? groups.value.length : null,
            disciplines:
              disciplines.status === 'fulfilled'
                ? disciplines.value.length
                : null,
          });

          setRoleDataError(
            [profile, pendingUsers, groups, disciplines].some(
              (result) => result.status === 'rejected'
            )
          );
          return;
        }

        if (user.role === RoleEnum.TEACHER) {
          const profile = await scheduleApi.getTeacherProfile();
          const [schedule, materials] = await Promise.allSettled([
            scheduleApi.getTeacherSchedule(profile.teacherId),
            ummApi.list({ authorId: profile.teacherId }),
          ]);

          if (!isMounted) return;

          setTeacherProfile(profile);
          setTeacherSchedule(
            schedule.status === 'fulfilled' ? schedule.value : []
          );
          setTeacherUmmCount(
            materials.status === 'fulfilled' ? materials.value.length : null
          );
          setRoleDataError(
            schedule.status === 'rejected' || materials.status === 'rejected'
          );
          return;
        }

        if (isStudentRole(user.role)) {
          const profile = await scheduleApi.getStudentProfile();
          const schedule = await scheduleApi
            .getStudentSchedule(profile.groupId, 3)
            .catch(() => []);

          if (!isMounted) return;

          setStudentProfile(profile);
          setStudentSchedule(schedule);
        }
      } catch {
        if (isMounted) {
          setRoleDataError(true);
        }
      } finally {
        if (isMounted) {
          setIsRoleDataLoading(false);
        }
      }
    };

    void loadRoleData();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.email, user?.role]);

  const displayName =
    adminProfile?.fullName ||
    teacherProfile?.fullName ||
    studentProfile?.fullName ||
    user?.fullName ||
    user?.email ||
    'Пользователь портала';
  const displayEmail =
    adminProfile?.email ||
    teacherProfile?.email ||
    studentProfile?.email ||
    user?.email;
  const roleLabel = user?.role ? ROLE_LABELS[user.role] : 'Пользователь';
  const isEnabled =
    adminProfile?.enabled ??
    teacherProfile?.enabled ??
    studentProfile?.enabled ??
    true;

  const openProfileEditor = () => {
    setProfileForm({
      fullName: displayName,
      email: displayEmail ?? '',
      phoneNumber: teacherProfile?.phoneNumber ?? '',
      whatsApp: teacherProfile?.whatsApp ?? '',
    });
    setAvatarFile(null);
    setProfileFormError(null);
    setEditOpen(true);
  };

  const closeProfileEditor = () => {
    if (isProfileSaving) return;
    setEditOpen(false);
    setAvatarFile(null);
    setProfileFormError(null);
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setAvatarFile(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setAvatarFile(null);
      setProfileFormError('Можно загрузить только изображение');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarFile(null);
      setProfileFormError('Максимальный размер фото - 5 МБ');
      event.target.value = '';
      return;
    }

    setProfileFormError(null);
    setAvatarFile(file);
  };

  const applyProfileData = (
    fullName: string,
    email: string,
    phoneNumber: string | null,
    whatsApp: string | null
  ) => {
    setAdminProfile((prev) => (prev ? { ...prev, fullName, email } : prev));
    setTeacherProfile((prev) =>
      prev ? { ...prev, fullName, email, phoneNumber, whatsApp } : prev
    );
    setStudentProfile((prev) => (prev ? { ...prev, fullName, email } : prev));
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const fullName = profileForm.fullName.trim();
    const email = profileForm.email.trim();
    const phoneNumber = profileForm.phoneNumber.trim();
    const whatsApp = profileForm.whatsApp.trim();

    if (!fullName) {
      setProfileFormError('Введите имя');
      return;
    }

    if (!email || !email.includes('@')) {
      setProfileFormError('Введите корректную почту');
      return;
    }

    if (
      user?.role === RoleEnum.TEACHER &&
      (!isValidPhoneContact(phoneNumber) || !isValidPhoneContact(whatsApp))
    ) {
      setProfileFormError(
        'Введите номер в международном формате: только цифры, пробелы, +, скобки или дефисы'
      );
      return;
    }

    setProfileSaving(true);
    setProfileFormError(null);

    try {
      const payload =
        user?.role === RoleEnum.TEACHER
          ? { fullName, email, phoneNumber, whatsApp }
          : { fullName, email };
      const updated = await profileApi.updateMe(payload);
      login(updated.token);
      applyProfileData(
        updated.fullName,
        updated.email,
        updated.phoneNumber,
        updated.whatsApp
      );

      if (avatarFile) {
        await profileApi.uploadAvatar(avatarFile);
      }

      await loadAvatar();
      setEditOpen(false);
      setAvatarFile(null);
    } catch {
      setProfileFormError('Не удалось сохранить изменения');
    } finally {
      setProfileSaving(false);
    }
  };

  const taskChart = useMemo(() => {
    if (!showTaskStats) return null;

    const totalTasks =
      isStatsLoading || statsError ? 0 : (taskStats?.totalTasks ?? 0);
    const overdueTasks =
      isStatsLoading || statsError
        ? 0
        : Math.min(taskStats?.overdueTasks ?? 0, totalTasks);
    const tasksWithoutOverdue = Math.max(totalTasks - overdueTasks, 0);
    const successPercent =
      totalTasks > 0 ? Math.round((tasksWithoutOverdue / totalTasks) * 100) : 0;
    const successAngle =
      totalTasks > 0 ? (tasksWithoutOverdue / totalTasks) * 360 : 0;
    const totalTasksLabel =
      user?.role === RoleEnum.TEACHER ? 'заданий создано' : 'заданий назначено';

    return {
      totalTasks,
      overdueTasks,
      tasksWithoutOverdue,
      successPercent,
      totalTasksLabel,
      chartStyle: {
        '--success-angle': `${successAngle}deg`,
      } as CSSProperties,
    };
  }, [isStatsLoading, showTaskStats, statsError, taskStats, user?.role]);

  const teacherScheduleItems = useMemo(() => {
    return teacherSchedule
      .slice()
      .sort((a, b) => {
        const dayDiff = getDayIndex(a.dayOfWeek) - getDayIndex(b.dayOfWeek);
        if (dayDiff !== 0) return dayDiff;
        return a.startTime.localeCompare(b.startTime);
      })
      .slice(0, 3);
  }, [teacherSchedule]);

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.MAIN} replace />;
  }

  if (!user?.role) {
    return <Navigate to={ROUTES.MAIN} replace />;
  }

  const accountRows: InfoItem[] = [
    { label: 'Имя', value: displayName, icon: FiUser },
    { label: 'Email', value: displayEmail ?? '—', icon: FiMail },
    { label: 'Роль', value: roleLabel, icon: FiShield },
    {
      label: 'Статус',
      value: <StatusBadge>{isEnabled ? 'Активен' : 'Отключен'}</StatusBadge>,
      icon: FiCheckCircle,
    },
  ];

  if (teacherProfile?.position) {
    accountRows.splice(3, 0, {
      label: 'Должность',
      value: teacherProfile.position,
      icon: FiClipboard,
    });
  }

  if (teacherProfile) {
    const statusIndex = accountRows.findIndex(
      (item) => item.label === 'Статус'
    );
    accountRows.splice(
      statusIndex === -1 ? accountRows.length : statusIndex,
      0,
      {
        label: 'Телефон',
        value: teacherProfile.phoneNumber || '—',
        icon: FiPhone,
      },
      {
        label: 'WhatsApp',
        value: teacherProfile.whatsApp || '—',
        icon: FiMessageCircle,
      }
    );
  }

  if (studentProfile?.group) {
    accountRows.splice(3, 0, {
      label: 'Группа',
      value: studentProfile.group,
      icon: FiUsers,
    });
  }

  if (user.role === RoleEnum.GROUP_LEADER) {
    accountRows.push({
      label: 'Статус в группе',
      value: 'Староста',
      icon: FiShield,
    });
  }

  const adminMetricItems: MetricItem[] = [
    {
      label: 'Активных заявок',
      value: adminMetrics.pendingUsers ?? '—',
      hint: 'ожидают решения',
      icon: FiClipboard,
      tone: 'blue',
    },
    {
      label: 'Групп',
      value: adminMetrics.groups ?? '—',
      hint: 'в системе',
      icon: FiUsers,
      tone: 'green',
    },
    {
      label: 'Дисциплин',
      value: adminMetrics.disciplines ?? '—',
      hint: 'доступно',
      icon: FiBookOpen,
      tone: 'orange',
    },
  ];

  const teacherMetricItems: MetricItem[] = [
    {
      label: 'Всего заданий',
      value: isStatsLoading || statsError ? '—' : (taskStats?.totalTasks ?? 0),
      icon: FiClipboard,
      tone: 'blue',
    },
    {
      label: 'На проверке',
      value:
        isStatsLoading || statsError
          ? '—'
          : (taskStats?.pendingReviewReports ?? 0),
      icon: FiClock,
      tone: 'orange',
    },
    {
      label: 'Проверено',
      value:
        isStatsLoading || statsError
          ? '—'
          : (taskStats?.checkedReports ?? taskStats?.acceptedReports ?? 0),
      icon: FiCheckCircle,
      tone: 'green',
    },
    {
      label: 'Без отправок',
      value:
        isStatsLoading || statsError
          ? '—'
          : (taskStats?.tasksWithoutReports ?? 0),
      icon: FiUploadCloud,
      tone: 'purple',
    },
    {
      label: 'Материалов в УММ',
      value: teacherUmmCount ?? '—',
      icon: FiBookOpen,
      tone: 'cyan',
    },
    {
      label: 'Ближайший дедлайн',
      value:
        isStatsLoading || statsError
          ? '—'
          : formatDateTime(taskStats?.nextDeadline),
      icon: FiCalendar,
      tone: 'red',
    },
  ];

  const adminActions: ActionItem[] = [
    {
      label: 'Управление заявками',
      description: 'Просмотр и обработка новых пользователей',
      to: ROUTES.ADMIN_PENDING_USERS,
      icon: FiClipboard,
      tone: 'blue',
    },
    {
      label: 'Группы',
      description: 'Создание и настройка учебных групп',
      to: ROUTES.ADMIN_GROUPS,
      icon: FiUsers,
      tone: 'green',
    },
    {
      label: 'Дисциплины',
      description: 'Управление списком дисциплин',
      to: ROUTES.ADMIN_DISCIPLINES,
      icon: FiBookOpen,
      tone: 'orange',
    },
    {
      label: 'УММ',
      description: 'Учебно-методические материалы',
      to: ROUTES.UMM,
      icon: FiGrid,
      tone: 'purple',
    },
  ];

  const teacherActions: ActionItem[] = [
    {
      label: 'Перейти к заданиям',
      description: 'Создание и проверка работ',
      to: ROUTES.TASKS,
      icon: FiClipboard,
      tone: 'blue',
    },
    {
      label: 'Открыть расписание',
      description: 'Просмотр занятий',
      to: ROUTES.SCHEDULE,
      icon: FiCalendar,
      tone: 'cyan',
    },
    {
      label: 'УММ',
      description: 'Материалы по дисциплинам',
      to: ROUTES.UMM,
      icon: FiBookOpen,
      tone: 'green',
    },
    {
      label: 'История уведомлений',
      description: 'Все события и напоминания',
      to: ROUTES.NOTIFICATIONS_HISTORY,
      icon: FiBell,
      tone: 'orange',
    },
  ];

  const studentMaterials: MetricItem[] = [
    {
      label: 'Лекции',
      value: 'УММ',
      hint: 'материалы курса',
      icon: FiBookOpen,
      tone: 'blue',
    },
    {
      label: 'Лабораторные',
      value: 'Практика',
      hint: 'задания и файлы',
      icon: FiFileText,
      tone: 'green',
    },
    {
      label: 'Методички',
      value: 'Разделы',
      hint: 'дополнительные материалы',
      icon: FiGrid,
      tone: 'purple',
    },
  ];

  const recentAnnouncements = announcements.slice(0, 4);

  const renderMetricCards = (items: MetricItem[]) => (
    <div className={s.metricGrid}>
      {items.map((item) => (
        <div className={s.metricCard} key={item.label}>
          <IconBadge icon={item.icon} tone={item.tone} />
          <div>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            {item.hint && <small>{item.hint}</small>}
          </div>
        </div>
      ))}
    </div>
  );

  const renderActions = (items: ActionItem[]) => (
    <div className={s.actionList}>
      {items.map((item) => (
        <Link to={item.to} className={s.actionRow} key={item.to}>
          <IconBadge icon={item.icon} tone={item.tone} />
          <span>
            <strong>{item.label}</strong>
            <small>{item.description}</small>
          </span>
          <FiChevronRight size={20} aria-hidden="true" />
        </Link>
      ))}
    </div>
  );

  const renderAccountCard = () => (
    <SectionCard title="Данные аккаунта">
      <div className={s.infoList}>
        {accountRows.map((item) => (
          <div className={s.infoItem} key={item.label}>
            <item.icon size={20} aria-hidden="true" />
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </SectionCard>
  );

  const renderTaskChart = () => {
    if (!taskChart) return null;

    return (
      <SectionCard
        title="Статистика заданий"
        action={
          <strong className={s.cardCounter}>{taskChart.totalTasks}</strong>
        }
        className={statsError ? s.warningCard : ''}
      >
        <span className={s.cardSubtitle}>{taskChart.totalTasksLabel}</span>

        <div className={s.chartBody}>
          <div
            className={s.donutChart}
            style={taskChart.chartStyle}
            aria-label="Диаграмма заданий без просрочки"
          >
            <div className={s.donutCenter}>
              <strong>
                {isStatsLoading || statsError
                  ? '—'
                  : `${taskChart.successPercent}%`}
              </strong>
              <span>без просрочки</span>
            </div>
          </div>

          <div className={s.chartLegend}>
            <div className={s.legendItem}>
              <span className={`${s.legendDot} ${s.legendOk}`} />
              <span>Без просрочки</span>
              <strong>
                {isStatsLoading || statsError
                  ? '—'
                  : taskChart.tasksWithoutOverdue}
              </strong>
            </div>
            <div className={s.legendItem}>
              <span className={`${s.legendDot} ${s.legendDanger}`} />
              <span>Просрочено</span>
              <strong>
                {isStatsLoading || statsError ? '—' : taskChart.overdueTasks}
              </strong>
            </div>
          </div>
        </div>

        {statsError && (
          <span className={s.statError}>Не удалось загрузить статистику</span>
        )}

        <Link to={ROUTES.TASKS} className={s.outlineButton}>
          Перейти к заданиям
          <FiChevronRight size={18} aria-hidden="true" />
        </Link>
      </SectionCard>
    );
  };

  const renderStudentSchedule = () => (
    <SectionCard
      title="Ближайшие занятия"
      action={
        <Link to={ROUTES.SCHEDULE} className={s.headerLink}>
          Все расписание
        </Link>
      }
    >
      {studentSchedule.length > 0 ? (
        <div className={s.scheduleList}>
          {studentSchedule.map((lesson) => (
            <div className={s.scheduleRow} key={lesson.scheduleId}>
              <IconBadge icon={FiCalendar} tone="blue" />
              <span>
                <strong>{lesson.disciplineName}</strong>
                <small>{lesson.teacherName ?? 'Преподаватель не указан'}</small>
              </span>
              <b>
                {formatDateTime(lesson.startDateTime)} —{' '}
                {formatTime(lesson.endDateTime)}
              </b>
              <em>{lesson.room ?? '—'}</em>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState>
          {isRoleDataLoading
            ? 'Загрузка расписания...'
            : 'Ближайших занятий нет'}
        </EmptyState>
      )}
    </SectionCard>
  );

  const renderTeacherSchedule = () => (
    <SectionCard
      title="Ближайшие занятия"
      action={
        <Link to={ROUTES.SCHEDULE} className={s.headerLink}>
          Все расписание
        </Link>
      }
    >
      {teacherScheduleItems.length > 0 ? (
        <div className={s.scheduleList}>
          {teacherScheduleItems.map((lesson) => (
            <div className={s.scheduleRow} key={lesson.id}>
              <IconBadge icon={FiCalendar} tone="cyan" />
              <span>
                <strong>{lesson.disciplineName}</strong>
                <small>{lesson.groupName}</small>
              </span>
              <b>
                {DAY_OF_WEEK_LABELS[lesson.dayOfWeek]},{' '}
                {formatTime(lesson.startTime)} — {formatTime(lesson.endTime)}
              </b>
              <em>
                {lesson.url ? (
                  <a href={lesson.url} rel="noreferrer" target="_blank">
                    Зайти на занятие
                  </a>
                ) : lesson.room ? (
                  `Аудитория ${lesson.room}`
                ) : (
                  '-'
                )}
              </em>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState>
          {isRoleDataLoading
            ? 'Загрузка расписания...'
            : 'Расписание не найдено'}
        </EmptyState>
      )}
    </SectionCard>
  );

  const renderAnnouncements = (title: string) => (
    <SectionCard
      title={title}
      action={
        <Link to={ROUTES.NOTIFICATIONS_HISTORY} className={s.headerLink}>
          Вся история
        </Link>
      }
    >
      {recentAnnouncements.length > 0 ? (
        <div className={s.notificationList}>
          {recentAnnouncements.map((item: AnnouncementDto) => (
            <div className={s.notificationRow} key={item.id}>
              <IconBadge icon={FiBell} tone={item.seen ? 'blue' : 'orange'} />
              <span>
                <strong>{item.title}</strong>
                <small>{item.content}</small>
              </span>
              <time>{formatDateTime(item.createdAt)}</time>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState>Новых уведомлений нет</EmptyState>
      )}
    </SectionCard>
  );

  const renderAdminProfile = () => (
    <>
      {renderMetricCards(adminMetricItems)}

      <div className={s.twoColumnGrid}>
        {renderAccountCard()}

        <SectionCard title="Быстрые действия">
          {renderActions(adminActions)}
        </SectionCard>
      </div>

      <div className={s.twoColumnGrid}>
        <SectionCard title="Права и доступ">
          <div className={s.permissionList}>
            <div className={s.permissionRow}>
              <IconBadge icon={FiShield} tone="blue" />
              <span>
                <strong>Полный доступ к системе</strong>
                <small>Администрирование основных разделов портала</small>
              </span>
              <FiCheckCircle size={20} aria-hidden="true" />
            </div>
            <div className={s.permissionRow}>
              <IconBadge icon={FiUsers} tone="green" />
              <span>
                <strong>Управление пользователями</strong>
                <small>Заявки, группы и роли пользователей</small>
              </span>
              <FiCheckCircle size={20} aria-hidden="true" />
            </div>
            <div className={s.permissionRow}>
              <IconBadge icon={FiBookOpen} tone="orange" />
              <span>
                <strong>Управление учебным контентом</strong>
                <small>Дисциплины, расписание, задания и УММ</small>
              </span>
              <FiCheckCircle size={20} aria-hidden="true" />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Состояние данных">
          <div className={s.statusPanel}>
            <IconBadge
              icon={roleDataError ? FiClock : FiCheckCircle}
              tone="blue"
            />
            <span>
              <strong>
                {roleDataError
                  ? 'Часть данных не загрузилась'
                  : 'Данные профиля актуальны'}
              </strong>
              <small>
                {roleDataError
                  ? 'Проверьте доступность API для отдельных разделов'
                  : 'Показаны доступные данные из административных разделов'}
              </small>
            </span>
          </div>
        </SectionCard>
      </div>
    </>
  );

  const renderTeacherProfile = () => (
    <>
      <div className={s.teacherGrid}>
        {renderAccountCard()}

        <SectionCard title="Статистика преподавателя">
          {renderMetricCards(teacherMetricItems)}
        </SectionCard>

        {renderTaskChart()}
      </div>

      <div className={s.threeColumnGrid}>
        <SectionCard title="Быстрые действия">
          {renderActions(teacherActions)}
        </SectionCard>
        {renderTeacherSchedule()}
        {renderAnnouncements('Последние уведомления')}
      </div>
    </>
  );

  const renderStudentProfile = () => (
    <>
      <div className={s.studentGrid}>
        {renderAccountCard()}
        {renderTaskChart()}
      </div>

      <div className={s.twoColumnGrid}>
        {renderStudentSchedule()}
        {renderAnnouncements('Последние уведомления')}
      </div>

      <SectionCard
        title="Учебные материалы"
        action={
          <Link to={ROUTES.UMM} className={s.outlineButton}>
            Перейти в УММ
            <FiChevronRight size={18} aria-hidden="true" />
          </Link>
        }
      >
        {renderMetricCards(studentMaterials)}
      </SectionCard>
    </>
  );

  return (
    <div className={s.profilePage}>
      <section className={s.hero}>
        <div className={s.avatarWrap}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Фото профиля" className={s.avatarImage} />
          ) : (
            <div className={s.avatar}>{getInitial(displayName)}</div>
          )}
          <span className={s.onlineDot} />
        </div>

        <div className={s.heroContent}>
          <span className={s.roleBadge}>{roleLabel}</span>
          <h1>Профиль</h1>
          <p>{displayName}</p>
          {displayEmail && (
            <span className={s.emailLine}>
              <FiMail size={18} aria-hidden="true" />
              {displayEmail}
            </span>
          )}
        </div>

        <div className={s.heroActions}>
          <button
            type="button"
            className={s.editButton}
            onClick={openProfileEditor}
          >
            <FiSettings size={20} aria-hidden="true" />
          </button>
          <button type="button" className={s.logoutButton} onClick={logout}>
            <FiLogOut size={20} aria-hidden="true" />
            Выйти
          </button>
        </div>
      </section>

      <Modal show={isEditOpen} onHide={closeProfileEditor} centered>
        <Form onSubmit={handleProfileSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>Редактировать профиль</Modal.Title>
          </Modal.Header>
          <Modal.Body className={s.editModalBody}>
            {profileFormError && (
              <Alert variant="danger" className="mb-3">
                {profileFormError}
              </Alert>
            )}

            <div className={s.avatarEditor}>
              <div className={s.avatarPreview}>
                {avatarPreviewUrl || avatarUrl ? (
                  <img
                    src={avatarPreviewUrl || avatarUrl || undefined}
                    alt="Предпросмотр фото"
                  />
                ) : (
                  <span>{getInitial(profileForm.fullName || displayName)}</span>
                )}
              </div>
              <Form.Group controlId="profile-avatar" className="flex-grow-1">
                <Form.Label>Фото профиля</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
                <Form.Text className="text-muted">
                  Поддерживаются изображения до 5 МБ.
                </Form.Text>
              </Form.Group>
            </div>

            <Form.Group controlId="profile-name" className="mb-3">
              <Form.Label>Имя</Form.Label>
              <Form.Control
                value={profileForm.fullName}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    fullName: event.target.value,
                  }))
                }
                placeholder="Введите имя"
                required
              />
            </Form.Group>

            <Form.Group controlId="profile-email">
              <Form.Label>Почта</Form.Label>
              <Form.Control
                type="email"
                value={profileForm.email}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
                placeholder="Введите почту"
                required
              />
            </Form.Group>

            {user.role === RoleEnum.TEACHER && (
              <>
                <Form.Group controlId="profile-phone">
                  <Form.Label>Телефон</Form.Label>
                  <Form.Control
                    type="tel"
                    inputMode="tel"
                    value={profileForm.phoneNumber}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        phoneNumber: formatPhoneInput(event.target.value),
                      }))
                    }
                    placeholder="+996 555 000 000"
                    maxLength={40}
                  />
                  <Form.Text className="text-muted">
                    Допустимо 7-15 цифр, можно использовать +, пробелы, скобки и
                    дефисы.
                  </Form.Text>
                </Form.Group>

                <Form.Group controlId="profile-whatsapp">
                  <Form.Label>WhatsApp</Form.Label>
                  <Form.Control
                    type="tel"
                    inputMode="tel"
                    value={profileForm.whatsApp}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        whatsApp: formatPhoneInput(event.target.value),
                      }))
                    }
                    placeholder="+996 555 000 000"
                    maxLength={40}
                  />
                  <Form.Text className="text-muted">
                    Номер будет использоваться для ссылки WhatsApp.
                  </Form.Text>
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              type="button"
              variant="outline-secondary"
              onClick={closeProfileEditor}
              disabled={isProfileSaving}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isProfileSaving}>
              {isProfileSaving ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Сохранение...
                </>
              ) : (
                'Сохранить'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {user.role === RoleEnum.ADMIN && renderAdminProfile()}
      {user.role === RoleEnum.TEACHER && renderTeacherProfile()}
      {isStudentRole(user.role) && renderStudentProfile()}
    </div>
  );
};
