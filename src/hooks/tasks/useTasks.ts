import { useCallback, useEffect, useState } from 'react';

import { taskApi } from '@api/taskApi';
import { scheduleApi } from '@api/scheduleApi';
import { studentApi } from '@api/studentApi';
import { teacherApi } from '@api/teacherApi';
import { useAuth } from '@context/AuthContext';
import { RoleEnum } from '@entities/role-enum';
import { DisciplineShort, TeacherShort } from '@entities/scheduleRequest';
import { TaskAnalyticsDto, TaskDto } from '@entities/taskRequest';
import { ReportDto } from '@entities/teacherRequest';
import { sortTasksByCreatedAt } from '../../layout/Tasks/taskUi';

type TasksState = {
  tasks: TaskDto[];
  disciplines: DisciplineShort[];
  teachers: TeacherShort[];
  reportsByTaskId: Record<number, ReportDto[]>;
  analytics: TaskAnalyticsDto | null;

  selectedDisciplineId: number | null;
  teacherId: number | null;
  studentId: number | null;

  isLoading: boolean;
  isTasksLoading: boolean;
  isAnalyticsLoading: boolean;
  isSubmitting: boolean;

  error: string | null;
  actionError: string | null;
};

const initialState: TasksState = {
  tasks: [],
  disciplines: [],
  teachers: [],
  reportsByTaskId: {},
  analytics: null,
  selectedDisciplineId: null,
  teacherId: null,
  studentId: null,
  isLoading: false,
  isTasksLoading: false,
  isAnalyticsLoading: false,
  isSubmitting: false,
  error: null,
  actionError: null,
};

const groupReportsByTask = (
  reports: ReportDto[]
): Record<number, ReportDto[]> => {
  return reports.reduce<Record<number, ReportDto[]>>((acc, report) => {
    if (!acc[report.taskId]) {
      acc[report.taskId] = [];
    }
    acc[report.taskId].push(report);
    return acc;
  }, {});
};

const isStudentLikeRole = (role: RoleEnum | undefined) =>
  role === RoleEnum.STUDENT || role === RoleEnum.GROUP_LEADER;

export const useTasks = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [state, setState] = useState<TasksState>(initialState);

  const setPartial = useCallback(
    (patch: Partial<TasksState>) => setState((prev) => ({ ...prev, ...patch })),
    []
  );

  const canEdit = role === RoleEnum.TEACHER || role === RoleEnum.ADMIN;
  const isStudentView = isStudentLikeRole(role);

  const fetchCurrentTasks = useCallback(async () => {
    const tasks = await taskApi.getCurrentUserTasks();
    return sortTasksByCreatedAt(tasks);
  }, []);

  const loadAnalytics = useCallback(async () => {
    if (!role) return;
    setPartial({ isAnalyticsLoading: true });
    try {
      const analytics = await taskApi.getTaskAnalytics();
      setPartial({ analytics, isAnalyticsLoading: false });
    } catch {
      setPartial({ analytics: null, isAnalyticsLoading: false });
    }
  }, [role, setPartial]);

  const loadStudentAggregate = useCallback(
    async (studentId: number) => {
      const [tasks, reports] = await Promise.all([
        fetchCurrentTasks(),
        studentApi.getAllReportsByStudent(studentId),
      ]);

      setPartial({
        tasks,
        reportsByTaskId: groupReportsByTask(reports),
        isTasksLoading: false,
      });
    },
    [fetchCurrentTasks, setPartial]
  );

  const loadCurrentTasks = useCallback(async () => {
    setPartial({ isTasksLoading: true, error: null });
    try {
      const tasks = await fetchCurrentTasks();
      setPartial({ tasks, isTasksLoading: false });
    } catch {
      setPartial({
        error: 'Не удалось загрузить задания',
        isTasksLoading: false,
      });
    }
  }, [fetchCurrentTasks, setPartial]);

  const loadInitialData = useCallback(async () => {
    setPartial({ isLoading: true, isTasksLoading: true, error: null });

    try {
      if (role === RoleEnum.TEACHER) {
        const profile = await scheduleApi.getTeacherProfile();
        const [teacherDisciplines, tasks] = await Promise.all([
          teacherApi.getTeacherDisciplines(profile.teacherId),
          fetchCurrentTasks(),
        ]);
        const disciplines: DisciplineShort[] = teacherDisciplines.map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description,
        }));

        setPartial({
          disciplines,
          teachers: [],
          tasks,
          reportsByTaskId: {},
          teacherId: profile.teacherId,
          studentId: null,
          isLoading: false,
          isTasksLoading: false,
          selectedDisciplineId: null,
        });
        return;
      }

      if (isStudentLikeRole(role)) {
        const profile = await scheduleApi.getStudentProfile();
        const [studentDisciplines, tasks, reports] = await Promise.all([
          studentApi.getDisciplinesByGroup(profile.groupId),
          fetchCurrentTasks(),
          studentApi.getAllReportsByStudent(profile.studentId),
        ]);
        const disciplines: DisciplineShort[] = studentDisciplines.map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description,
        }));

        setPartial({
          disciplines,
          teachers: [],
          tasks,
          reportsByTaskId: groupReportsByTask(reports),
          teacherId: null,
          studentId: profile.studentId,
          isLoading: false,
          isTasksLoading: false,
          selectedDisciplineId: null,
        });
        return;
      }

      if (role === RoleEnum.ADMIN) {
        const [disciplines, teachers, tasks] = await Promise.all([
          scheduleApi.getDisciplines(),
          scheduleApi.getTeachers(),
          fetchCurrentTasks(),
        ]);

        setPartial({
          disciplines,
          teachers,
          tasks,
          reportsByTaskId: {},
          teacherId: null,
          studentId: null,
          isLoading: false,
          isTasksLoading: false,
          selectedDisciplineId: null,
        });
        return;
      }

      setPartial({ isLoading: false, isTasksLoading: false });
    } catch {
      setPartial({
        error: 'Не удалось загрузить данные',
        isLoading: false,
        isTasksLoading: false,
      });
    }
  }, [role, setPartial, fetchCurrentTasks]);

  const selectDiscipline = useCallback(
    (disciplineId: number | null) => {
      setPartial({ selectedDisciplineId: disciplineId });
    },
    [setPartial]
  );

  const reloadStudentTasks = useCallback(async () => {
    if (!isStudentView || state.studentId == null) return;
    setPartial({ isTasksLoading: true, error: null });
    try {
      await loadStudentAggregate(state.studentId);
      await loadAnalytics();
    } catch {
      setPartial({
        error: 'Не удалось загрузить задания',
        isTasksLoading: false,
      });
    }
  }, [
    isStudentView,
    state.studentId,
    loadStudentAggregate,
    loadAnalytics,
    setPartial,
  ]);

  const reloadTasks = useCallback(() => {
    if (isStudentView) {
      void reloadStudentTasks();
      return;
    }

    void loadCurrentTasks();
    void loadAnalytics();
  }, [isStudentView, reloadStudentTasks, loadCurrentTasks, loadAnalytics]);

  const refreshTasksAfterTeacherMutation = useCallback(async () => {
    const tasks = await fetchCurrentTasks();
    setPartial({ tasks });
  }, [fetchCurrentTasks, setPartial]);

  const addTask = useCallback(
    async (
      title: string,
      description: string,
      disciplineId: number,
      createdById: number,
      deadline: string | null,
      files?: File[]
    ) => {
      setPartial({ isSubmitting: true, actionError: null });
      try {
        await taskApi.addTask(
          title,
          description,
          disciplineId,
          createdById,
          deadline,
          files
        );
        await refreshTasksAfterTeacherMutation();
        await loadAnalytics();
        setPartial({ isSubmitting: false });
      } catch {
        setPartial({
          actionError: 'Не удалось создать задание',
          isSubmitting: false,
        });
        throw new Error('Не удалось создать задание');
      }
    },
    [setPartial, refreshTasksAfterTeacherMutation, loadAnalytics]
  );

  const updateTask = useCallback(
    async (
      taskId: number,
      params: {
        title?: string;
        description?: string;
        disciplineId?: number;
        deadline?: string | null;
        files?: File[];
      }
    ) => {
      setPartial({ isSubmitting: true, actionError: null });
      try {
        await taskApi.updateTask(taskId, params);
        await refreshTasksAfterTeacherMutation();
        await loadAnalytics();
        setPartial({ isSubmitting: false });
      } catch {
        setPartial({
          actionError: 'Не удалось обновить задание',
          isSubmitting: false,
        });
        throw new Error('Не удалось обновить задание');
      }
    },
    [setPartial, refreshTasksAfterTeacherMutation, loadAnalytics]
  );

  const deleteTask = useCallback(
    async (taskId: number) => {
      setPartial({ actionError: null });
      try {
        await taskApi.deleteTask(taskId);
        await refreshTasksAfterTeacherMutation();
        await loadAnalytics();
      } catch {
        setPartial({ actionError: 'Не удалось удалить задание' });
      }
    },
    [setPartial, refreshTasksAfterTeacherMutation, loadAnalytics]
  );

  const deleteAttachment = useCallback(
    async (attachmentId: number) => {
      setPartial({ actionError: null });
      try {
        await taskApi.deleteAttachment(attachmentId);
        await refreshTasksAfterTeacherMutation();
      } catch {
        setPartial({ actionError: 'Не удалось удалить файл' });
      }
    },
    [setPartial, refreshTasksAfterTeacherMutation]
  );

  const downloadAttachment = useCallback(
    async (attachmentId: number, fileName: string) => {
      try {
        await taskApi.downloadAttachment(attachmentId, fileName);
      } catch {
        setPartial({ actionError: 'Не удалось скачать файл' });
      }
    },
    [setPartial]
  );

  useEffect(() => {
    if (role) {
      loadInitialData();
      loadAnalytics();
    }
  }, [role, loadInitialData, loadAnalytics]);

  return {
    ...state,
    role,
    canEdit,
    isStudentView,
    selectDiscipline,
    reloadTasks,
    reloadStudentTasks,
    addTask,
    updateTask,
    deleteTask,
    deleteAttachment,
    downloadAttachment,
  };
};
