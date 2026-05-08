import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
  FiShield,
  FiUploadCloud,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';

import { adminAuthApi } from '@api/admin/adminAuthApi';
import { adminDisciplineApi } from '@api/admin/adminDiscipline';
import { adminGroupApi } from '@api/admin/adminGroupApi';
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
  const { user, isAuthenticated, logout } = useAuth();
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
          <div className={s.avatar}>{getInitial(displayName)}</div>
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

        <button type="button" className={s.logoutButton} onClick={logout}>
          <FiLogOut size={20} aria-hidden="true" />
          Выйти
        </button>
      </section>

      {user.role === RoleEnum.ADMIN && renderAdminProfile()}
      {user.role === RoleEnum.TEACHER && renderTeacherProfile()}
      {isStudentRole(user.role) && renderStudentProfile()}
    </div>
  );
};
