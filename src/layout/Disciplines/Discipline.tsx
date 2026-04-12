import { useMemo } from 'react';
import { Alert, Button, Card, Spinner, Table } from 'react-bootstrap';

import { Discipline } from '@entities/adminRequest';
import { useDisciplineForm } from '@hooks/useDisciplineForm';
import { DisciplineForm } from './DisciplineForm/DisciplineForm';

export const Disciplines = () => {
  const {
    items: disciplines,
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
  } = useDisciplineForm();

  const sortedDisciplines = useMemo(() => {
    return [...disciplines].sort((a, b) => a.name.localeCompare(b.name));
  }, [disciplines]);

  const handleDelete = async (discipline: Discipline) => {
    const confirmed = window.confirm(
      `Удалить дисциплину "${discipline.name}"?`
    );

    if (!confirmed) {
      return;
    }

    await removeItem(discipline.id);
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h1 className="mb-1">Дисциплины</h1>
        <p className="text-muted mb-0">
          Создание, просмотр и редактирование дисциплин
        </p>
      </div>

      {loadError && <Alert variant="danger">{loadError}</Alert>}
      {actionError && <Alert variant="danger">{actionError}</Alert>}

      <Card>
        <Card.Body>
          <Card.Title className="mb-3">
            {isEditMode ? 'Редактирование дисциплины' : 'Создание дисциплины'}
          </Card.Title>

          <DisciplineForm
            values={formValues}
            submitText={
              isEditMode ? 'Сохранить изменения' : 'Создать дисциплину'
            }
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
            <Card.Title className="mb-0">Список дисциплин</Card.Title>

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
              <span>Загрузка дисциплин...</span>
            </div>
          ) : sortedDisciplines.length === 0 ? (
            <Alert variant="light" className="mb-0">
              Список дисциплин пуст
            </Alert>
          ) : (
            <Table responsive bordered hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th style={{ width: '260px' }}>Название</th>
                  <th>Описание</th>
                </tr>
              </thead>
              <tbody>
                {sortedDisciplines.map((discipline, index) => (
                  <tr key={discipline.id}>
                    <td>{index + 1}</td>
                    <td>{discipline.name}</td>
                    <td>{discipline.description}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => startEdit(discipline)}
                        >
                          Редактировать
                        </Button>

                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(discipline)}
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
