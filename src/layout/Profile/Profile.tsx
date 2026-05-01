import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card } from 'react-bootstrap';
import { Link, Navigate } from 'react-router-dom';

import { taskApi } from '@api/taskApi';
import { useAuth } from '@context/AuthContext';
import { RoleEnum } from '@entities/role-enum';
import { TaskStatisticsDto } from '@entities/taskRequest';
import { ROUTES } from '@utils/routes';

import s from './Profile.module.css';

const ROLE_LABELS: Partial<Record<RoleEnum, string>> = {
  [RoleEnum.ADMIN]: 'Администратор',
  [RoleEnum.TEACHER]: 'Преподаватель',
  [RoleEnum.STUDENT]: 'Студент',
  [RoleEnum.GROUP_LEADER]: 'Староста',
};

const isTaskStatsRole = (role?: RoleEnum) =>
  role === RoleEnum.STUDENT ||
  role === RoleEnum.GROUP_LEADER ||
  role === RoleEnum.TEACHER;

export const Profile = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [taskStats, setTaskStats] = useState<TaskStatisticsDto | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(false);

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

  const taskChart = useMemo(() => {
    if (!showTaskStats) return null;

    const totalTasks =
      isStatsLoading || statsError ? 0 : taskStats?.totalTasks ?? 0;
    const overdueTasks =
      isStatsLoading || statsError
        ? 0
        : Math.min(taskStats?.overdueTasks ?? 0, totalTasks);
    const tasksWithoutOverdue = Math.max(totalTasks - overdueTasks, 0);
    const overduePercent =
      totalTasks > 0 ? Math.round((overdueTasks / totalTasks) * 100) : 0;
    const overdueAngle =
      totalTasks > 0 ? (overdueTasks / totalTasks) * 360 : 0;
    const totalTasksLabel =
      user?.role === RoleEnum.TEACHER ? 'заданий создано' : 'заданий назначено';

    return {
      totalTasks,
      overdueTasks,
      tasksWithoutOverdue,
      overduePercent,
      totalTasksLabel,
      chartStyle: {
        '--overdue-angle': `${overdueAngle}deg`,
      } as CSSProperties,
    };
  }, [isStatsLoading, showTaskStats, statsError, taskStats, user?.role]);

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.MAIN} replace />;
  }

  if (!user?.role) {
    return <Navigate to={ROUTES.MAIN} replace />;
  }

  return (
    <div className={s.profilePage}>
      <section className={s.header}>
        <div>
          <Badge bg="primary" className={s.roleBadge}>
            {ROLE_LABELS[user.role] ?? user.role}
          </Badge>
          <h1>Профиль</h1>
          <p>{user.fullName ?? user.email ?? 'Пользователь портала'}</p>
        </div>

        <Button variant="outline-danger" onClick={logout}>
          Выйти
        </Button>
      </section>

      <div className={s.profileGrid}>
        <Card className={s.profileCard}>
          <Card.Body>
            <Card.Title className={s.cardTitle}>Аккаунт</Card.Title>
            <div className={s.infoList}>
              <div className={s.infoItem}>
                <span>Имя</span>
                <strong>{user.fullName ?? '—'}</strong>
              </div>
              <div className={s.infoItem}>
                <span>Email</span>
                <strong>{user.email ?? '—'}</strong>
              </div>
              <div className={s.infoItem}>
                <span>Роль</span>
                <strong>{ROLE_LABELS[user.role] ?? user.role}</strong>
              </div>
            </div>
          </Card.Body>
        </Card>

        {user.role === RoleEnum.TEACHER && (
          <Card className={s.profileCard}>
            <Card.Body>
              <Card.Title className={s.cardTitle}>Статистика преподавателя</Card.Title>
              <div className={s.infoList}>
                <div className={s.infoItem}>
                  <span>Всего заданий</span>
                  <strong>
                    {isStatsLoading || statsError ? '—' : taskStats?.totalTasks ?? '—'}
                  </strong>
                </div>
                <div className={s.infoItem}>
                  <span>На проверке</span>
                  <strong>
                    {isStatsLoading || statsError ? '—' : taskStats?.pendingReviewReports ?? 0}
                  </strong>
                </div>
                <div className={s.infoItem}>
                  <span>Сдано</span>
                  <strong>
                    {isStatsLoading || statsError ? '—' : taskStats?.acceptedReports ?? 0}
                  </strong>
                </div>
                <div className={s.infoItem}>
                  <span>Без отправок</span>
                  <strong>
                    {isStatsLoading || statsError ? '—' : taskStats?.tasksWithoutReports ?? 0}
                  </strong>
                </div>
                <div className={s.infoItem}>
                  <span>Ближайший дедлайн</span>
                  <strong>
                    {isStatsLoading || statsError ? '—' : taskStats?.nextDeadline ?? '—'}
                  </strong>
                </div>
              </div>
            </Card.Body>
          </Card>
        )}

        {taskChart && (
          <Card
            className={`${s.profileCard} ${s.chartCard} ${
              taskChart.overdueTasks > 0 ? s.chartCardDanger : ''
            }`}
          >
            <Card.Body>
              <div className={s.chartHeader}>
                <div>
                  <Card.Title className={s.cardTitle}>
                    Статистика заданий
                  </Card.Title>
                  <span>{taskChart.totalTasksLabel}</span>
                </div>
                <strong>
                  {isStatsLoading || statsError ? '—' : taskChart.totalTasks}
                </strong>
              </div>

              <div className={s.chartBody}>
                <div
                  className={s.donutChart}
                  style={taskChart.chartStyle}
                  aria-label="Диаграмма просроченных заданий"
                >
                  <div className={s.donutCenter}>
                    <strong>
                      {isStatsLoading || statsError
                        ? '—'
                        : `${taskChart.overduePercent}%`}
                    </strong>
                    <span>просрочено</span>
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
                      {isStatsLoading || statsError
                        ? '—'
                        : taskChart.overdueTasks}
                    </strong>
                  </div>
                </div>
              </div>

              {statsError && (
                <span className={s.statError}>Не удалось загрузить данные</span>
              )}

              <Link to={ROUTES.TASKS} className="btn btn-outline-primary">
                Перейти к заданиям
              </Link>
            </Card.Body>
          </Card>
        )}
      </div>
    </div>
  );
};
