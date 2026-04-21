import { useCallback, useEffect, useState } from 'react';

import { studentApi } from '@api/studentApi';
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

export const useStudentReports = (
  taskId: number | null,
  studentId: number | null
) => {
  const [state, setState] = useState<State>(initialState);

  const setPartial = useCallback(
    (patch: Partial<State>) => setState((prev) => ({ ...prev, ...patch })),
    []
  );

  const load = useCallback(async () => {
    if (taskId == null || studentId == null) return;
    setPartial({ isLoading: true, error: null });
    try {
      const reports = await studentApi.getReportsByTaskAndStudent(
        taskId,
        studentId
      );
      setPartial({ reports, isLoading: false });
    } catch {
      setPartial({
        error: 'Не удалось загрузить отчеты',
        isLoading: false,
      });
    }
  }, [taskId, studentId, setPartial]);

  const submitReport = useCallback(
    async (comment: string, files?: File[]) => {
      if (taskId == null || studentId == null) return;
      setPartial({ isSubmitting: true, error: null });
      try {
        await studentApi.submitReport({
          taskId,
          studentId,
          comment,
          files,
        });
        const reports = await studentApi.getReportsByTaskAndStudent(
          taskId,
          studentId
        );
        setPartial({ reports, isSubmitting: false });
      } catch {
        setPartial({
          error: 'Не удалось отправить ответ',
          isSubmitting: false,
        });
        throw new Error('submit-failed');
      }
    },
    [taskId, studentId, setPartial]
  );

  const deleteReport = useCallback(
    async (reportId: number) => {
      if (taskId == null || studentId == null) return;
      setPartial({ error: null });
      try {
        await studentApi.deleteReport(reportId);
        const reports = await studentApi.getReportsByTaskAndStudent(
          taskId,
          studentId
        );
        setPartial({ reports });
      } catch {
        setPartial({ error: 'Не удалось удалить ответ' });
      }
    },
    [taskId, studentId, setPartial]
  );

  const deleteAttachment = useCallback(
    async (attachmentId: number) => {
      if (taskId == null || studentId == null) return;
      setPartial({ error: null });
      try {
        await studentApi.deleteReportAttachment(attachmentId);
        const reports = await studentApi.getReportsByTaskAndStudent(
          taskId,
          studentId
        );
        setPartial({ reports });
      } catch {
        setPartial({ error: 'Не удалось удалить файл' });
      }
    },
    [taskId, studentId, setPartial]
  );

  const downloadAttachment = useCallback(
    async (attachmentId: number, fileName: string) => {
      try {
        await studentApi.downloadReportAttachment(attachmentId, fileName);
      } catch {
        setPartial({ error: 'Не удалось скачать файл' });
      }
    },
    [setPartial]
  );

  useEffect(() => {
    if (taskId != null && studentId != null) {
      load();
    }
  }, [taskId, studentId, load]);

  return {
    ...state,
    reload: load,
    submitReport,
    deleteReport,
    deleteAttachment,
    downloadAttachment,
  };
};
