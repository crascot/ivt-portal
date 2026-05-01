import { useEffect, useMemo, useState } from 'react';

import { useAnnouncements } from '@context/AnnouncementContext';
import { AnnouncementType } from '@entities/announcementRequest';

import { Toast } from './Toast';
import { ToastContainer } from './ToastContainer';

export const LessonStartingToasts = () => {
  const { announcements, markAsSeen } = useAnnouncements();
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  const lessonToasts = useMemo(
    () =>
      announcements.filter(
        (announcement) =>
          announcement.type === AnnouncementType.LessonStartingSoon &&
          !!announcement.meetingUrl &&
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

  if (lessonToasts.length === 0) {
    return null;
  }

  const dismissLocally = (id: number) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const openMeeting = (announcementId: number, meetingUrl: string) => {
    void markAsSeen(announcementId);
    window.open(meetingUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <ToastContainer>
      {lessonToasts.map((announcement) => (
        <Toast
          key={announcement.id}
          variant="info"
          title={announcement.title}
          description={announcement.content}
          meta={`${announcement.disciplineName} · ${announcement.teacherName}`}
          action={{
            label: 'Перейти к занятию',
            onClick: () =>
              openMeeting(announcement.id, announcement.meetingUrl ?? ''),
          }}
          onClose={() => dismissLocally(announcement.id)}
        />
      ))}
    </ToastContainer>
  );
};
