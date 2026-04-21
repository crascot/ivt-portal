import { useCallback, useEffect, useState } from 'react';

import { teacherApi } from '@api/teacherApi';
import { ReportDto } from '@entities/teacherRequest';

type State = {
  reports: ReportDto[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
};

const initialState: State = {
  reports: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
};

export const useTeacherReports = (
  taskId: number | null,
  teacherId: number | null
) => {
  const [state, setState] = useState<State>(initialState);

  const setPartial = useCallback(
    (patch: Partial<State>) => setState((prev) => ({ ...prev, ...patch })),
    []
  );

  const load = useCallback(async () => {
    if (taskId == null) return;
    setPartial({ isLoading: true, error: null });
    try {
      const reports = await teacherApi.getReportsByTask(taskId);
      setPartial({ reports, isLoading: false });
    } catch {
      setPartial({
        error: 'Не удалось загрузить ответы студентов',
        isLoading: false,
      });
    }
  }, [taskId, setPartial]);

  const setGrade = useCallback(
    async (reportId: number, grade: number) => {
      if (taskId == null || teacherId == null) return;
      setPartial({ isSubmitting: true, error: null });
      try {
        await teacherApi.setReportGrade({ reportId, teacherId, grade });
        const reports = await teacherApi.getReportsByTask(taskId);
        setPartial({ reports, isSubmitting: false });
      } catch {
        setPartial({
          error: 'Не удалось поставить оценку',
          isSubmitting: false,
        });
        throw new Error('grade-failed');
      }
    },
    [taskId, teacherId, setPartial]
  );

  const markChecked = useCallback(
    async (reportId: number, comment: string, files?: File[]) => {
      if (taskId == null) return;
      setPartial({ isSubmitting: true, error: null });
      try {
        await teacherApi.markReportChecked(reportId, comment, files);
        const reports = await teacherApi.getReportsByTask(taskId);
        setPartial({ reports, isSubmitting: false });
      } catch {
        setPartial({
          error: 'Не удалось сохранить замечания',
          isSubmitting: false,
        });
        throw new Error('check-failed');
      }
    },
    [taskId, setPartial]
  );

  const deleteAttachment = useCallback(
    async (attachmentId: number) => {
      if (taskId == null) return;
      setPartial({ error: null });
      try {
        await teacherApi.deleteReportAttachment(attachmentId);
        const reports = await teacherApi.getReportsByTask(taskId);
        setPartial({ reports });
      } catch {
        setPartial({ error: 'Не удалось удалить файл' });
      }
    },
    [taskId, setPartial]
  );

  const downloadAttachment = useCallback(
    async (attachmentId: number, fileName: string) => {
      try {
        await teacherApi.downloadReportAttachment(attachmentId, fileName);
      } catch {
        setPartial({ error: 'Не удалось скачать файл' });
      }
    },
    [setPartial]
  );

  useEffect(() => {
    if (taskId != null) {
      load();
    }
  }, [taskId, load]);

  return {
    ...state,
    reload: load,
    setGrade,
    markChecked,
    deleteAttachment,
    downloadAttachment,
  };
};
