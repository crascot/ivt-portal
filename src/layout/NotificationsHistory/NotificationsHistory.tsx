import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Spinner } from 'react-bootstrap';

import { useAnnouncements } from '@context/AnnouncementContext';
import { AnnouncementDto } from '@entities/announcementRequest';

import s from './NotificationsHistory.module.css';

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const NotificationsHistory = () => {
  const { getHistory, markAsSeen, markAllAsSeen, refresh } = useAnnouncements();

  const [history, setHistory] = useState<AnnouncementDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getHistory();
      setHistory(data);
    } catch {
      setError('Не удалось загрузить историю уведомлений');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unseenCount = useMemo(
    () => history.filter((announcement) => !announcement.seen).length,
    [history]
  );

  const handleMarkAsSeen = async (announcementId: number) => {
    await markAsSeen(announcementId);
    setHistory((prev) =>
      prev.map((announcement) =>
        announcement.id === announcementId
          ? { ...announcement, seen: true }
          : announcement
      )
    );
  };

  const handleMarkAllAsSeen = async () => {
    if (unseenCount === 0) return;

    setIsMarkingAll(true);
    try {
      await markAllAsSeen();
      await refresh();
      await loadHistory();
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1>История уведомлений</h1>
          <p>Здесь отображаются новые и просмотренные уведомления.</p>
        </div>
        <Button
          variant="outline-primary"
          onClick={handleMarkAllAsSeen}
          disabled={isMarkingAll || unseenCount === 0}
        >
          Отметить все как просмотренные
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {isLoading ? (
        <div className="d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" />
          <span>Загрузка уведомлений...</span>
        </div>
      ) : history.length === 0 ? (
        <Alert variant="light">Уведомлений пока нет.</Alert>
      ) : (
        <div className={s.list}>
          {history.map((announcement) => (
            <Card key={announcement.id} className={s.card}>
              <Card.Body>
                <div className={s.titleRow}>
                  <h5 className={s.title}>{announcement.title}</h5>
                  <Badge bg={announcement.seen ? 'secondary' : 'primary'}>
                    {announcement.seen ? 'Просмотрено' : 'Новое'}
                  </Badge>
                </div>
                <Card.Text className={s.content}>{announcement.content}</Card.Text>
                <div className={s.meta}>
                  <span>{announcement.disciplineName}</span>
                  <span>{announcement.teacherName}</span>
                  <span>{formatDateTime(announcement.createdAt)}</span>
                </div>
                {!announcement.seen && (
                  <div className={s.actions}>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => void handleMarkAsSeen(announcement.id)}
                    >
                      Отметить как просмотренное
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
