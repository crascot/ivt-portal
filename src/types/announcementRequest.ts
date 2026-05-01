export enum AnnouncementType {
  TaskCreated = 'TASK_CREATED',
  TaskDeadlineReminder = 'TASK_DEADLINE_REMINDER',
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
  seen: boolean;
};
