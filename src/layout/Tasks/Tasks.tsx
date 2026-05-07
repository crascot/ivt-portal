import { Alert, Button, Form, Spinner } from 'react-bootstrap';

import { RoleEnum } from '@entities/role-enum';
import { useTasks } from '@hooks/tasks/useTasks';

import { StudentTasks } from './components/StudentTasks';
import { TeacherTasks } from './components/TeacherTasks';
import { AdminTasks } from './components/AdminTasks';

import s from './Tasks.module.css';

const ROLE_TITLES: Record<RoleEnum, string> = {
  [RoleEnum.STUDENT]: 'Мои задания',
  [RoleEnum.TEACHER]: 'Управление заданиями',
  [RoleEnum.GROUP_LEADER]: 'Мои задания',
  [RoleEnum.ADMIN]: 'Мониторинг заданий',
};

const ROLE_SUBTITLES: Record<RoleEnum, string> = {
  [RoleEnum.STUDENT]: 'Просмотр заданий по вашим дисциплинам',
  [RoleEnum.TEACHER]: 'Создание и редактирование заданий для студентов',
  [RoleEnum.GROUP_LEADER]: 'Просмотр и выполнение заданий по вашим дисциплинам',
  [RoleEnum.ADMIN]: 'Просмотр и управление всеми заданиями',
};

export const Tasks = () => {
  const {
    role,
    tasks,
    disciplines,
    teachers,
    teacherId,
    studentId,
    reportsByTaskId,
    selectedDisciplineId,
    isLoading,
    isTasksLoading,
    isSubmitting,
    error,
    actionError,
    isStudentView,
    selectDiscipline,
    reloadTasks,
    reloadStudentTasks,
    addTask,
    updateTask,
    deleteTask,
    deleteAttachment,
    downloadAttachment,
  } = useTasks();

  const title = ROLE_TITLES[role!] ?? 'Задания';
  const subtitle = ROLE_SUBTITLES[role!] ?? '';

  const showRefreshButton = isStudentView || selectedDisciplineId !== null;

  return (
    <div className={s.tasks}>
      <div className={s.header}>
        <div className="d-flex justify-content-between align-items-center">
          <h1>{title}</h1>
          {showRefreshButton && (
            <Button
              variant="outline-primary"
              onClick={reloadTasks}
              disabled={isTasksLoading}
            >
              Обновить
            </Button>
          )}
        </div>
        <p>{subtitle}</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {actionError && <Alert variant="danger">{actionError}</Alert>}
      {isLoading ? (
        <div className="d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" />
          <span>Загрузка...</span>
        </div>
      ) : isStudentView ? (
        isTasksLoading ? (
          <div className="d-flex align-items-center gap-2">
            <Spinner animation="border" size="sm" />
            <span>Загрузка заданий...</span>
          </div>
        ) : (
          <StudentTasks
            tasks={tasks}
            reportsByTaskId={reportsByTaskId}
            disciplines={disciplines}
            studentId={studentId}
            onDownloadAttachment={downloadAttachment}
            onReportsMutated={reloadStudentTasks}
          />
        )
      ) : (
        <>
          <Form.Group controlId="discipline-select" style={{ maxWidth: 400 }}>
            <Form.Label>Выберите дисциплину</Form.Label>
            <Form.Select
              value={selectedDisciplineId ?? ''}
              onChange={(e) =>
                selectDiscipline(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">— Дисциплина —</option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {selectedDisciplineId !== null && (
            <>
              {isTasksLoading ? (
                <div className="d-flex align-items-center gap-2">
                  <Spinner animation="border" size="sm" />
                  <span>Загрузка заданий...</span>
                </div>
              ) : (
                <>
                  {role === RoleEnum.TEACHER && (
                    <TeacherTasks
                      tasks={tasks}
                      disciplines={disciplines}
                      teachers={teachers}
                      teacherId={teacherId}
                      isSubmitting={isSubmitting}
                      showTeacherSelect={false}
                      onAdd={addTask}
                      onUpdate={updateTask}
                      onDelete={deleteTask}
                      onDownloadAttachment={downloadAttachment}
                      onDeleteAttachment={deleteAttachment}
                    />
                  )}

                  {role === RoleEnum.ADMIN && (
                    <AdminTasks
                      tasks={tasks}
                      disciplines={disciplines}
                      teachers={teachers}
                      isSubmitting={isSubmitting}
                      onAdd={addTask}
                      onUpdate={updateTask}
                      onDelete={deleteTask}
                      onDownloadAttachment={downloadAttachment}
                      onDeleteAttachment={deleteAttachment}
                    />
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
