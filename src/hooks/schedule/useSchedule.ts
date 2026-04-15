import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@context/AuthContext';
import { RoleEnum } from '@entities/role-enum';
import {
  AddScheduleDto,
  DisciplineShort,
  GroupShort,
  ScheduleDto,
  TeacherScheduleDto,
  TeacherShort,
  UpcomingScheduleDto,
} from '@entities/scheduleRequest';
import { scheduleApi } from '@api/scheduleApi';

type ScheduleState = {
  studentSchedule: UpcomingScheduleDto[];
  teacherSchedule: TeacherScheduleDto[];
  groupSchedule: ScheduleDto[];

  groups: GroupShort[];
  disciplines: DisciplineShort[];
  teachers: TeacherShort[];

  groupId: number | null;
  teacherId: number | null;
  groupName: string | null;
  selectedGroupId: number | null;

  isLoading: boolean;
  error: string | null;
  actionError: string | null;
};

const initialState: ScheduleState = {
  studentSchedule: [],
  teacherSchedule: [],
  groupSchedule: [],
  groups: [],
  disciplines: [],
  teachers: [],
  groupId: null,
  teacherId: null,
  groupName: null,
  selectedGroupId: null,
  isLoading: false,
  error: null,
  actionError: null,
};

export const useSchedule = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [state, setState] = useState<ScheduleState>(initialState);

  const setPartial = useCallback(
    (patch: Partial<ScheduleState>) =>
      setState((prev) => ({ ...prev, ...patch })),
    []
  );

  const loadStudentSchedule = useCallback(async () => {
    setPartial({ isLoading: true, error: null });
    try {
      const profile = await scheduleApi.getStudentProfile();
      const schedule = await scheduleApi.getStudentSchedule(
        profile.groupId,
        50
      );
      setPartial({
        studentSchedule: schedule,
        groupId: profile.groupId,
        groupName: profile.group,
        isLoading: false,
      });
    } catch {
      setPartial({
        error: 'Не удалось загрузить расписание',
        isLoading: false,
      });
    }
  }, [setPartial]);

  const loadTeacherSchedule = useCallback(async () => {
    setPartial({ isLoading: true, error: null });
    try {
      const profile = await scheduleApi.getTeacherProfile();
      const schedule = await scheduleApi.getTeacherSchedule(profile.teacherId);
      setPartial({
        teacherSchedule: schedule,
        teacherId: profile.teacherId,
        isLoading: false,
      });
    } catch {
      setPartial({
        error: 'Не удалось загрузить расписание',
        isLoading: false,
      });
    }
  }, [setPartial]);

  const loadGroupLeaderSchedule = useCallback(async () => {
    setPartial({ isLoading: true, error: null });
    try {
      const profile = await scheduleApi.getStudentProfile();
      const [schedule, disciplines, teachers] = await Promise.all([
        scheduleApi.getGroupSchedule(profile.groupId),
        scheduleApi.getDisciplines(),
        scheduleApi.getTeachers(),
      ]);
      setPartial({
        groupSchedule: schedule,
        disciplines,
        teachers,
        groupId: profile.groupId,
        groupName: profile.group,
        isLoading: false,
      });
    } catch {
      setPartial({
        error: 'Не удалось загрузить расписание',
        isLoading: false,
      });
    }
  }, [setPartial]);

  const loadAdminSchedule = useCallback(async () => {
    setPartial({ isLoading: true, error: null });
    try {
      const groups = await scheduleApi.getGroups();
      setPartial({ groups, isLoading: false });
    } catch {
      setPartial({ error: 'Не удалось загрузить группы', isLoading: false });
    }
  }, [setPartial]);

  const selectGroup = useCallback(
    async (groupId: number) => {
      setPartial({ selectedGroupId: groupId, isLoading: true, error: null });
      try {
        const schedule = await scheduleApi.getAdminGroupSchedule(groupId);
        setPartial({ groupSchedule: schedule, isLoading: false });
      } catch {
        setPartial({
          error: 'Не удалось загрузить расписание группы',
          isLoading: false,
        });
      }
    },
    [setPartial]
  );

  const addSchedule = useCallback(
    async (dto: AddScheduleDto) => {
      setPartial({ actionError: null });
      try {
        await scheduleApi.createSchedule(dto);
        if (state.groupId) {
          const schedule = await scheduleApi.getGroupSchedule(state.groupId);
          setPartial({ groupSchedule: schedule });
        }
      } catch {
        setPartial({ actionError: 'Не удалось добавить занятие' });
        throw new Error('Не удалось добавить занятие');
      }
    },
    [setPartial, state.groupId]
  );

  const updateSchedule = useCallback(
    async (id: number, dto: AddScheduleDto) => {
      setPartial({ actionError: null });
      try {
        await scheduleApi.updateSchedule(id, dto);
        if (state.groupId) {
          const schedule = await scheduleApi.getGroupSchedule(state.groupId);
          setPartial({ groupSchedule: schedule });
        }
      } catch {
        setPartial({ actionError: 'Не удалось обновить занятие' });
        throw new Error('Не удалось обновить занятие');
      }
    },
    [setPartial, state.groupId]
  );

  const deleteSchedule = useCallback(
    async (id: number) => {
      setPartial({ actionError: null });
      try {
        await scheduleApi.deleteSchedule(id);
        if (state.groupId) {
          const schedule = await scheduleApi.getGroupSchedule(state.groupId);
          setPartial({ groupSchedule: schedule });
        }
      } catch {
        setPartial({ actionError: 'Не удалось удалить занятие' });
      }
    },
    [setPartial, state.groupId]
  );

  const reload = useCallback(() => {
    switch (role) {
      case RoleEnum.STUDENT:
        return loadStudentSchedule();
      case RoleEnum.TEACHER:
        return loadTeacherSchedule();
      case RoleEnum.GROUP_LEADER:
        return loadGroupLeaderSchedule();
      case RoleEnum.ADMIN:
        return loadAdminSchedule();
      default:
        return Promise.resolve();
    }
  }, [
    role,
    loadStudentSchedule,
    loadTeacherSchedule,
    loadGroupLeaderSchedule,
    loadAdminSchedule,
  ]);

  useEffect(() => {
    if (role) {
      reload();
    }
  }, [role, reload]);

  return {
    ...state,
    role,
    selectGroup,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    reload,
  };
};
