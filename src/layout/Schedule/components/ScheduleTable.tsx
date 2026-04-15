import { Alert, Badge, Button, Card, Table } from 'react-bootstrap';

import {
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_ORDER,
  DayOfWeek,
  ScheduleDto,
} from '@entities/scheduleRequest';

type Props = {
  schedule: ScheduleDto[];
  canEdit?: boolean;
  onEdit?: (item: ScheduleDto) => void;
  onDelete?: (id: number) => void;
  isDeleting?: boolean;
};

export const ScheduleTable = ({
  schedule,
  canEdit = false,
  onEdit,
  onDelete,
  isDeleting,
}: Props) => {
  if (schedule.length === 0) {
    return <Alert variant="light">Расписание пока пусто</Alert>;
  }

  const byDay = DAY_OF_WEEK_ORDER.reduce(
    (acc, day) => {
      const items = schedule.filter((s) => s.dayOfWeek === day);
      if (items.length > 0) acc.push({ day, items });
      return acc;
    },
    [] as { day: DayOfWeek; items: ScheduleDto[] }[]
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
                  <th>Преподаватель</th>
                  <th style={{ width: '120px' }}>Аудитория</th>
                  <th style={{ width: '80px' }}>Ссылка</th>
                  {canEdit && <th style={{ width: '180px' }}>Действия</th>}
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
                      {item.teacherName}
                      {item.position && (
                        <span className="text-muted small ms-1">
                          ({item.position})
                        </span>
                      )}
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
                    {canEdit && (
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => onEdit?.(item)}
                          >
                            Изменить
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            disabled={isDeleting}
                            onClick={() => onDelete?.(item.id)}
                          >
                            Удалить
                          </Button>
                        </div>
                      </td>
                    )}
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
