export type UmmMaterialAttachmentDto = {
  id: number;
  fileName: string;
  fileType: string;
};

export type UmmMaterialShortDto = {
  id: number;
  title: string;
  description: string | null;
  createdAt: string | null;
  updatedAt: string | null;

  disciplineId: number;
  disciplineName: string;

  authorId: number;
  authorName: string;

  attachmentsCount: number;
  urlsCount: number;
};

export type UmmMaterialDto = {
  id: number;
  title: string;
  description: string | null;
  createdAt: string | null;
  updatedAt: string | null;

  disciplineId: number;
  disciplineName: string;

  authorId: number;
  authorName: string;

  urls: string[];
  attachments: UmmMaterialAttachmentDto[];
};

export type UmmFilters = {
  disciplineId: number | null;
  authorId: number | null;
  search: string;
};

export type UmmCreatePayload = {
  title: string;
  description: string | null;
  disciplineId: number;
  authorId: number;
  urls: string[];
  files: File[];
};

export type UmmUpdatePayload = {
  title?: string;
  description?: string | null;
  disciplineId?: number;
  urls?: string[];
  files?: File[];
};
