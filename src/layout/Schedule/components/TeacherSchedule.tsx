import { TeacherScheduleDto } from '@entities/scheduleRequest';

import { ScheduleDiary, ScheduleDiaryItem } from './ScheduleDiary';

type Props = {
  schedule: TeacherScheduleDto[];
};

const mapTeacherSchedule = (
  schedule: TeacherScheduleDto[]
): ScheduleDiaryItem[] =>
  schedule.map((item) => ({
    id: item.id,
    dayOfWeek: item.dayOfWeek,
    startTime: item.startTime,
    endTime: item.endTime,
    title: item.disciplineName,
    groupName: item.groupName,
    room: item.room,
    url: item.url,
  }));

export const TeacherSchedule = ({ schedule }: Props) => (
  <ScheduleDiary
    items={mapTeacherSchedule(schedule)}
    emptyText="Расписание пока пусто"
  />
);
