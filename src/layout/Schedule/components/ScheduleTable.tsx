import { DayOfWeek, ScheduleDto } from '@entities/scheduleRequest';

import { ScheduleDiary, ScheduleDiaryItem } from './ScheduleDiary';

type Props = {
  schedule: ScheduleDto[];
  canEdit?: boolean;
  onEdit?: (item: ScheduleDto) => void;
  onDelete?: (id: number) => void;
  isDeleting?: boolean;
};

const mapSchedule = (schedule: ScheduleDto[]): ScheduleDiaryItem[] =>
  schedule.map((item) => ({
    id: item.id,
    dayOfWeek: item.dayOfWeek as DayOfWeek,
    startTime: item.startTime,
    endTime: item.endTime,
    title: item.disciplineName,
    teacherName: item.teacherName,
    position: item.position,
    room: item.room,
    url: item.url,
  }));

export const ScheduleTable = ({
  schedule,
  canEdit = false,
  onEdit,
  onDelete,
  isDeleting,
}: Props) => {
  const handleEdit = (id: number | string) => {
    const item = schedule.find((lesson) => lesson.id === Number(id));
    if (item) onEdit?.(item);
  };

  return (
    <ScheduleDiary
      items={mapSchedule(schedule)}
      emptyText="Расписание пока пусто"
      canEdit={canEdit}
      isDeleting={isDeleting}
      onEdit={handleEdit}
      onDelete={(id) => onDelete?.(Number(id))}
    />
  );
};
