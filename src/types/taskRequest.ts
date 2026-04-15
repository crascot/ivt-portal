export type TaskAttachmentDto = {
  id: number;
  fileName: string;
  contentType: string;
};

export type TaskDto = {
  id: number;
  title: string;
  description: string;
  disciplineName: string;
  teacherName: string;
  attachments: TaskAttachmentDto[];
};

export type TaskDiscipline = {
  id: number;
  name: string;
  description?: string;
};

export type CreateTaskDto = {
  title: string;
  description: string;
  disciplineId: number;
  createdById: number;
  file?: File | null;
};
