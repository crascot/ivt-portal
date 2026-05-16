import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';
import { FiRefreshCw, FiSearch, FiTrash2, FiUserCheck } from 'react-icons/fi';

import { adminGroupApi } from '@api/admin/adminGroupApi';
import { adminUserApi } from '@api/admin/adminUserApi';
import {
  Group,
  ManagedUser,
  ManagedUserFilters,
  UpdateManagedUserDto,
  UserStatus,
} from '@entities/adminRequest';
import { RoleEnum } from '@entities/role-enum';

type EditState = {
  groupId: string;
  groupLeader: boolean;
  teacherPosition: string;
};

const roleLabels: Record<RoleEnum, string> = {
  [RoleEnum.ADMIN]: 'Администратор',
  [RoleEnum.TEACHER]: 'Преподаватель',
  [RoleEnum.STUDENT]: 'Студент',
  [RoleEnum.GROUP_LEADER]: 'Староста',
};

const statusLabels: Record<UserStatus, string> = {
  PENDING: 'Ожидает подтверждения',
  APPROVED: 'Подтвержден',
  REJECTED: 'Отклонен',
  DELETED: 'Удален',
};

const statusVariants: Record<UserStatus, string> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'secondary',
  DELETED: 'dark',
};

const getEditableState = (user: ManagedUser): EditState => ({
  groupId: user.groupId ? String(user.groupId) : '',
  groupLeader: user.groupLeader,
  teacherPosition: user.teacherPosition ?? '',
});

const isStudentUser = (user: ManagedUser) =>
  user.roles.includes(RoleEnum.STUDENT) ||
  user.roles.includes(RoleEnum.GROUP_LEADER);

const isTeacherUser = (user: ManagedUser) =>
  user.roles.includes(RoleEnum.TEACHER);

export const AdminUsers = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [filters, setFilters] = useState<ManagedUserFilters>({
    search: '',
    role: '',
    status: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.name.localeCompare(b.name, 'ru-RU')),
    [groups]
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminUserApi.getAll(filters);
      setUsers(data);
    } catch {
      setError('Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadGroups = useCallback(async () => {
    try {
      const data = await adminGroupApi.getAll();
      setGroups(data);
    } catch {
      setGroups([]);
    }
  }, []);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const startEdit = (user: ManagedUser) => {
    setEditingId(user.id);
    setEditState(getEditableState(user));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditState(null);
  };

  const updateUserInList = (updatedUser: ManagedUser) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    );
  };

  const saveUser = async (user: ManagedUser) => {
    if (!editState) return;

    const dto: UpdateManagedUserDto = {};

    if (isStudentUser(user)) {
      if (!editState.groupId) {
        setError('Для студента нужно выбрать группу');
        return;
      }
      dto.groupId = Number(editState.groupId);
      dto.groupLeader = editState.groupLeader;
    }

    if (isTeacherUser(user)) {
      dto.teacherPosition = editState.teacherPosition.trim() || null;
    }

    setSaving(true);
    setError(null);
    try {
      const updatedUser = await adminUserApi.update(user.id, dto);
      updateUserInList(updatedUser);
      cancelEdit();
    } catch {
      setError('Не удалось сохранить изменения пользователя');
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (user: ManagedUser) => {
    const confirmed = window.confirm(
      `Удалить пользователя "${user.fullName}"?\n\nАккаунт будет отключен, учебная история останется в системе.`
    );

    if (!confirmed) return;

    setSaving(true);
    setError(null);
    try {
      await adminUserApi.remove(user.id);
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      if (editingId === user.id) {
        cancelEdit();
      }
    } catch {
      setError('Не удалось удалить пользователя');
    } finally {
      setSaving(false);
    }
  };

  const renderRole = (user: ManagedUser) => {
    if (user.groupLeader) {
      return roleLabels[RoleEnum.GROUP_LEADER];
    }

    return user.primaryRole ? roleLabels[user.primaryRole] : 'Без роли';
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h1 className="mb-1">Управление пользователями</h1>
        <p className="text-muted mb-0">
          Просмотр пользователей, смена группы студента, назначение старосты и
          редактирование должности преподавателя.
        </p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col lg={5}>
              <Form.Group controlId="admin-users-search">
                <Form.Label>Поиск</Form.Label>
                <div className="position-relative">
                  <FiSearch
                    size={18}
                    className="position-absolute top-50 translate-middle-y ms-3 text-muted"
                  />
                  <Form.Control
                    value={filters.search ?? ''}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        search: event.target.value,
                      }))
                    }
                    className="ps-5"
                    placeholder="ФИО, email, группа или должность"
                  />
                </div>
              </Form.Group>
            </Col>

            <Col md={4} lg={3}>
              <Form.Group controlId="admin-users-role">
                <Form.Label>Роль</Form.Label>
                <Form.Select
                  value={filters.role ?? ''}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      role: event.target.value as RoleEnum | '',
                    }))
                  }
                >
                  <option value="">Все роли</option>
                  {Object.values(RoleEnum).map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={4} lg={3}>
              <Form.Group controlId="admin-users-status">
                <Form.Label>Подтверждение</Form.Label>
                <Form.Select
                  value={filters.status ?? ''}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: event.target.value as UserStatus | '',
                    }))
                  }
                >
                  <option value="">Все статусы</option>
                  <option value="APPROVED">Подтвержденные</option>
                  <option value="PENDING">Ожидают подтверждения</option>
                  <option value="REJECTED">Отклоненные</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={4} lg={1}>
              <Button
                type="button"
                variant="outline-primary"
                className="w-100"
                onClick={() => void loadUsers()}
                disabled={loading}
                title="Обновить"
              >
                <FiRefreshCw size={18} />
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Card.Title className="mb-0">Пользователи</Card.Title>
            <Badge bg="primary" pill>
              {users.length}
            </Badge>
          </div>

          {loading ? (
            <div className="d-flex align-items-center gap-2">
              <Spinner animation="border" size="sm" />
              <span>Загрузка пользователей...</span>
            </div>
          ) : users.length === 0 ? (
            <Alert variant="light" className="mb-0">
              Пользователи не найдены
            </Alert>
          ) : (
            <Table responsive bordered hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ minWidth: '240px' }}>Пользователь</th>
                  <th style={{ minWidth: '150px' }}>Роль</th>
                  <th style={{ minWidth: '170px' }}>Статус</th>
                  <th style={{ minWidth: '220px' }}>Группа</th>
                  <th style={{ minWidth: '220px' }}>Преподаватель</th>
                  <th style={{ width: '260px' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isEditing = editingId === user.id && editState;
                  const canEditProfile =
                    isStudentUser(user) || isTeacherUser(user);

                  return (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.fullName}</strong>
                        <div className="text-muted small">{user.email}</div>
                      </td>
                      <td>{renderRole(user)}</td>
                      <td>
                        <Badge bg={statusVariants[user.status]}>
                          {statusLabels[user.status]}
                        </Badge>
                        <div className="text-muted small mt-1">
                          {user.confirmed ? 'Аккаунт активен' : 'Нет доступа'}
                        </div>
                      </td>
                      <td>
                        {isStudentUser(user) ? (
                          isEditing ? (
                            <div className="d-flex flex-column gap-2">
                              <Form.Select
                                size="sm"
                                value={editState.groupId}
                                onChange={(event) =>
                                  setEditState((prev) =>
                                    prev
                                      ? { ...prev, groupId: event.target.value }
                                      : prev
                                  )
                                }
                              >
                                <option value="">Выберите группу</option>
                                {sortedGroups.map((group) => (
                                  <option key={group.id} value={group.id}>
                                    {group.name}
                                  </option>
                                ))}
                              </Form.Select>
                              <Form.Check
                                type="checkbox"
                                label="Староста"
                                checked={editState.groupLeader}
                                onChange={(event) =>
                                  setEditState((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          groupLeader: event.target.checked,
                                        }
                                      : prev
                                  )
                                }
                              />
                            </div>
                          ) : (
                            <>
                              <span>{user.groupName ?? 'Без группы'}</span>
                              {user.groupLeader && (
                                <Badge
                                  bg="warning"
                                  text="dark"
                                  className="ms-2"
                                >
                                  Староста
                                </Badge>
                              )}
                            </>
                          )
                        ) : (
                          <span className="text-muted">Не студент</span>
                        )}
                      </td>
                      <td>
                        {isTeacherUser(user) ? (
                          isEditing ? (
                            <Form.Control
                              size="sm"
                              value={editState.teacherPosition}
                              onChange={(event) =>
                                setEditState((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        teacherPosition: event.target.value,
                                      }
                                    : prev
                                )
                              }
                              placeholder="Например: доцент"
                            />
                          ) : (
                            <>
                              <span>
                                {user.teacherPosition ?? 'Не указано'}
                              </span>
                              {(user.teacherPhoneNumber ||
                                user.teacherWhatsApp) && (
                                <div className="text-muted small mt-1">
                                  {user.teacherPhoneNumber ??
                                    user.teacherWhatsApp}
                                </div>
                              )}
                            </>
                          )
                        ) : (
                          <span className="text-muted">Не преподаватель</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-2">
                          {isEditing ? (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => void saveUser(user)}
                                disabled={saving}
                              >
                                {saving ? 'Сохранение...' : 'Сохранить'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={cancelEdit}
                                disabled={saving}
                              >
                                Отмена
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => startEdit(user)}
                              disabled={!canEditProfile || saving}
                              title={
                                canEditProfile
                                  ? 'Редактировать пользователя'
                                  : 'Для этой роли нет профильных полей'
                              }
                            >
                              <FiUserCheck size={14} className="me-1" />
                              Изменить
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => void deleteUser(user)}
                            disabled={saving}
                          >
                            <FiTrash2 size={14} className="me-1" />
                            Удалить
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};
