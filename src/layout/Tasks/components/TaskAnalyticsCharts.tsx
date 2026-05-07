import { Card, Spinner } from 'react-bootstrap';

import { TaskAnalyticsDto } from '@entities/taskRequest';

import s from '../Tasks.module.css';

type Props = {
  analytics: TaskAnalyticsDto | null;
  isLoading: boolean;
  hideTopStudents?: boolean;
};

const formatGrade = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

const EmptyChart = () => (
  <div className={s.chartEmpty}>Пока недостаточно данных</div>
);

const Bars = ({
  items,
  valueKey,
  labelKey,
  maxValue,
  suffix = '',
}: {
  items: Array<Record<string, string | number>>;
  valueKey: string;
  labelKey: string;
  maxValue: number;
  suffix?: string;
}) => (
  <div className={s.barList}>
    {items.map((item) => {
      const value = Number(item[valueKey]);
      const width = maxValue > 0 ? Math.max((value / maxValue) * 100, 4) : 0;

      return (
        <div className={s.barRow} key={String(item[labelKey])}>
          <span className={s.barLabel}>{item[labelKey]}</span>
          <div className={s.barTrack}>
            <span className={s.barFill} style={{ width: `${width}%` }} />
          </div>
          <strong className={s.barValue}>
            {formatGrade(value)}
            {suffix}
          </strong>
        </div>
      );
    })}
  </div>
);

export const TaskAnalyticsCharts = ({
  analytics,
  isLoading,
  hideTopStudents = false,
}: Props) => {
  if (isLoading) {
    return (
      <div className={s.analyticsLoading}>
        <Spinner animation="border" size="sm" />
        <span>Загрузка графиков...</span>
      </div>
    );
  }

  if (!analytics) return null;

  const { submitted, overdue } = analytics.submissionOverview;
  const totalStatus = submitted + overdue;
  const submittedPart = totalStatus > 0 ? (submitted / totalStatus) * 100 : 0;
  const maxWeekly = Math.max(
    ...analytics.weeklySubmissions.map((item) => item.count),
    0
  );
  const maxDisciplineGrade = Math.max(
    ...analytics.disciplineAverageGrades.map((item) => item.averageGrade),
    0
  );
  const maxStudentGrade = Math.max(
    ...analytics.topStudents.map((item) => item.averageGrade),
    0
  );
  const disciplineBarItems = analytics.disciplineAverageGrades.map((item) => ({
    disciplineName: item.disciplineName,
    averageGrade: item.averageGrade,
  }));
  const studentBarItems = analytics.topStudents.map((item) => ({
    studentName: item.studentName,
    averageGrade: item.averageGrade,
  }));

  return (
    <section className={s.analyticsSection}>
      <div className={s.analyticsHeader}>
        <h2>Аналитика успеваемости</h2>
        <p>Сдачи, дедлайны и оценки по текущим доступным данным.</p>
      </div>

      <div className={s.analyticsGrid}>
        <Card className={s.analyticsCard}>
          <Card.Body>
            <Card.Title className={s.analyticsTitle}>
              Сданные / просроченные
            </Card.Title>
            {totalStatus === 0 ? (
              <EmptyChart />
            ) : (
              <div className={s.donutWrap}>
                <div
                  className={s.donut}
                  style={{
                    background: `conic-gradient(#198754 0 ${submittedPart}%, #dc3545 ${submittedPart}% 100%)`,
                  }}
                >
                  <span>{totalStatus}</span>
                </div>
                <div className={s.legend}>
                  <span>
                    <i className={s.legendSuccess} /> Сдано: {submitted}
                  </span>
                  <span>
                    <i className={s.legendDanger} /> Просрочено: {overdue}
                  </span>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>

        <Card className={s.analyticsCard}>
          <Card.Body>
            <Card.Title className={s.analyticsTitle}>
              Динамика сдач по неделям
            </Card.Title>
            {maxWeekly === 0 ? (
              <EmptyChart />
            ) : (
              <div className={s.weekChart}>
                {analytics.weeklySubmissions.map((item) => (
                  <div className={s.weekColumn} key={item.weekStart}>
                    <span
                      className={s.weekBar}
                      style={{
                        height: `${Math.max((item.count / maxWeekly) * 100, 8)}%`,
                      }}
                    />
                    <strong>{item.count}</strong>
                    <small>{item.label}</small>
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>

        <Card className={s.analyticsCard}>
          <Card.Body>
            <Card.Title className={s.analyticsTitle}>
              Средний балл по дисциплинам
            </Card.Title>
            {analytics.disciplineAverageGrades.length === 0 ? (
              <EmptyChart />
            ) : (
              <Bars
                items={disciplineBarItems}
                valueKey="averageGrade"
                labelKey="disciplineName"
                maxValue={Math.max(maxDisciplineGrade, 100)}
              />
            )}
          </Card.Body>
        </Card>

        {!hideTopStudents && (
          <Card className={s.analyticsCard}>
            <Card.Body>
              <Card.Title className={s.analyticsTitle}>
                Топ студентов по успеваемости
              </Card.Title>
              {analytics.topStudents.length === 0 ? (
                <EmptyChart />
              ) : (
                <Bars
                  items={studentBarItems}
                  valueKey="averageGrade"
                  labelKey="studentName"
                  maxValue={Math.max(maxStudentGrade, 100)}
                />
              )}
            </Card.Body>
          </Card>
        )}
      </div>
    </section>
  );
};
