import { useMemo } from 'react';
import { Alert, Button, Card, Spinner, Table } from 'react-bootstrap';

import { Group } from '@entities/adminRequest';
import { useGroupForm } from '@hooks/groups/useGroupForm';
import { GroupForm } from './GroupForm/GroupForm';

export const Groups = () => {
  const {
    items: groups,
    formValues,
    isEditMode,
    isLoading,
    isSubmitting,
    isDeleting,
    loadError,
    actionError,
    setFieldValue,
    loadItems,
    startCreate,
    startEdit,
    submit,
    removeItem,
  } = useGroupForm();

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => a.name.localeCompare(b.name));
  }, [groups]);

  const handleDelete = async (group: Group) => {
    const confirmed = window.confirm(`Удалить группу "${group.name}"?`);

    if (!confirmed) {
      return;
    }

    await removeItem(group.id);
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h1 className="mb-1">Группы</h1>
        <p className="text-muted mb-0">
          Создание, просмотр и редактирование групп
        </p>
      </div>

      {loadError && <Alert variant="danger">{loadError}</Alert>}
      {actionError && <Alert variant="danger">{actionError}</Alert>}

      <Card>
        <Card.Body>
          <Card.Title className="mb-3">
            {isEditMode ? 'Редактирование группы' : 'Создание группы'}
          </Card.Title>

          <GroupForm
            values={formValues}
            submitText={isEditMode ? 'Сохранить изменения' : 'Создать группу'}
            isSubmitting={isSubmitting}
            onSubmit={submit}
            onFieldChange={setFieldValue}
            onCancel={isEditMode ? startCreate : undefined}
          />
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Card.Title className="mb-0">Список групп</Card.Title>

            <Button
              variant="outline-primary"
              onClick={loadItems}
              disabled={isLoading}
            >
              Обновить
            </Button>
          </div>

          {isLoading ? (
            <div className="d-flex align-items-center gap-2">
              <Spinner animation="border" size="sm" />
              <span>Загрузка групп...</span>
            </div>
          ) : sortedGroups.length === 0 ? (
            <Alert variant="light" className="mb-0">
              Список групп пуст
            </Alert>
          ) : (
            <Table responsive bordered hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th>Название</th>
                  <th style={{ width: '120px' }}>Курс</th>
                  <th>Специальность</th>
                  <th style={{ width: '220px' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {sortedGroups.map((group, index) => (
                  <tr key={group.id}>
                    <td>{index + 1}</td>
                    <td>{group.name}</td>
                    <td>{group.courseNumber}</td>
                    <td>{group.specialty}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => startEdit(group)}
                        >
                          Редактировать
                        </Button>

                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(group)}
                          disabled={isDeleting}
                        >
                          Удалить
                        </Button>
                      </div>
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
