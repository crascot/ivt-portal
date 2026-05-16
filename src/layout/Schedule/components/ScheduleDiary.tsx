import { Button } from 'react-bootstrap';
import {
  FiBookOpen,
  FiCalendar,
  FiEdit2,
  FiLink,
  FiMapPin,
  FiTrash2,
  FiUser,
  FiUsers,
} from 'react-icons/fi';

import {
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_ORDER,
  DayOfWeek,
} from '@entities/scheduleRequest';

import s from '../Schedule.module.css';

export type ScheduleDiaryItem = {
  id: number | string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  title: string;
  teacherName?: string | null;
  groupName?: string | null;
  position?: string | null;
  room?: string | null;
  url?: string | null;
  dateLabel?: string | null;
};

type Props = {
  items: ScheduleDiaryItem[];
  emptyText?: string;
  canEdit?: boolean;
  isDeleting?: boolean;
  onEdit?: (id: ScheduleDiaryItem['id']) => void;
  onDelete?: (id: ScheduleDiaryItem['id']) => void;
};

const WEEK_DAYS = [...DAY_OF_WEEK_ORDER, DayOfWeek.Sunday];

const TODAY_INDEX = new Date().getDay();

const CURRENT_DAY =
  TODAY_INDEX === 0 ? DayOfWeek.Sunday : WEEK_DAYS[TODAY_INDEX - 1];

const sortByTime = (a: ScheduleDiaryItem, b: ScheduleDiaryItem) =>
  a.startTime.localeCompare(b.startTime);

const getDayItems = (items: ScheduleDiaryItem[], day: DayOfWeek) =>
  items.filter((item) => item.dayOfWeek === day).sort(sortByTime);

export const ScheduleDiary = ({
  items,
  emptyText = 'Расписание пока пусто',
  canEdit = false,
  isDeleting = false,
  onEdit,
  onDelete,
}: Props) => {
  if (items.length === 0) {
    return <div className={s.emptyDiary}>{emptyText}</div>;
  }

  const daysToRender = WEEK_DAYS.filter(
    (day) => day !== DayOfWeek.Sunday || getDayItems(items, day).length > 0
  );

  return (
    <section className={s.diaryGrid}>
      {daysToRender.map((day) => {
        const dayItems = getDayItems(items, day);
        const isToday = day === CURRENT_DAY;

        return (
          <article
            key={day}
            className={`${s.dayCard} ${isToday ? s.dayCardToday : ''}`}
          >
            <header className={s.dayHeader}>
              <div>
                <span className={s.dayEyebrow}>День недели</span>
                <h2>{DAY_OF_WEEK_LABELS[day]}</h2>
              </div>
              <span className={s.lessonCounter}>
                {dayItems.length}{' '}
                {dayItems.length === 1 ? 'занятие' : 'занятий'}
              </span>
            </header>

            {dayItems.length === 0 ? (
              <div className={s.dayEmpty}>
                <FiCalendar />
                <span>Занятий нет</span>
              </div>
            ) : (
              <div className={s.lessonList}>
                {dayItems.map((item, index) => (
                  <div key={item.id} className={s.lessonItem}>
                    <div className={s.timeRail}>
                      <span className={s.timeDot}>{index + 1}</span>
                      <span className={s.timeLine} />
                    </div>

                    <div className={s.lessonCard}>
                      <div className={s.lessonTime}>
                        {item.startTime} - {item.endTime}
                      </div>

                      <div className={s.lessonBody}>
                        <div className={s.lessonTitleRow}>
                          <span className={s.lessonIcon}>
                            <FiBookOpen />
                          </span>
                          <div>
                            <h3>{item.title}</h3>
                            {item.dateLabel && (
                              <span className={s.lessonSubtle}>
                                {item.dateLabel}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className={s.lessonMeta}>
                          {item.teacherName && (
                            <span>
                              <FiUser />
                              {item.teacherName}
                              {item.position ? `, ${item.position}` : ''}
                            </span>
                          )}
                          {item.groupName && (
                            <span>
                              <FiUsers />
                              {item.groupName}
                            </span>
                          )}
                          <span>
                            <FiMapPin />
                            {item.room || 'Аудитория не указана'}
                          </span>
                          {item.url && (
                            <a
                              className={s.lessonLinkButton}
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FiLink />
                              Перейти к занятию
                            </a>
                          )}
                        </div>
                      </div>

                      {canEdit && (
                        <div className={s.lessonActions}>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline-secondary"
                            aria-label="Редактировать занятие"
                            title="Редактировать"
                            onClick={() => onEdit?.(item.id)}
                          >
                            <FiEdit2 />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline-danger"
                            disabled={isDeleting}
                            aria-label="Удалить занятие"
                            title="Удалить"
                            onClick={() => onDelete?.(item.id)}
                          >
                            <FiTrash2 />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
};
