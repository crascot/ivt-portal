import { Alert, Button, Spinner } from 'react-bootstrap';
import { FiRefreshCw } from 'react-icons/fi';

import { RoleEnum } from '@entities/role-enum';
import { useSchedule } from '@hooks/schedule/useSchedule';

import { AdminSchedule } from './components/AdminSchedule';
import { LeaderSchedule } from './components/LeaderSchedule';
import { StudentSchedule } from './components/StudentSchedule';
import { TeacherSchedule } from './components/TeacherSchedule';

import s from './Schedule.module.css';

const ROLE_TITLES: Record<RoleEnum, string> = {
  [RoleEnum.STUDENT]: 'Моё расписание',
  [RoleEnum.TEACHER]: 'Моё расписание',
  [RoleEnum.GROUP_LEADER]: 'Расписание группы',
  [RoleEnum.ADMIN]: 'Мониторинг расписания',
};

const ROLE_SUBTITLES: Record<RoleEnum, string> = {
  [RoleEnum.STUDENT]: 'Ближайшие занятия вашей группы',
  [RoleEnum.TEACHER]: 'Ваши занятия по дням недели',
  [RoleEnum.GROUP_LEADER]: 'Просмотр и редактирование расписания',
  [RoleEnum.ADMIN]: 'Просмотр расписания по группам',
};

export const Schedule = () => {
  const {
    role,
    studentSchedule,
    teacherSchedule,
    groupSchedule,
    groups,
    disciplines,
    teachers,
    groupId,
    groupName,
    selectedGroupId,
    isLoading,
    error,
    actionError,
    selectGroup,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    reload,
  } = useSchedule();

  const title = ROLE_TITLES[role!] ?? 'Расписание';
  const subtitle = ROLE_SUBTITLES[role!] ?? '';

  return (
    <div className={s.schedule}>
      <div className={s.header}>
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <Button
          variant="outline-primary"
          onClick={reload}
          disabled={isLoading}
          className={s.refreshButton}
        >
          <FiRefreshCw />
          Обновить
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {isLoading ? (
        <div className={s.loadingState}>
          <Spinner animation="border" size="sm" />
          <span>Загрузка расписания...</span>
        </div>
      ) : (
        <>
          {role === RoleEnum.STUDENT && (
            <StudentSchedule schedule={studentSchedule} groupName={groupName} />
          )}

          {role === RoleEnum.TEACHER && (
            <TeacherSchedule schedule={teacherSchedule} />
          )}

          {role === RoleEnum.GROUP_LEADER && groupId && (
            <LeaderSchedule
              groupId={groupId}
              groupName={groupName}
              schedule={groupSchedule}
              disciplines={disciplines}
              teachers={teachers}
              actionError={actionError}
              onAdd={addSchedule}
              onUpdate={updateSchedule}
              onDelete={deleteSchedule}
            />
          )}

          {role === RoleEnum.ADMIN && (
            <AdminSchedule
              groups={groups}
              selectedGroupId={selectedGroupId}
              schedule={groupSchedule}
              onSelectGroup={selectGroup}
            />
          )}
        </>
      )}
    </div>
  );
};
