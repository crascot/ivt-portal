import { Alert, Card, Form } from 'react-bootstrap';

import { GroupShort, ScheduleDto } from '@entities/scheduleRequest';

import { ScheduleTable } from './ScheduleTable';

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
    <div className="d-flex flex-column gap-4">
      <Card>
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
        <ScheduleTable schedule={schedule} />
      ) : (
        <Alert variant="info">Выберите группу для просмотра расписания</Alert>
      )}
    </div>
  );
};
