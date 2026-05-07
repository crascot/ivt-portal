/** Соответствует enum на сервере */
export type UmmMaterialKind = 'GENERAL' | 'UMK' | 'LECTURE' | 'LAB' | 'EXTRA';

export const UMM_KIND_LABELS: Record<UmmMaterialKind, string> = {
  GENERAL: 'Общее',
  UMK: 'УМК',
  LECTURE: 'Лекции',
  LAB: 'Лабораторные',
  EXTRA: 'Дополнительно',
};

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

  materialKind: UmmMaterialKind;
  section: string | null;

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

  materialKind: UmmMaterialKind;
  section: string | null;

  urls: string[];
  attachments: UmmMaterialAttachmentDto[];
};

export type UmmDisciplineStatDto = {
  disciplineId: number;
  disciplineName: string;
  materialCount: number;
};

/** Фильтры каталога УММ (главная страница) */
export type UmmCatalogFilters = {
  authorId: number | null;
  search: string;
};

/** Фильтры списка материалов дисциплины */
export type UmmDisciplineFilters = {
  materialKind: UmmMaterialKind | null;
  section: string | null;
  search: string;
};

export type UmmCreatePayload = {
  title: string;
  description: string | null;
  disciplineId: number;
  authorId: number;
  materialKind: UmmMaterialKind;
  section: string | null;
  urls: string[];
  files: File[];
};

export type UmmUpdatePayload = {
  title?: string;
  description?: string | null;
  disciplineId?: number;
  materialKind?: UmmMaterialKind;
  section?: string | null;
  urls?: string[];
  files?: File[];
};
