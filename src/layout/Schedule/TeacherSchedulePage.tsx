import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import { FiChevronLeft } from 'react-icons/fi';
import { Link, Navigate, useParams } from 'react-router-dom';

import { scheduleApi } from '@api/scheduleApi';
import { teacherDirectoryApi } from '@api/teacherDirectoryApi';
import { TeacherScheduleDto } from '@entities/scheduleRequest';
import { TeacherDetailDto } from '@entities/teacherRequest';
import { ROUTES } from '@utils/routes';

import { TeacherSchedule } from './components/TeacherSchedule';

import s from './Schedule.module.css';

const teacherDetailPath = (teacherId: number) =>
  ROUTES.TEACHER_DETAIL.replace(':teacherId', String(teacherId));

export const TeacherSchedulePage = () => {
  const { teacherId: rawTeacherId } = useParams<{ teacherId: string }>();
  const teacherId = rawTeacherId ? Number(rawTeacherId) : null;
  const [teacher, setTeacher] = useState<TeacherDetailDto | null>(null);
  const [schedule, setSchedule] = useState<TeacherScheduleDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchedule = useCallback(async () => {
    if (teacherId == null || Number.isNaN(teacherId)) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [teacherData, scheduleData] = await Promise.all([
        teacherDirectoryApi.getTeacher(teacherId),
        scheduleApi.getTeacherSchedule(teacherId),
      ]);

      setTeacher(teacherData);
      setSchedule(scheduleData);
    } catch {
      setError('Не удалось загрузить расписание преподавателя');
    } finally {
      setIsLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  if (teacherId == null || Number.isNaN(teacherId)) {
    return <Navigate to={ROUTES.TEACHERS} replace />;
  }

  return (
    <div className={s.schedule}>
      <Link to={teacherDetailPath(teacherId)} className={s.backLink}>
        <FiChevronLeft size={18} aria-hidden="true" />К преподавателю
      </Link>

      <div className={s.header}>
        <div className="d-flex justify-content-between align-items-center gap-3">
          <div>
            <h1>Расписание преподавателя</h1>
            <p>
              {teacher
                ? `${teacher.fullName} · ${teacher.position || 'Преподаватель'}`
                : 'Загрузка данных преподавателя'}
            </p>
          </div>
          <Button
            variant="outline-primary"
            onClick={loadSchedule}
            disabled={isLoading}
          >
            Обновить
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {isLoading ? (
        <div className="d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" />
          <span>Загрузка расписания...</span>
        </div>
      ) : (
        <TeacherSchedule schedule={schedule} />
      )}
    </div>
  );
};
