import { Alert, Card, Form } from 'react-bootstrap';

import { GroupShort, ScheduleDto } from '@entities/scheduleRequest';

import { ScheduleTable } from './ScheduleTable';

import s from '../Schedule.module.css';

type Props = {
  groups: GroupShort[];
  selectedGroupId: number | null;
  schedule: ScheduleDto[];
  onSelectGroup: (groupId: number) => void;
};

export const AdminSchedule = ({
  groups,
  selectedGroupId,
  schedule,
  onSelectGroup,
}: Props) => {
  return (
    <div className={s.scheduleStack}>
      <Card className={s.selectorCard}>
        <Card.Body>
          <Card.Title className="mb-3">Выберите группу</Card.Title>
          <Form.Select
            value={selectedGroupId ?? ''}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val) onSelectGroup(val);
            }}
          >
            <option value="">— Выберите группу —</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} (курс {g.courseNumber}, {g.specialty})
              </option>
            ))}
          </Form.Select>
        </Card.Body>
      </Card>

      {selectedGroupId ? (
        <section className={s.diarySection}>
          <div className={s.sectionHeader}>
            <div>
              <h2>Расписание выбранной группы</h2>
              <p>По дням недели, количеству занятий и времени проведения.</p>
            </div>
          </div>
          <ScheduleTable schedule={schedule} />
        </section>
      ) : (
        <Alert variant="info">Выберите группу для просмотра расписания</Alert>
      )}
    </div>
  );
};
