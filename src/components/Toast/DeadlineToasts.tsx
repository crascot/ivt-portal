import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAnnouncements } from '@context/AnnouncementContext';
import { AnnouncementType } from '@entities/announcementRequest';
import { ROUTES } from '@utils/routes';

import { Toast } from './Toast';
import { ToastContainer } from './ToastContainer';

export const DeadlineToasts = () => {
  const navigate = useNavigate();
  const { announcements, markAsSeen } = useAnnouncements();
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  const deadlineToasts = useMemo(
    () =>
      announcements.filter(
        (announcement) =>
          announcement.type === AnnouncementType.TaskDeadlineReminder &&
          !announcement.seen &&
          !dismissedIds.has(announcement.id)
      ),
    [announcements, dismissedIds]
  );

  useEffect(() => {
    setDismissedIds((prev) => {
      if (prev.size === 0) return prev;
      const stillRelevantIds = new Set(
        announcements.filter((a) => !a.seen).map((a) => a.id)
      );
      const next = new Set<number>();
      prev.forEach((id) => {
        if (stillRelevantIds.has(id)) next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [announcements]);

  if (deadlineToasts.length === 0) {
    return null;
  }

  const dismissLocally = (id: number) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const goToTask = (announcementId: number, taskId: number) => {
    void markAsSeen(announcementId);
    navigate(`${ROUTES.TASKS}?taskId=${taskId}`);
  };

  return (
    <ToastContainer>
      {deadlineToasts.map((announcement) => (
        <Toast
          key={announcement.id}
          variant="warning"
          title={announcement.title}
          description={announcement.content}
          meta={`${announcement.disciplineName} · ${announcement.teacherName}`}
          action={{
            label: 'К заданию',
            onClick: () => goToTask(announcement.id, announcement.targetId),
          }}
          onClose={() => dismissLocally(announcement.id)}
        />
      ))}
    </ToastContainer>
  );
};
