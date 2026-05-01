export enum AnnouncementType {
  TaskCreated = 'TASK_CREATED',
  TaskDeadlineReminder = 'TASK_DEADLINE_REMINDER',
  LessonStartingSoon = 'LESSON_STARTING_SOON',
  Custom = 'CUSTOM',
}

export type AnnouncementDto = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  disciplineName: string;
  teacherName: string;
  type: AnnouncementType;
  targetId: number;
  meetingUrl: string | null;
  seen: boolean;
};
