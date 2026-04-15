import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Form, Spinner, Table } from 'react-bootstrap';

import { taskApi } from '@api/taskApi';
import { useAuth } from '@context/AuthContext';
import { RoleEnum } from '@entities/role-enum';
import { DisciplineShort } from '@entities/scheduleRequest';
import { TaskDiscipline, TaskDto } from '@entities/taskRequest';
import { scheduleApi } from '@api/scheduleApi';

import s from './Tasks.module.css';

const ROLE_TITLES: Record<RoleEnum, string> = {
  [RoleEnum.STUDENT]: 'Мои задания',
  [RoleEnum.GROUP_LEADER]: 'Задания группы',
  [RoleEnum.TEACHER]: 'Задания по дисциплинам',
  [RoleEnum.ADMIN]: 'Поиск заданий',
};

const ROLE_SUBTITLES: Record<RoleEnum, string> = {
  [RoleEnum.STUDENT]: 'Текущие задания, назначенные преподавателями',
  [RoleEnum.GROUP_LEADER]: 'Просмотр заданий, выданных вашей группе',
  [RoleEnum.TEACHER]:
    'Создавайте задания и отслеживайте уже опубликованные материалы',
  [RoleEnum.ADMIN]: 'Поиск заданий по дисциплинам и ключевым словам',
};

const normalizeDisciplines = (
  disciplines: DisciplineShort[]
): TaskDiscipline[] => {
  return disciplines.map(({ id, name, description }) => ({
    id,
    name,
    description,
  }));
};

const sortTasks = (tasks: TaskDto[]): TaskDto[] => {
  return [...tasks].sort((a, b) => a.title.localeCompare(b.title));
};

export const Tasks = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [disciplines, setDisciplines] = useState<TaskDiscipline[]>([]);
  const [tasks, setTasks] = useState<TaskDto[]>([]);

  const [selectedDisciplineId, setSelectedDisciplineId] = useState<
    number | null
  >(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createDisciplineId, setCreateDisciplineId] = useState<number | null>(
    null
  );
  const [createFile, setCreateFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadTasksForDisciplines = useCallback(
    async (sourceDisciplines: TaskDiscipline[]) => {
      if (!sourceDisciplines.length) {
        return [];
      }

      const taskChunks = await Promise.all(
        sourceDisciplines.map((discipline) =>
          taskApi.getTasksByDiscipline(discipline.id)
        )
      );

      const uniqueTasks = new Map<number, TaskDto>();
      taskChunks.flat().forEach((task) => uniqueTasks.set(task.id, task));

      return sortTasks(Array.from(uniqueTasks.values()));
    },
    []
  );

  const loadStudentOrLeaderTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setActionError(null);

    try {
      const profile = await scheduleApi.getStudentProfile();
      const [groupSchedule, allDisciplines] = await Promise.all([
        scheduleApi.getGroupSchedule(profile.groupId),
        taskApi.getAllDisciplines(),
      ]);

      const disciplineByName = new Map(
        allDisciplines.map((discipline) => [discipline.name, discipline])
      );
      const usedDisciplineIds = new Set<number>();

      groupSchedule.forEach((lesson) => {
        const matchedDiscipline = disciplineByName.get(lesson.disciplineName);
        if (matchedDiscipline) {
          usedDisciplineIds.add(matchedDiscipline.id);
        }
      });

      const ownDisciplines = normalizeDisciplines(
        allDisciplines.filter((discipline) =>
          usedDisciplineIds.has(discipline.id)
        )
      );
      const ownTasks = await loadTasksForDisciplines(ownDisciplines);

      setDisciplines(ownDisciplines);
      setTasks(ownTasks);
      setSelectedDisciplineId((prev) => {
        if (!ownDisciplines.length) return null;
        if (
          prev &&
          ownDisciplines.some((discipline) => discipline.id === prev)
        ) {
          return prev;
        }
        return ownDisciplines[0].id;
      });
    } catch {
      setError('Не удалось загрузить задания');
    } finally {
      setIsLoading(false);
    }
  }, [loadTasksForDisciplines]);

  const loadTeacherTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setActionError(null);

    try {
      const profile = await scheduleApi.getTeacherProfile();
      const teacherDisciplines = await taskApi.getTeacherDisciplines(
        profile.teacherId
      );
      const loadedTasks = await loadTasksForDisciplines(teacherDisciplines);

      setTeacherId(profile.teacherId);
      setDisciplines(teacherDisciplines);
      setTasks(loadedTasks);

      setSelectedDisciplineId((prev) => {
        if (!teacherDisciplines.length) return null;
        if (
          prev &&
          teacherDisciplines.some((discipline) => discipline.id === prev)
        ) {
          return prev;
        }
        return teacherDisciplines[0].id;
      });

      setCreateDisciplineId((prev) => {
        if (!teacherDisciplines.length) return null;
        if (
          prev &&
          teacherDisciplines.some((discipline) => discipline.id === prev)
        ) {
          return prev;
        }
        return teacherDisciplines[0].id;
      });
    } catch {
      setError('Не удалось загрузить задания');
    } finally {
      setIsLoading(false);
    }
  }, [loadTasksForDisciplines]);

  const loadAdminPage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setActionError(null);

    try {
      const allDisciplines = await taskApi.getAllDisciplines();
      const normalized = normalizeDisciplines(allDisciplines);

      setDisciplines(normalized);
      setTasks([]);
      setSelectedDisciplineId((prev) => {
        if (!prev) return null;
        return normalized.some((discipline) => discipline.id === prev)
          ? prev
          : null;
      });
    } catch {
      setError('Не удалось загрузить список дисциплин');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reload = useCallback(async () => {
    if (!role) {
      return;
    }

    switch (role) {
      case RoleEnum.STUDENT:
      case RoleEnum.GROUP_LEADER:
        await loadStudentOrLeaderTasks();
        break;
      case RoleEnum.TEACHER:
        await loadTeacherTasks();
        break;
      case RoleEnum.ADMIN:
        await loadAdminPage();
        break;
      default:
        break;
    }
  }, [role, loadAdminPage, loadStudentOrLeaderTasks, loadTeacherTasks]);

  useEffect(() => {
    reload();
  }, [reload]);

  const disciplineNameById = useMemo(() => {
    return new Map(
      disciplines.map((discipline) => [discipline.id, discipline.name])
    );
  }, [disciplines]);

  const filteredTasks = useMemo(() => {
    let next = tasks;

    if (selectedDisciplineId) {
      const disciplineName = disciplineNameById.get(selectedDisciplineId);
      if (disciplineName) {
        next = next.filter((task) => task.disciplineName === disciplineName);
      }
    }

    const normalizedSearch = searchQuery.trim().toLowerCase();
    if (!normalizedSearch) {
      return next;
    }

    return next.filter((task) => {
      const haystack =
        `${task.title} ${task.description} ${task.teacherName} ${task.disciplineName}`
          .toLowerCase()
          .trim();
      return haystack.includes(normalizedSearch);
    });
  }, [tasks, selectedDisciplineId, disciplineNameById, searchQuery]);

  const handleAdminSearch = async () => {
    if (role !== RoleEnum.ADMIN) {
      return;
    }

    if (!selectedDisciplineId) {
      setActionError('Выберите дисциплину для поиска');
      return;
    }

    setIsSearching(true);
    setActionError(null);

    try {
      const result = await taskApi.getTasksByDiscipline(selectedDisciplineId);
      setTasks(sortTasks(result));
    } catch {
      setActionError('Не удалось выполнить поиск заданий');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateTask = async (event: FormEvent) => {
    event.preventDefault();
    setActionError(null);

    if (role !== RoleEnum.TEACHER || !teacherId) {
      setActionError('Не удалось определить профиль преподавателя');
      return;
    }

    if (!createDisciplineId) {
      setActionError('Выберите дисциплину');
      return;
    }

    const title = createTitle.trim();
    const description = createDescription.trim();

    if (!title || !description) {
      setActionError('Заполните название и описание задания');
      return;
    }

    setIsSubmitting(true);

    try {
      await taskApi.createTask({
        title,
        description,
        disciplineId: createDisciplineId,
        createdById: teacherId,
        file: createFile,
      });

      setCreateTitle('');
      setCreateDescription('');
      setCreateFile(null);

      await loadTeacherTasks();
    } catch {
      setActionError('Не удалось создать задание');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (attachmentId: number, fileName: string) => {
    setActionError(null);

    try {
      await taskApi.downloadAttachment(attachmentId, fileName);
    } catch {
      setActionError('Не удалось скачать вложение');
    }
  };

  const title = role ? ROLE_TITLES[role] : 'Задания';
  const subtitle = role ? ROLE_SUBTITLES[role] : '';

  return (
    <div className={s.tasks}>
      <div className={s.header}>
        <div className="d-flex justify-content-between align-items-center">
          <h1>{title}</h1>
          <Button
            variant="outline-primary"
            onClick={reload}
            disabled={isLoading || isSearching}
          >
            Обновить
          </Button>
        </div>
        <p>{subtitle}</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {actionError && <Alert variant="danger">{actionError}</Alert>}

      {role === RoleEnum.TEACHER && (
        <Card>
          <Card.Body>
            <Card.Title className="mb-3">Создать задание</Card.Title>
            <Form
              onSubmit={handleCreateTask}
              className="d-flex flex-column gap-3"
            >
              <Form.Group>
                <Form.Label>Дисциплина</Form.Label>
                <Form.Select
                  value={createDisciplineId ?? ''}
                  onChange={(event) =>
                    setCreateDisciplineId(
                      event.target.value ? Number(event.target.value) : null
                    )
                  }
                  required
                >
                  <option value="">— Выберите дисциплину —</option>
                  {disciplines.map((discipline) => (
                    <option key={discipline.id} value={discipline.id}>
                      {discipline.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label>Название задания</Form.Label>
                <Form.Control
                  value={createTitle}
                  onChange={(event) => setCreateTitle(event.target.value)}
                  placeholder="Например, Лабораторная работа №2"
                  required
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Описание</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={createDescription}
                  onChange={(event) => setCreateDescription(event.target.value)}
                  placeholder="Условия, дедлайн и формат сдачи"
                  required
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Вложение (необязательно)</Form.Label>
                <Form.Control
                  type="file"
                  onChange={(event) => {
                    const input = event.target as HTMLInputElement;
                    const selectedFile = input.files?.[0];
                    setCreateFile(selectedFile ?? null);
                  }}
                />
              </Form.Group>

              <div>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Сохранение...' : 'Создать задание'}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}

      <Card>
        <Card.Body className="d-flex flex-column gap-3">
          <div className="d-flex flex-column gap-2">
            <Form.Group>
              <Form.Label>
                {role === RoleEnum.ADMIN
                  ? 'Дисциплина для поиска'
                  : 'Фильтр по дисциплине'}
              </Form.Label>
              <Form.Select
                value={selectedDisciplineId ?? ''}
                onChange={(event) =>
                  setSelectedDisciplineId(
                    event.target.value ? Number(event.target.value) : null
                  )
                }
              >
                <option value="">— Все дисциплины —</option>
                {disciplines.map((discipline) => (
                  <option key={discipline.id} value={discipline.id}>
                    {discipline.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label>Поиск по названию и описанию</Form.Label>
              <Form.Control
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Введите ключевое слово"
              />
            </Form.Group>
          </div>

          {role === RoleEnum.ADMIN && (
            <div className="d-flex gap-2">
              <Button onClick={handleAdminSearch} disabled={isSearching}>
                {isSearching ? 'Поиск...' : 'Найти задания'}
              </Button>
              <span className="text-muted align-self-center">
                Для администратора задания загружаются по выбранной дисциплине
              </span>
            </div>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Card.Title className="mb-3">Список заданий</Card.Title>
          {isLoading || isSearching ? (
            <div className="d-flex align-items-center gap-2">
              <Spinner animation="border" size="sm" />
              <span>Загрузка заданий...</span>
            </div>
          ) : filteredTasks.length === 0 ? (
            <Alert variant="light" className="mb-0">
              {role === RoleEnum.ADMIN
                ? 'Задания не найдены. Выберите дисциплину и выполните поиск.'
                : 'По выбранным фильтрам заданий пока нет.'}
            </Alert>
          ) : (
            <Table responsive bordered hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: '280px' }}>Задание</th>
                  <th>Описание</th>
                  <th style={{ width: '220px' }}>Дисциплина</th>
                  <th style={{ width: '220px' }}>Преподаватель</th>
                  <th style={{ width: '260px' }}>Вложения</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td>{task.description}</td>
                    <td>{task.disciplineName}</td>
                    <td>{task.teacherName}</td>
                    <td>
                      {task.attachments.length === 0 ? (
                        <span className="text-muted">Нет вложений</span>
                      ) : (
                        <div className="d-flex flex-column gap-1">
                          {task.attachments.map((attachment) => (
                            <Button
                              key={attachment.id}
                              size="sm"
                              variant="outline-secondary"
                              className="text-start"
                              onClick={() =>
                                handleDownload(
                                  attachment.id,
                                  attachment.fileName
                                )
                              }
                            >
                              {attachment.fileName}
                            </Button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};
