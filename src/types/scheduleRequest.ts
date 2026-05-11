export enum DayOfWeek {
  Monday = 'MONDAY',
  Tuesday = 'TUESDAY',
  Wednesday = 'WEDNESDAY',
  Thursday = 'THURSDAY',
  Friday = 'FRIDAY',
  Saturday = 'SATURDAY',
  Sunday = 'SUNDAY',
}

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.Monday]: 'Понедельник',
  [DayOfWeek.Tuesday]: 'Вторник',
  [DayOfWeek.Wednesday]: 'Среда',
  [DayOfWeek.Thursday]: 'Четверг',
  [DayOfWeek.Friday]: 'Пятница',
  [DayOfWeek.Saturday]: 'Суббота',
  [DayOfWeek.Sunday]: 'Воскресенье',
};

export const DAY_OF_WEEK_ORDER: DayOfWeek[] = [
  DayOfWeek.Monday,
  DayOfWeek.Tuesday,
  DayOfWeek.Wednesday,
  DayOfWeek.Thursday,
  DayOfWeek.Friday,
  DayOfWeek.Saturday,
];

export type AddScheduleDto = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room?: string;
  url?: string;
  groupId: number;
  disciplineId: number;
  teacherId: number;
};

export type ScheduleDto = {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
  disciplineName: string;
  teacherName: string;
  position: string | null;
  url: string | null;
};

export type TeacherScheduleDto = {
  id: number;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string | null;
  url: string | null;
  disciplineName: string;
  groupName: string;
};

export type UpcomingScheduleDto = {
  scheduleId: number;
  disciplineName: string;
  teacherName: string | null;
  room: string | null;
  startDateTime: string;
  endDateTime: string;
};

export type DisciplineShort = {
  id: number;
  name: string;
  description: string;
};

export type TeacherShort = {
  id: number;
  fullName: string;
  position: string;
};

export type StudentProfile = {
  id: number;
  fullName: string;
  email: string;
  enabled: boolean;
  roles: string[];
  group: string;
  studentId: number;
  groupId: number;
};

export type TeacherProfile = {
  id: number;
  fullName: string;
  email: string;
  enabled: boolean;
  roles: string[];
  position: string;
  phoneNumber: string | null;
  whatsApp: string | null;
  teacherId: number;
};

export type GroupShort = {
  id: number;
  name: string;
  courseNumber: number;
  specialty: string;
};
