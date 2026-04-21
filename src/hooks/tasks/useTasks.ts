import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@context/AuthContext';
import { RoleEnum } from '@entities/role-enum';
import { DisciplineShort, TeacherShort } from '@entities/scheduleRequest';
import { TaskDto } from '@entities/taskRequest';
import { ReportDto } from '@entities/teacherRequest';
import { taskApi } from '@api/taskApi';
import { scheduleApi } from '@api/scheduleApi';
import { studentApi } from '@api/studentApi';
import { teacherApi } from '@api/teacherApi';

type TasksState = {
  tasks: TaskDto[];
  disciplines: DisciplineShort[];
  teachers: TeacherShort[];
  /** Reports grouped by taskId for student/group-leader aggregate view. */
  reportsByTaskId: Record<number, ReportDto[]>;

  selectedDisciplineId: number | null;
  teacherId: number | null;
  studentId: number | null;

  isLoading: boolean;
  isTasksLoading: boolean;
  isSubmitting: boolean;

  error: string | null;
  actionError: string | null;
};

const initialState: TasksState = {
  tasks: [],
  disciplines: [],
  teachers: [],
  reportsByTaskId: {},
  selectedDisciplineId: null,
  teacherId: null,
  studentId: null,
  isLoading: false,
  isTasksLoading: false,
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

  const canEdit =
    role === RoleEnum.TEACHER ||
    role === RoleEnum.GROUP_LEADER ||
    role === RoleEnum.ADMIN;

  const isStudentView = isStudentLikeRole(role);

  const loadStudentAggregate = useCallback(
    async (studentId: number, disciplines: DisciplineShort[]) => {
      if (disciplines.length === 0) {
        setPartial({
          tasks: [],
          reportsByTaskId: {},
          isTasksLoading: false,
        });
        return;
      }

      const [taskLists, reports] = await Promise.all([
        Promise.all(disciplines.map((d) => taskApi.getTasksByDiscipline(d.id))),
        studentApi.getAllReportsByStudent(studentId),
      ]);

      const tasks = taskLists.flat();
      setPartial({
        tasks,
        reportsByTaskId: groupReportsByTask(reports),
        isTasksLoading: false,
      });
    },
    [setPartial]
  );

  const loadInitialData = useCallback(async () => {
    setPartial({ isLoading: true, error: null });
    try {
      if (role === RoleEnum.TEACHER) {
        const profile = await scheduleApi.getTeacherProfile();
        const teacherDisciplines = await teacherApi.getTeacherDisciplines(
          profile.teacherId
        );
        const disciplines: DisciplineShort[] = teacherDisciplines.map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description,
        }));
        setPartial({
          disciplines,
          teachers: [],
          teacherId: profile.teacherId,
          studentId: null,
          isLoading: false,
        });
        return;
      }

      if (isStudentLikeRole(role)) {
        const profile = await scheduleApi.getStudentProfile();
        const studentDisciplines = await studentApi.getDisciplinesByGroup(
          profile.groupId
        );
        const disciplines: DisciplineShort[] = studentDisciplines.map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description,
        }));
        setPartial({
          disciplines,
          teachers: [],
          teacherId: null,
          studentId: profile.studentId,
          isLoading: false,
          isTasksLoading: true,
        });
        try {
          await loadStudentAggregate(profile.studentId, disciplines);
        } catch {
          setPartial({
            error: 'Не удалось загрузить задания',
            isTasksLoading: false,
          });
        }
        return;
      }

      const [disciplines, teachers] = await Promise.all([
        scheduleApi.getDisciplines(),
        scheduleApi.getTeachers(),
      ]);

      setPartial({
        disciplines,
        teachers,
        teacherId: null,
        studentId: null,
        isLoading: false,
      });
    } catch {
      setPartial({ error: 'Не удалось загрузить данные', isLoading: false });
    }
  }, [role, setPartial, loadStudentAggregate]);

  const loadTasks = useCallback(
    async (disciplineId: number) => {
      setPartial({
        selectedDisciplineId: disciplineId,
        isTasksLoading: true,
        error: null,
      });
      try {
        const tasks = await taskApi.getTasksByDiscipline(disciplineId);
        setPartial({ tasks, isTasksLoading: false });
      } catch {
        setPartial({
          error: 'Не удалось загрузить задания',
          isTasksLoading: false,
        });
      }
    },
    [setPartial]
  );

  const selectDiscipline = useCallback(
    (disciplineId: number | null) => {
      if (disciplineId === null) {
        setPartial({ selectedDisciplineId: null, tasks: [] });
        return;
      }
      loadTasks(disciplineId);
    },
    [loadTasks, setPartial]
  );

  const reloadStudentTasks = useCallback(async () => {
    if (!isStudentView || state.studentId == null) return;
    setPartial({ isTasksLoading: true, error: null });
    try {
      await loadStudentAggregate(state.studentId, state.disciplines);
    } catch {
      setPartial({
        error: 'Не удалось загрузить задания',
        isTasksLoading: false,
      });
    }
  }, [
    isStudentView,
    state.studentId,
    state.disciplines,
    loadStudentAggregate,
    setPartial,
  ]);

  const reloadTasks = useCallback(() => {
    if (isStudentView) {
      void reloadStudentTasks();
      return;
    }
    if (state.selectedDisciplineId !== null) {
      loadTasks(state.selectedDisciplineId);
    }
  }, [
    isStudentView,
    reloadStudentTasks,
    state.selectedDisciplineId,
    loadTasks,
  ]);

  const refreshTasksAfterTeacherMutation = useCallback(async () => {
    if (state.selectedDisciplineId !== null) {
      const tasks = await taskApi.getTasksByDiscipline(
        state.selectedDisciplineId
      );
      setPartial({ tasks });
    }
  }, [state.selectedDisciplineId, setPartial]);

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
        setPartial({ isSubmitting: false });
      } catch {
        setPartial({
          actionError: 'Не удалось создать задание',
          isSubmitting: false,
        });
        throw new Error('Не удалось создать задание');
      }
    },
    [setPartial, refreshTasksAfterTeacherMutation]
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
        setPartial({ isSubmitting: false });
      } catch {
        setPartial({
          actionError: 'Не удалось обновить задание',
          isSubmitting: false,
        });
        throw new Error('Не удалось обновить задание');
      }
    },
    [setPartial, refreshTasksAfterTeacherMutation]
  );

  const deleteTask = useCallback(
    async (taskId: number) => {
      setPartial({ actionError: null });
      try {
        await taskApi.deleteTask(taskId);
        await refreshTasksAfterTeacherMutation();
      } catch {
        setPartial({ actionError: 'Не удалось удалить задание' });
      }
    },
    [setPartial, refreshTasksAfterTeacherMutation]
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
    }
  }, [role, loadInitialData]);

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
