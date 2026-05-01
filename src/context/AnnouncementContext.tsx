import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { announcementApi } from '@api/announcementApi';
import { scheduleApi } from '@api/scheduleApi';
import { useAuth } from '@context/AuthContext';
import { RoleEnum } from '@entities/role-enum';
import { AnnouncementDto } from '@entities/announcementRequest';

const POLL_INTERVAL_MS = 60 * 1000;

type AnnouncementContextValue = {
  announcements: AnnouncementDto[];
  unseenCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getHistory: () => Promise<AnnouncementDto[]>;
  markAsSeen: (announcementId: number) => Promise<void>;
  markAllAsSeen: () => Promise<void>;
};

const AnnouncementContext = createContext<AnnouncementContextValue | null>(
  null
);

type Props = {
  children: ReactNode;
};

const isStudentRole = (role: RoleEnum | undefined) =>
  role === RoleEnum.STUDENT || role === RoleEnum.GROUP_LEADER;

const isTeacherRole = (role: RoleEnum | undefined) => role === RoleEnum.TEACHER;

export const AnnouncementProvider = ({ children }: Props) => {
  const { isAuthenticated, user } = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const studentEnabled = isStudentRole(user?.role);
  const teacherEnabled = isTeacherRole(user?.role);
  const isSupportedRole = studentEnabled || teacherEnabled;

  const resolveStudentScope = useCallback(async () => {
    const profile = await scheduleApi.getStudentProfile();
    const resolved = { userId: profile.id, groupId: profile.groupId };
    setCurrentUserId(resolved.userId);
    return resolved;
  }, []);

  const resolveTeacherScope = useCallback(async () => {
    const profile = await scheduleApi.getTeacherProfile();
    const resolved = { userId: profile.id, teacherId: profile.teacherId };
    setCurrentUserId(resolved.userId);
    return resolved;
  }, []);

  const resolveCurrentUserId = useCallback(async (): Promise<number> => {
    if (currentUserId != null) return currentUserId;
    if (studentEnabled) {
      return (await resolveStudentScope()).userId;
    }
    if (teacherEnabled) {
      return (await resolveTeacherScope()).userId;
    }
    throw new Error('Unsupported role');
  }, [
    currentUserId,
    studentEnabled,
    teacherEnabled,
    resolveStudentScope,
    resolveTeacherScope,
  ]);

  const loadAnnouncements = useCallback(
    async (silent = false) => {
      if (!isAuthenticated || !isSupportedRole) {
        setAnnouncements([]);
        setError(null);
        setIsLoading(false);
        setCurrentUserId(null);
        return;
      }

      if (!silent) {
        setIsLoading(true);
      }

      try {
        let data: AnnouncementDto[] = [];

        if (studentEnabled) {
          const profile = await resolveStudentScope();
          data = await announcementApi.getForGroupUser(
            profile.groupId,
            profile.userId
          );
        } else if (teacherEnabled) {
          const profile = await resolveTeacherScope();
          data = await announcementApi.getLessonRemindersForTeacher(
            profile.teacherId,
            profile.userId
          );
        }

        setAnnouncements(data);
        setError(null);
      } catch {
        setError('Не удалось загрузить уведомления');
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [
      isAuthenticated,
      isSupportedRole,
      studentEnabled,
      teacherEnabled,
      resolveStudentScope,
      resolveTeacherScope,
    ]
  );

  useEffect(() => {
    if (!isAuthenticated || !isSupportedRole) {
      setAnnouncements([]);
      setError(null);
      setIsLoading(false);
      setCurrentUserId(null);
      return;
    }

    void loadAnnouncements();

    const intervalId = window.setInterval(() => {
      void loadAnnouncements(true);
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, isSupportedRole, loadAnnouncements]);

  const markAsSeen = useCallback(
    async (announcementId: number) => {
      if (!isAuthenticated || !isSupportedRole) return;

      try {
        const userId = await resolveCurrentUserId();

        await announcementApi.markAsSeen(announcementId, userId);
        setAnnouncements((prev) =>
          prev.map((announcement) =>
            announcement.id === announcementId
              ? { ...announcement, seen: true }
              : announcement
          )
        );
      } catch {
        setError('Не удалось обновить статус уведомления');
      }
    },
    [isAuthenticated, isSupportedRole, resolveCurrentUserId]
  );

  const markAllAsSeen = useCallback(async () => {
    if (!isAuthenticated || !isSupportedRole) return;

    const unseenIds = announcements
      .filter((announcement) => !announcement.seen)
      .map((announcement) => announcement.id);

    if (unseenIds.length === 0) return;

    setAnnouncements((prev) =>
      prev.map((announcement) =>
        announcement.seen ? announcement : { ...announcement, seen: true }
      )
    );

    try {
      const userId = await resolveCurrentUserId();
      await Promise.all(
        unseenIds.map((id) => announcementApi.markAsSeen(id, userId))
      );
    } catch {
      setError('Не удалось обновить статус уведомлений');
    }
  }, [announcements, isAuthenticated, isSupportedRole, resolveCurrentUserId]);

  const getHistory = useCallback(async (): Promise<AnnouncementDto[]> => {
    if (!isAuthenticated || !isSupportedRole) return [];

    if (studentEnabled) {
      const profile = await resolveStudentScope();
      return announcementApi.getHistoryForGroupUser(
        profile.groupId,
        profile.userId
      );
    }

    if (teacherEnabled) {
      const profile = await resolveTeacherScope();
      return announcementApi.getLessonReminderHistoryForTeacher(
        profile.teacherId,
        profile.userId
      );
    }

    return [];
  }, [
    isAuthenticated,
    isSupportedRole,
    studentEnabled,
    teacherEnabled,
    resolveStudentScope,
    resolveTeacherScope,
  ]);

  const unseenCount = useMemo(
    () => announcements.filter((announcement) => !announcement.seen).length,
    [announcements]
  );

  const value = useMemo<AnnouncementContextValue>(
    () => ({
      announcements,
      unseenCount,
      isLoading,
      error,
      refresh: () => loadAnnouncements(),
      getHistory,
      markAsSeen,
      markAllAsSeen,
    }),
    [
      announcements,
      unseenCount,
      isLoading,
      error,
      loadAnnouncements,
      getHistory,
      markAsSeen,
      markAllAsSeen,
    ]
  );

  return (
    <AnnouncementContext.Provider value={value}>
      {children}
    </AnnouncementContext.Provider>
  );
};

export const useAnnouncements = (): AnnouncementContextValue => {
  const context = useContext(AnnouncementContext);

  if (!context) {
    throw new Error(
      'useAnnouncements must be used inside AnnouncementProvider'
    );
  }

  return context;
};
