import { Alert, Badge, Card, Table } from 'react-bootstrap';

import {
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_ORDER,
  DayOfWeek,
  TeacherScheduleDto,
} from '@entities/scheduleRequest';

type Props = {
  schedule: TeacherScheduleDto[];
};

export const TeacherSchedule = ({ schedule }: Props) => {
  if (schedule.length === 0) {
    return <Alert variant="light">Расписание пока пусто</Alert>;
  }

  const byDay = DAY_OF_WEEK_ORDER.reduce(
    (acc, day) => {
      const items = schedule.filter((s) => s.dayOfWeek === day);
      if (items.length > 0) acc.push({ day, items });
      return acc;
    },
    [] as { day: DayOfWeek; items: TeacherScheduleDto[] }[]
  );

  return (
    <div className="d-flex flex-column gap-3">
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
                  <th>Дисциплина</th>
                  <th>Группа</th>
                  <th style={{ width: '120px' }}>Аудитория</th>
                  <th style={{ width: '80px' }}>Ссылка</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.startTime} — {item.endTime}
                    </td>
                    <td>{item.disciplineName}</td>
                    <td>
                      <Badge bg="outline-primary" text="dark">
                        {item.groupName}
                      </Badge>
                    </td>
                    <td>{item.room || '—'}</td>
                    <td>
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Открыть
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};
