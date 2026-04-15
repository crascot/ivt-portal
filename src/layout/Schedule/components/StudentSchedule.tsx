import { Alert, Badge, Card } from 'react-bootstrap';
import { FiClock, FiMapPin, FiUser } from 'react-icons/fi';

import { UpcomingScheduleDto } from '@entities/scheduleRequest';

import s from '../Schedule.module.css';

type Props = {
  schedule: UpcomingScheduleDto[];
  groupName: string | null;
};

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  const day = date.toLocaleDateString('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const time = date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return { day, time };
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

  return (
    <div className={s.cardGrid}>
      {schedule.map((item) => {
        const start = formatDateTime(item.startDateTime);
        const end = formatDateTime(item.endDateTime);
        const today = isToday(item.startDateTime);

        return (
          <Card key={item.scheduleId} className={today ? s.cardToday : ''}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <Card.Title className="mb-0 fs-6">
                  {item.disciplineName}
                </Card.Title>
                {today && <Badge bg="success">Сегодня</Badge>}
              </div>

              <div className="d-flex flex-column gap-1 text-muted small">
                <span className="d-flex align-items-center gap-1">
                  <FiClock size={14} />
                  {start.day}, {start.time} — {end.time}
                </span>

                {item.teacherName && (
                  <span className="d-flex align-items-center gap-1">
                    <FiUser size={14} />
                    {item.teacherName}
                  </span>
                )}

                {item.room && (
                  <span className="d-flex align-items-center gap-1">
                    <FiMapPin size={14} />
                    Аудитория {item.room}
                  </span>
                )}
              </div>

              {groupName && (
                <div className="mt-2">
                  <Badge bg="secondary">{groupName}</Badge>
                </div>
              )}
            </Card.Body>
          </Card>
        );
      })}
    </div>
  );
};
