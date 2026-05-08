import { useState } from 'react';
import { Alert, Button, Card } from 'react-bootstrap';
import { FiPlus } from 'react-icons/fi';

import {
  AddScheduleDto,
  DisciplineShort,
  ScheduleDto,
  TeacherShort,
} from '@entities/scheduleRequest';

import { ScheduleForm } from './ScheduleForm';
import { ScheduleTable } from './ScheduleTable';

import s from '../Schedule.module.css';

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
    <div className={s.scheduleStack}>
      {actionError && <Alert variant="danger">{actionError}</Alert>}

      <Card className={s.editorCard}>
        <Card.Body>
          <div className={s.editorHeader}>
            <Card.Title className="mb-0">
              {editingItem ? 'Редактирование занятия' : 'Добавить занятие'}
            </Card.Title>
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>
                <FiPlus />
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

      <section className={s.diarySection}>
        <div className={s.sectionHeader}>
          <div>
            <h2>Расписание группы {groupName}</h2>
            <p>Занятия сгруппированы по дням недели и времени начала.</p>
          </div>
        </div>

        <ScheduleTable
          schedule={schedule}
          canEdit
          onEdit={handleEdit}
          onDelete={handleDelete}
          isDeleting={isDeleting}
        />
      </section>
    </div>
  );
};
