import { Alert, Badge, Card, Table } from 'react-bootstrap';

import {
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_ORDER,
  DayOfWeek,
  UpcomingScheduleDto,
} from '@entities/scheduleRequest';

type Props = {
  schedule: UpcomingScheduleDto[];
  groupName: string | null;
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  });

const getDayOfWeek = (iso: string): DayOfWeek => {
  const day = new Date(iso).getDay();
  switch (day) {
    case 1:
      return DayOfWeek.Monday;
    case 2:
      return DayOfWeek.Tuesday;
    case 3:
      return DayOfWeek.Wednesday;
    case 4:
      return DayOfWeek.Thursday;
    case 5:
      return DayOfWeek.Friday;
    case 6:
      return DayOfWeek.Saturday;
    default:
      return DayOfWeek.Sunday;
  }
};

const isToday = (iso: string) => {
  const date = new Date(iso);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const StudentSchedule = ({ schedule, groupName }: Props) => {
  if (schedule.length === 0) {
    return <Alert variant="light">Расписание пока пусто</Alert>;
  }

  const byDay = DAY_OF_WEEK_ORDER.reduce(
    (acc, day) => {
      const items = schedule
        .filter((item) => getDayOfWeek(item.startDateTime) === day)
        .sort(
          (a, b) =>
            new Date(a.startDateTime).getTime() -
            new Date(b.startDateTime).getTime()
        );
      if (items.length > 0) acc.push({ day, items });
      return acc;
    },
    [] as { day: DayOfWeek; items: UpcomingScheduleDto[] }[]
  );

  return (
    <div className="d-flex flex-column gap-3">
      {groupName && (
        <div>
          <Badge bg="secondary">{groupName}</Badge>
        </div>
      )}

      {byDay.map(({ day, items }) => (
        <Card key={day}>
          <Card.Header>
            <strong>{DAY_OF_WEEK_LABELS[day]}</strong>
            <Badge bg="secondary" className="ms-2">
              {items.length}
            </Badge>
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0 align-middle">
              <thead>
                <tr>
                  <th style={{ width: '140px' }}>Время</th>
                  <th style={{ width: '120px' }}>Дата</th>
                  <th>Дисциплина</th>
                  <th>Преподаватель</th>
                  <th style={{ width: '120px' }}>Аудитория</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const today = isToday(item.startDateTime);
                  return (
                    <tr key={item.scheduleId}>
                      <td>
                        {formatTime(item.startDateTime)} —{' '}
                        {formatTime(item.endDateTime)}
                      </td>
                      <td>
                        {formatDate(item.startDateTime)}
                        {today && (
                          <Badge bg="success" className="ms-2">
                            Сегодня
                          </Badge>
                        )}
                      </td>
                      <td>{item.disciplineName}</td>
                      <td>{item.teacherName || '—'}</td>
                      <td>{item.room || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};
