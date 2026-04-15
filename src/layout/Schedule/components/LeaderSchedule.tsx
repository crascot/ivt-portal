import { useState } from 'react';
import { Alert, Button, Card } from 'react-bootstrap';

import {
  AddScheduleDto,
  DisciplineShort,
  ScheduleDto,
  TeacherShort,
} from '@entities/scheduleRequest';

import { ScheduleForm } from './ScheduleForm';
import { ScheduleTable } from './ScheduleTable';

type Props = {
  groupId: number;
  groupName: string | null;
  schedule: ScheduleDto[];
  disciplines: DisciplineShort[];
  teachers: TeacherShort[];
  actionError: string | null;
  onAdd: (dto: AddScheduleDto) => Promise<void>;
  onUpdate: (id: number, dto: AddScheduleDto) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

export const LeaderSchedule = ({
  groupId,
  groupName,
  schedule,
  disciplines,
  teachers,
  actionError,
  onAdd,
  onUpdate,
  onDelete,
}: Props) => {
  const [editingItem, setEditingItem] = useState<ScheduleDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (item: ScheduleDto) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Удалить это занятие из расписания?');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete(id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (dto: AddScheduleDto) => {
    if (editingItem) {
      await onUpdate(editingItem.id, dto);
      setEditingItem(null);
      setShowForm(false);
    } else {
      await onAdd(dto);
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
    setShowForm(false);
  };

  return (
    <div className="d-flex flex-column gap-4">
      {actionError && <Alert variant="danger">{actionError}</Alert>}

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Card.Title className="mb-0">
              {editingItem ? 'Редактирование занятия' : 'Добавить занятие'}
            </Card.Title>
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>
                Добавить занятие
              </Button>
            )}
          </div>

          {showForm && (
            <ScheduleForm
              groupId={groupId}
              disciplines={disciplines}
              teachers={teachers}
              editingItem={editingItem}
              existingSchedule={schedule}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Card.Title className="mb-3">
            Расписание группы {groupName}
          </Card.Title>

          <ScheduleTable
            schedule={schedule}
            canEdit
            onEdit={handleEdit}
            onDelete={handleDelete}
            isDeleting={isDeleting}
          />
        </Card.Body>
      </Card>
    </div>
  );
};
