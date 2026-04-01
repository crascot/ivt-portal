import { Alert, Badge, Button, Card, Spinner } from 'react-bootstrap';

import { usePendingUsers } from '@hooks/admin/usePendingUsers';
import { useAuth } from '@context/AuthContext';

import s from './PendingUsers.module.css';

export const PendingUsers = () => {
  const { logout } = useAuth();
  const { users, loading, error, approveUser, rejectUser } = usePendingUsers();

  if (loading) {
    return (
      <div className={s.stateBox}>
        <Spinner animation="border" />
        <p>Загрузка заявок...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className={s.alert}>
        {error}
      </Alert>
    );
  }

  return (
    <div className={s.pendingUsers}>
      <div className={s.pageHeader}>
        <div>
          <span className={s.eyebrow}>Администрирование</span>
          <h1>Заявки на подтверждение</h1>
          <p className={s.pageDescription}>
            Здесь отображаются пользователи, ожидающие подтверждения аккаунта
            администратором.
          </p>
        </div>

        <div className={s.headerActions}>
          <Badge bg="primary" pill className={s.counter}>
            {users.length} pending
          </Badge>

          <Button variant="outline-danger" onClick={logout}>
            Выйти
          </Button>
        </div>
      </div>

      {users.length === 0 ? (
        <Card className={s.emptyCard}>
          <Card.Body>
            <h2>Новых заявок нет</h2>
            <p>Сейчас нет пользователей, ожидающих подтверждения.</p>
          </Card.Body>
        </Card>
      ) : (
        <div className={s.cards}>
          {users.map((user) => (
            <Card key={user.id} className={s.userCard}>
              <Card.Body>
                <div className={s.cardTop}>
                  <div>
                    <h2 className={s.userName}>{user.fullName}</h2>
                    <p className={s.userEmail}>{user.email}</p>
                  </div>

                  <Badge bg="secondary" className={s.statusBadge}>
                    Pending
                  </Badge>
                </div>

                <div className={s.metaGrid}>
                  <div className={s.metaItem}>
                    <span className={s.metaLabel}>Группа</span>
                    <span className={s.metaValue}>
                      {user.groupName || 'Не указана'}
                    </span>
                  </div>

                  {'role' in user && user.role && (
                    <div className={s.metaItem}>
                      <span className={s.metaLabel}>Роль</span>
                      <span className={s.metaValue}>{user.role}</span>
                    </div>
                  )}
                </div>

                <div className={s.actions}>
                  <Button
                    variant="success"
                    onClick={() => approveUser(user.id)}
                  >
                    Подтвердить
                  </Button>

                  <Button
                    variant="outline-danger"
                    onClick={() => rejectUser(user.id)}
                  >
                    Отклонить
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
