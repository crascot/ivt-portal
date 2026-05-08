import { Badge } from 'react-bootstrap';

import { DayOfWeek, UpcomingScheduleDto } from '@entities/scheduleRequest';

import { ScheduleDiary, ScheduleDiaryItem } from './ScheduleDiary';

import s from '../Schedule.module.css';

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
    month: 'long',
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

const mapStudentSchedule = (
  schedule: UpcomingScheduleDto[]
): ScheduleDiaryItem[] =>
  schedule.map((item) => ({
    id: item.scheduleId,
    dayOfWeek: getDayOfWeek(item.startDateTime),
    startTime: formatTime(item.startDateTime),
    endTime: formatTime(item.endDateTime),
    title: item.disciplineName,
    teacherName: item.teacherName,
    room: item.room,
    dateLabel: formatDate(item.startDateTime),
  }));

export const StudentSchedule = ({ schedule, groupName }: Props) => {
  return (
    <div className={s.scheduleStack}>
      {groupName && (
        <div>
          <Badge bg="secondary" className={s.groupBadge}>
            {groupName}
          </Badge>
        </div>
      )}

      <ScheduleDiary
        items={mapStudentSchedule(schedule)}
        emptyText="Расписание пока пусто"
      />
    </div>
  );
};
